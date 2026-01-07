/**
 * Delivery Completed Trigger
 *
 * Firestore trigger that fires when a delivery status changes to 'delivered'.
 * Creates courier earning record and updates courier wallet.
 *
 * This replaces client-side earning creation in courier-earnings-firebase.service.ts
 *
 * Flow:
 * 1. Detect delivery status change to 'delivered'
 * 2. Verify earning doesn't already exist (idempotency)
 * 3. Calculate courier earnings (delivery fee - platform commission)
 * 4. Create earning record with 'pending' status
 * 5. Update courier wallet pending balance
 * 6. Create audit log
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  db,
  COLLECTIONS,
  FieldValue,
  createAuditLog
} from '../utils/firestore';

// Platform commission percentage (15%)
const PLATFORM_COMMISSION_PERCENT = 15;

// Hours before earnings become available for payout
const EARNINGS_HOLD_HOURS = 24;

/**
 * Delivery document structure (subset of fields we need)
 */
interface DeliveryData {
  id?: string;
  status: string;
  courierId?: string;
  fromPharmacyId: string;
  fromPharmacyName: string;
  toPharmacyId: string;
  toPharmacyName: string;
  exchangeId: string;
  deliveryFee?: number;
  currency?: string;
  location?: {
    cityId?: string;
    cityName?: string;
    countryCode?: string;
  };
  paymentStatus?: string;
}

/**
 * Firestore trigger: On delivery document update
 * Fires when any delivery document is updated
 */
export const onDeliveryCompleted = onDocumentUpdated(
  {
    document: 'deliveries/{deliveryId}',
    region: 'europe-west1'
  },
  async (event) => {
    const beforeData = event.data?.before.data() as DeliveryData | undefined;
    const afterData = event.data?.after.data() as DeliveryData | undefined;
    const deliveryId = event.params.deliveryId;

    // Skip if no data
    if (!beforeData || !afterData) {
      console.log('No data in event, skipping');
      return;
    }

    // Only process if status changed TO 'delivered'
    if (beforeData.status === 'delivered' || afterData.status !== 'delivered') {
      return; // Not a delivery completion event
    }

    console.log(`Delivery ${deliveryId} completed, creating courier earning`);

    const courierId = afterData.courierId;
    if (!courierId) {
      console.error(`Delivery ${deliveryId} has no courier assigned`);
      return;
    }

    // Check payment status - only create earning if payment is complete
    if (afterData.paymentStatus !== 'payment_complete' && afterData.paymentStatus !== 'released_to_courier') {
      console.log(`Delivery ${deliveryId} payment not complete yet, status: ${afterData.paymentStatus}`);
      // We'll still create the earning but note that payment might not be confirmed
      // The release function will handle this
    }

    try {
      // Check if earning already exists for this delivery (idempotency)
      const existingEarning = await db
        .collection(COLLECTIONS.COURIER_EARNINGS)
        .where('deliveryId', '==', deliveryId)
        .limit(1)
        .get();

      if (!existingEarning.empty) {
        console.log(`Earning already exists for delivery ${deliveryId}, skipping`);
        return;
      }

      // Calculate earnings
      const deliveryFee = afterData.deliveryFee || 0;
      const currency = afterData.currency || 'XAF';

      if (deliveryFee <= 0) {
        console.error(`Delivery ${deliveryId} has no delivery fee set`);
        return;
      }

      const platformFee = Math.round((deliveryFee * PLATFORM_COMMISSION_PERCENT) / 100);
      const courierEarning = deliveryFee - platformFee;

      // Convert to cents for storage (Cloud Functions use cents)
      const deliveryFeeCents = Math.round(deliveryFee * 100);
      const platformFeeCents = Math.round(platformFee * 100);
      const courierEarningCents = Math.round(courierEarning * 100);

      // Calculate when earnings become available
      const now = Date.now();
      const availableAt = now + (EARNINGS_HOLD_HOURS * 60 * 60 * 1000);

      // Create earning record
      const earningData = {
        courierId,
        deliveryId,
        exchangeId: afterData.exchangeId,
        // Store both cents and display amounts for compatibility
        amountCents: deliveryFeeCents,
        amount: deliveryFee,
        currency,
        platformFeeCents,
        platformFee,
        netAmountCents: courierEarningCents,
        netAmount: courierEarning,
        status: 'pending',
        fromPharmacyName: afterData.fromPharmacyName,
        toPharmacyName: afterData.toPharmacyName,
        cityName: afterData.location?.cityName || '',
        deliveryCompletedAt: now,
        earnedAt: now, // Used by release function
        availableAt,
        createdAt: now,
        updatedAt: now
      };

      // Use transaction to create earning and update wallet atomically
      await db.runTransaction(async (transaction) => {
        // Create earning record
        const earningRef = db.collection(COLLECTIONS.COURIER_EARNINGS).doc();
        transaction.set(earningRef, earningData);

        // Update courier wallet
        const walletRef = db.collection(COLLECTIONS.COURIER_WALLETS).doc(courierId);
        const walletDoc = await transaction.get(walletRef);

        if (walletDoc.exists) {
          // Update existing wallet - add to pending balance
          transaction.update(walletRef, {
            pendingBalance: FieldValue.increment(courierEarning),
            pendingCents: FieldValue.increment(courierEarningCents),
            totalEarned: FieldValue.increment(courierEarning),
            totalEarnedCents: FieldValue.increment(courierEarningCents),
            updatedAt: now
          });
        } else {
          // Create new wallet
          transaction.set(walletRef, {
            courierId,
            availableBalance: 0,
            availableCents: 0,
            pendingBalance: courierEarning,
            pendingCents: courierEarningCents,
            totalEarned: courierEarning,
            totalEarnedCents: courierEarningCents,
            totalWithdrawn: 0,
            totalWithdrawnCents: 0,
            currency,
            createdAt: now,
            updatedAt: now
          });
        }

        console.log(`Created earning ${earningRef.id} for courier ${courierId}: ${courierEarning} ${currency}`);
      });

      // Create audit log
      await createAuditLog({
        userId: courierId,
        action: 'earning_created',
        resource: 'courier_earning',
        resourceId: deliveryId,
        details: {
          deliveryId,
          deliveryFee,
          platformFee,
          courierEarning,
          currency
        }
      });

      console.log(`Successfully created earning for delivery ${deliveryId}`);

    } catch (error: any) {
      console.error(`Error creating earning for delivery ${deliveryId}:`, error);
      // Don't throw - we don't want to fail the trigger
      // The earning can be created manually or by a retry mechanism
    }
  }
);
