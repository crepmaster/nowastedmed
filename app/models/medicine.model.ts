import { MedicineCategory, MedicineForm, StorageCondition, AfricanRegion, LocalizedText } from '../data/medicine-database.model';

/**
 * Medicine listing by a pharmacy
 * Can be linked to database entry OR custom entry
 */
export interface Medicine {
  id: string;

  // === Reference to medicine database (if from database) ===
  /** ID from medicine database (null if custom entry) */
  databaseId?: string;

  // === Medicine identification ===
  /** International Nonproprietary Name (INN/DCI) */
  inn: string;
  /** Display name (localized based on user's language) */
  name: string;
  /** Brand name (optional, for reference) */
  brandName?: string;

  // === Medicine details ===
  /** Pharmaceutical form */
  form: MedicineForm;
  /** Dosage/strength (e.g., "500mg", "250mg/5ml") */
  dosage: string;
  /** Therapeutic category */
  category: MedicineCategory;

  // === Pharmacy listing details ===
  pharmacyId: string;
  pharmacyName?: string;
  /** Batch/lot number */
  batchNumber: string;
  /** Expiry date */
  expiryDate: Date;
  /** Total quantity in stock */
  quantity: number;
  /** Quantity available for exchange/sale */
  exchangeQuantity?: number;

  // === Pricing (PRIVATE - not visible to other pharmacies in listings) ===
  /**
   * Price per unit (in local currency)
   * This is NEVER shown in public listings
   * Only shared during private negotiation after request is made
   */
  price?: number;
  /** Currency code (e.g., 'XOF', 'NGN', 'KES') */
  currency?: string;

  // === Listing status ===
  status?: 'available' | 'for_exchange' | 'for_sale' | 'pending' | 'exchanged' | 'sold';
  availableForExchange?: boolean;
  availableForSale?: boolean;

  // === Storage and handling ===
  storageConditions?: StorageCondition[];
  prescriptionRequired?: boolean;

  // === Custom entry flag ===
  /** True if this medicine was manually entered (not from database) */
  isCustomEntry?: boolean;
  /** If custom entry, pending review by admin */
  pendingDatabaseReview?: boolean;

  // === Timestamps ===
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request to add a new medicine to the database
 * Created when pharmacy enters a custom medicine
 */
export interface MedicineAdditionRequest {
  id: string;
  /** Requesting pharmacy ID */
  pharmacyId: string;
  pharmacyName: string;

  /** Proposed medicine details */
  inn: string;
  name: LocalizedText;
  form: MedicineForm;
  dosage: string;
  category: MedicineCategory;
  brandNames?: string[];
  description?: LocalizedText;

  /** Region where this medicine is available */
  region: AfricanRegion;

  /** Request status */
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  createdAt: Date;
}

export interface Exchange {
  id: string;
  medicineId: string;
  fromPharmacyId: string;
  toPharmacyId?: string;
  courierId?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'completed' | 'requested';
  createdAt: Date;
  qrCode: string;
  medicineName: string;
  fromPharmacyName: string;
  quantity: number;
}