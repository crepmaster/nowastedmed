/**
 * On Exchange Accepted - Cloud Function Trigger
 *
 * Firestore trigger that creates a delivery when an exchange is accepted.
 * This is the missing link between exchange acceptance and delivery creation.
 *
 * Flow:
 * 1. Trigger on exchanges/{exchangeId} update where status changes to 'accepted'
 * 2. Fetch both pharmacy profiles with coordinates
 * 3. Calculate delivery fee based on city config
 * 4. Create delivery document with payment structure
 * 5. Delivery starts in 'awaiting_payment' status
 *
 * After this trigger:
 * - Both pharmacies see the delivery and can pay via payDeliveryFee
 * - When both pay, delivery becomes 'pending' (visible to couriers)
 * - Courier accepts → 'assigned' → 'picked_up' → 'in_transit' → 'delivered'
 * - onDeliveryCompleted creates courier earnings
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  db,
  COLLECTIONS,
  createAuditLog
} from '../utils/firestore';

/**
 * Exchange document structure
 */
interface Exchange {
  id: string;
  proposedBy: string;
  proposedByName?: string;
  proposedTo: string;
  proposedToName?: string;
  status: string;
  proposedMedicines: MedicineItem[];
  offeredMedicines: MedicineItem[];
  location?: {
    countryCode: string;
    cityId: string;
    cityName: string;
  };
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface MedicineItem {
  medicineId: string;
  name: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: any;
}

/**
 * Pharmacy profile structure
 */
interface Pharmacy {
  id: string;
  pharmacyName: string;
  phoneNumber: string;
  address?: string;
  location?: {
    address?: string;
    cityId?: string;
    cityName?: string;
    countryCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Delivery fee configuration
 */
interface FeeConfig {
  baseFee: number;
  currency: string;
  platformCommissionPercent: number;
  minCourierEarning: number;
}

/**
 * Default fee configurations by country
 */
const DEFAULT_FEE_CONFIGS: Record<string, { baseFee: number; currency: string }> = {
  CM: { baseFee: 500, currency: 'XAF' },      // Cameroon
  NG: { baseFee: 500, currency: 'NGN' },      // Nigeria
  KE: { baseFee: 100, currency: 'KES' },      // Kenya
  GH: { baseFee: 10, currency: 'GHS' },       // Ghana
  SN: { baseFee: 500, currency: 'XOF' },      // Senegal
  CI: { baseFee: 500, currency: 'XOF' },      // Ivory Coast
  TZ: { baseFee: 2000, currency: 'TZS' },     // Tanzania
  UG: { baseFee: 5000, currency: 'UGX' },     // Uganda
  RW: { baseFee: 500, currency: 'RWF' },      // Rwanda
  ZA: { baseFee: 50, currency: 'ZAR' },       // South Africa
};

const DEFAULT_PLATFORM_COMMISSION = 15; // 15%

/**
 * Generate QR code data for pickup/delivery verification
 */
function generateQRCode(prefix: string, exchangeId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NWM_${prefix}_${exchangeId.substring(0, 8)}_${timestamp}_${random}`;
}

/**
 * Get fee configuration for a city or use defaults
 */
async function getFeeConfig(cityId: string, countryCode: string): Promise<FeeConfig> {
  try {
    // Try to get city-specific config
    const configSnapshot = await db
      .collection('delivery_fee_configs')
      .where('cityId', '==', cityId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!configSnapshot.empty) {
      const config = configSnapshot.docs[0].data();
      return {
        baseFee: config.baseFee,
        currency: config.currency,
        platformCommissionPercent: config.platformCommissionPercent || DEFAULT_PLATFORM_COMMISSION,
        minCourierEarning: config.minCourierEarning || 0
      };
    }
  } catch (error) {
    console.warn('Error fetching fee config, using defaults:', error);
  }

  // Use country defaults
  const countryConfig = DEFAULT_FEE_CONFIGS[countryCode?.toUpperCase()] || { baseFee: 500, currency: 'XAF' };
  return {
    baseFee: countryConfig.baseFee,
    currency: countryConfig.currency,
    platformCommissionPercent: DEFAULT_PLATFORM_COMMISSION,
    minCourierEarning: 0
  };
}

/**
 * Firestore trigger: When exchange status changes to 'accepted'
 */
export const onExchangeAccepted = onDocumentUpdated(
  {
    document: 'exchanges/{exchangeId}',
    region: 'europe-west1'
  },
  async (event) => {
    const beforeData = event.data?.before.data() as Exchange | undefined;
    const afterData = event.data?.after.data() as Exchange | undefined;
    const exchangeId = event.params.exchangeId;

    // Check if this is a status change to 'accepted'
    if (!beforeData || !afterData) {
      console.log('Missing data in trigger');
      return;
    }

    // Only trigger when status changes TO 'accepted'
    if (beforeData.status === afterData.status || afterData.status !== 'accepted') {
      return;
    }

    console.log(`Exchange ${exchangeId} accepted, creating delivery...`);

    try {
      // 1. Check if delivery already exists for this exchange (idempotency)
      const existingDelivery = await db
        .collection(COLLECTIONS.DELIVERIES)
        .where('exchangeId', '==', exchangeId)
        .limit(1)
        .get();

      if (!existingDelivery.empty) {
        console.log(`Delivery already exists for exchange ${exchangeId}, skipping`);
        return;
      }

      // 2. Get both pharmacy profiles
      const [fromPharmacyDoc, toPharmacyDoc] = await Promise.all([
        db.collection(COLLECTIONS.PHARMACIES).doc(afterData.proposedBy).get(),
        db.collection(COLLECTIONS.PHARMACIES).doc(afterData.proposedTo).get()
      ]);

      if (!fromPharmacyDoc.exists || !toPharmacyDoc.exists) {
        console.error('One or both pharmacies not found');
        throw new Error('Pharmacy profiles not found');
      }

      const fromPharmacy = { id: fromPharmacyDoc.id, ...fromPharmacyDoc.data() } as Pharmacy;
      const toPharmacy = { id: toPharmacyDoc.id, ...toPharmacyDoc.data() } as Pharmacy;

      // 3. Get exchange location (required - exchanges are same-city only)
      const location = afterData.location;
      if (!location || !location.cityId) {
        console.error('Exchange missing location data');
        throw new Error('Exchange location is required');
      }

      // 4. Calculate delivery fee
      const feeConfig = await getFeeConfig(location.cityId, location.countryCode);
      const deliveryFee = feeConfig.baseFee;
      const feePerPharmacy = Math.ceil(deliveryFee / 2); // Split between both pharmacies

      // 5. Prepare medicine details from both sides
      const medicineDetails = [
        ...(afterData.proposedMedicines || []).map(m => ({
          medicineId: m.medicineId,
          name: m.name,
          quantity: m.quantity,
          batchNumber: m.batchNumber || '',
          expiryDate: m.expiryDate || null
        })),
        ...(afterData.offeredMedicines || []).map(m => ({
          medicineId: m.medicineId,
          name: m.name,
          quantity: m.quantity,
          batchNumber: m.batchNumber || '',
          expiryDate: m.expiryDate || null
        }))
      ];

      // 6. Create delivery document
      const now = Date.now();
      const deliveryData = {
        exchangeId,

        // Location - city where delivery takes place
        location: {
          countryCode: location.countryCode,
          cityId: location.cityId,
          cityName: location.cityName
        },

        // From pharmacy (proposer - sending medicines)
        fromPharmacyId: fromPharmacy.id,
        fromPharmacyName: fromPharmacy.pharmacyName || 'Unknown Pharmacy',
        fromAddress: fromPharmacy.location?.address || fromPharmacy.address || '',
        fromPhone: fromPharmacy.phoneNumber || '',
        fromCoordinates: fromPharmacy.location?.coordinates || null,

        // To pharmacy (responder - receiving medicines)
        toPharmacyId: toPharmacy.id,
        toPharmacyName: toPharmacy.pharmacyName || 'Unknown Pharmacy',
        toAddress: toPharmacy.location?.address || toPharmacy.address || '',
        toPhone: toPharmacy.phoneNumber || '',
        toCoordinates: toPharmacy.location?.coordinates || null,

        // Status - awaiting payment from both pharmacies
        status: 'awaiting_payment',
        statusHistory: [{
          status: 'awaiting_payment',
          timestamp: now,
          note: 'Delivery created after exchange accepted',
          updatedBy: 'system'
        }],

        // Medicine info
        medicineCount: medicineDetails.length,
        medicineDetails,

        // QR codes for verification
        pickupQRCode: generateQRCode('PICKUP', exchangeId),
        deliveryQRCode: generateQRCode('DELIVER', exchangeId),

        // Fees - split between pharmacies
        deliveryFee,
        currency: feeConfig.currency,
        feePerPharmacy,

        // Payment structure for each pharmacy
        fromPharmacyPayment: {
          pharmacyId: fromPharmacy.id,
          pharmacyName: fromPharmacy.pharmacyName || 'Unknown',
          amount: feePerPharmacy,
          currency: feeConfig.currency,
          status: 'pending'
        },
        toPharmacyPayment: {
          pharmacyId: toPharmacy.id,
          pharmacyName: toPharmacy.pharmacyName || 'Unknown',
          amount: feePerPharmacy,
          currency: feeConfig.currency,
          status: 'pending'
        },

        // Overall payment status
        paymentStatus: 'awaiting_payment',

        // Notes
        specialInstructions: afterData.notes || '',

        // Timestamps
        createdAt: now,
        updatedAt: now
      };

      // 7. Create the delivery document
      const deliveryRef = await db.collection(COLLECTIONS.DELIVERIES).add(deliveryData);

      console.log(`Delivery ${deliveryRef.id} created for exchange ${exchangeId}`);
      console.log(`Fee: ${deliveryFee} ${feeConfig.currency} (${feePerPharmacy} per pharmacy)`);

      // 8. Update exchange with delivery reference
      await db.collection('exchanges').doc(exchangeId).update({
        deliveryId: deliveryRef.id,
        updatedAt: now
      });

      // 9. Create audit log
      await createAuditLog({
        userId: 'system',
        action: 'delivery_created',
        resource: 'delivery',
        resourceId: deliveryRef.id,
        details: {
          exchangeId,
          fromPharmacyId: fromPharmacy.id,
          toPharmacyId: toPharmacy.id,
          deliveryFee,
          currency: feeConfig.currency,
          medicineCount: medicineDetails.length
        }
      });

      console.log(`✅ Delivery creation complete for exchange ${exchangeId}`);

    } catch (error: any) {
      console.error(`Failed to create delivery for exchange ${exchangeId}:`, error);

      // Create error audit log
      await createAuditLog({
        userId: 'system',
        action: 'delivery_creation_failed',
        resource: 'exchange',
        resourceId: exchangeId,
        details: {
          error: error.message || 'Unknown error'
        }
      });

      // Re-throw to mark function as failed
      throw error;
    }
  }
);
