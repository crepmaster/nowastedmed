/**
 * Delivery Models
 *
 * Models for delivery and courier tracking
 */

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

/**
 * Delivery Record
 */
export interface Delivery {
    id: string;
    exchangeId: string;
    courierId?: string;
    courierName?: string;
    courierPhone?: string;

    // Origin (From pharmacy)
    fromPharmacyId: string;
    fromPharmacyName: string;
    fromAddress: string;
    fromPhone: string;

    // Destination (To pharmacy)
    toPharmacyId: string;
    toPharmacyName: string;
    toAddress: string;
    toPhone: string;

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

    // Fees
    deliveryFee?: number;
    currency?: string;

    createdAt: Date | any;
    updatedAt: Date | any;
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
    dateFrom?: Date;
    dateTo?: Date;
}
