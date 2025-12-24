/**
 * Delivery Models
 *
 * Models for delivery and courier tracking
 *
 * IMPORTANT: Deliveries are always within the same city (exchanges are same-city only)
 */

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

/**
 * GPS Coordinates for delivery navigation
 */
export interface DeliveryCoordinates {
    latitude: number;
    longitude: number;
}

/**
 * Location for delivery (city-level)
 */
export interface DeliveryLocation {
    countryCode: string;
    cityId: string;
    cityName: string;
}

/**
 * Delivery Record
 */
export interface Delivery {
    id: string;
    exchangeId: string;
    courierId?: string;
    courierName?: string;
    courierPhone?: string;

    // Location - city where delivery takes place (both pharmacies in same city)
    location?: DeliveryLocation;

    // Origin (From pharmacy)
    fromPharmacyId: string;
    fromPharmacyName: string;
    fromAddress: string;
    fromPhone: string;
    fromCoordinates?: DeliveryCoordinates;  // GPS coordinates for pickup location

    // Destination (To pharmacy)
    toPharmacyId: string;
    toPharmacyName: string;
    toAddress: string;
    toPhone: string;
    toCoordinates?: DeliveryCoordinates;    // GPS coordinates for delivery location

    // Status tracking
    status: DeliveryStatus;
    statusHistory: DeliveryStatusChange[];

    // Timing
    scheduledPickupTime?: Date | any;
    actualPickupTime?: Date | any;
    scheduledDeliveryTime?: Date | any;
    actualDeliveryTime?: Date | any;
    estimatedDuration?: number; // in minutes

    // Verification
    pickupQRCode?: string;
    deliveryQRCode?: string;
    pickupSignature?: string;
    deliverySignature?: string;
    pickupPhoto?: string;
    deliveryPhoto?: string;

    // Medicine info
    medicineCount: number;
    medicineDetails: DeliveryMedicineItem[];

    // Notes
    pickupNotes?: string;
    deliveryNotes?: string;
    specialInstructions?: string;

    // Fees - Split between both pharmacies
    deliveryFee?: number;           // Total delivery fee
    currency?: string;
    feePerPharmacy?: number;        // Each pharmacy pays this amount (deliveryFee / 2)

    // Payment status from pharmacies
    fromPharmacyPayment?: DeliveryPayment;  // Payment from sender pharmacy
    toPharmacyPayment?: DeliveryPayment;    // Payment from receiver pharmacy
    paymentStatus: DeliveryPaymentStatus;   // Overall payment status

    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Payment status for the delivery
 */
export type DeliveryPaymentStatus =
    | 'awaiting_payment'      // Waiting for both pharmacies to pay
    | 'partial_payment'       // One pharmacy has paid
    | 'payment_complete'      // Both pharmacies have paid, ready for courier
    | 'refunded'              // Payment was refunded (delivery cancelled)
    | 'released_to_courier';  // Payment released to courier after delivery

/**
 * Individual pharmacy payment for delivery
 */
export interface DeliveryPayment {
    pharmacyId: string;
    pharmacyName: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded';
    paidAt?: Date | any;
    refundedAt?: Date | any;
    transactionId?: string;         // Reference from payment provider
    paymentMethod?: 'wallet' | 'mobile_money';  // How they paid
}

/**
 * Delivery Status Change Entry
 */
export interface DeliveryStatusChange {
    status: DeliveryStatus;
    timestamp: Date | any;
    note?: string;
    updatedBy: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

/**
 * Medicine Item in Delivery
 */
export interface DeliveryMedicineItem {
    medicineId: string;
    name: string;
    quantity: number;
    batchNumber?: string;
    expiryDate?: Date | any;
}

/**
 * Courier Stats
 */
export interface CourierStats {
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    inTransitDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number; // in minutes
    rating: number;
    totalEarnings: number;
}

/**
 * Delivery Assignment Request
 */
export interface DeliveryAssignment {
    deliveryId: string;
    courierId: string;
    scheduledPickupTime?: Date;
    estimatedDuration?: number;
    notes?: string;
}

/**
 * Delivery Filter Options
 */
export interface DeliveryFilter {
    status?: DeliveryStatus | DeliveryStatus[];
    courierId?: string;
    fromPharmacyId?: string;
    toPharmacyId?: string;
    cityId?: string;          // Filter deliveries by city (for couriers)
    countryCode?: string;     // Filter deliveries by country
    dateFrom?: Date;
    dateTo?: Date;
}

// ========================================
// COURIER EARNINGS & PAYMENT
// ========================================

export type EarningStatus = 'pending' | 'available' | 'processing' | 'paid' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Courier Earning Record - tracks earnings per delivery
 */
export interface CourierEarning {
    id: string;
    courierId: string;
    deliveryId: string;
    exchangeId: string;

    // Amount details
    amount: number;
    currency: string;
    platformFee: number;        // Platform commission deducted
    netAmount: number;          // Amount after platform fee

    // Status tracking
    status: EarningStatus;

    // Delivery info (denormalized for quick display)
    fromPharmacyName: string;
    toPharmacyName: string;
    cityName: string;

    // Timestamps
    deliveryCompletedAt: Date | any;
    availableAt?: Date | any;   // When earnings become available for payout
    paidAt?: Date | any;

    // Payout reference
    payoutId?: string;

    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Courier Payout Request - for cashing out earnings
 */
export interface CourierPayout {
    id: string;
    courierId: string;

    // Amount
    amount: number;
    currency: string;

    // Payment method
    paymentMethod: 'mobile_money' | 'bank_transfer';
    paymentProvider?: string;   // e.g., 'mtn', 'orange', 'mpesa'
    paymentAccount: string;     // Phone number or account number
    accountHolderName: string;

    // Status
    status: PayoutStatus;
    statusHistory: PayoutStatusChange[];

    // Processing info
    transactionId?: string;     // External transaction reference
    failureReason?: string;
    processedBy?: string;       // Admin who processed

    // Related earnings
    earningIds: string[];       // Earnings included in this payout

    createdAt: Date | any;
    processedAt?: Date | any;
    completedAt?: Date | any;
}

/**
 * Payout Status Change
 */
export interface PayoutStatusChange {
    status: PayoutStatus;
    timestamp: Date | any;
    note?: string;
    updatedBy?: string;
}

/**
 * Courier Wallet - tracks courier's available balance
 */
export interface CourierWallet {
    id: string;
    courierId: string;

    // Balances
    availableBalance: number;   // Can be withdrawn
    pendingBalance: number;     // Awaiting clearance (e.g., 24-48 hour hold)
    totalEarned: number;        // Lifetime earnings
    totalWithdrawn: number;     // Lifetime withdrawals

    currency: string;

    // Preferred payout method
    preferredPaymentMethod?: 'mobile_money' | 'bank_transfer';
    preferredProvider?: string;
    paymentAccount?: string;
    accountHolderName?: string;

    updatedAt: Date | any;
}

/**
 * Delivery Fee Configuration per City
 */
export interface DeliveryFeeConfig {
    id: string;
    cityId: string;
    cityName: string;
    countryCode: string;

    // Fee structure
    baseFee: number;            // Fixed base delivery fee
    currency: string;

    // Platform commission (percentage)
    platformCommissionPercent: number;  // e.g., 15 means 15%

    // Optional distance-based pricing
    perKmFee?: number;          // Additional fee per km
    maxDistance?: number;       // Max distance in km

    // Time-based modifiers (optional)
    rushHourMultiplier?: number;    // e.g., 1.5 for 50% increase
    nightTimeMultiplier?: number;

    // Minimum earnings protection
    minCourierEarning: number;  // Minimum courier earns after commission

    isActive: boolean;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Earnings Summary for Dashboard
 */
export interface EarningsSummary {
    availableBalance: number;
    pendingBalance: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    totalEarnings: number;
    currency: string;

    // Stats
    completedDeliveriesToday: number;
    completedDeliveriesThisWeek: number;
    completedDeliveriesThisMonth: number;
}
