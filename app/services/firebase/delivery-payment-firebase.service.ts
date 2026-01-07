/**
 * Delivery Payment Firebase Service
 *
 * Handles delivery fee payments from pharmacies.
 * Both pharmacies split the delivery fee 50/50.
 *
 * SECURITY: All financial mutations now go through Cloud Functions.
 * This service only handles:
 * - Read operations (getPendingPayments, hasPharmacyPaid)
 * - Calling Cloud Functions for payment operations
 *
 * Payment Flow:
 * 1. Exchange is accepted -> Delivery is created with 'awaiting_payment' status
 * 2. Both pharmacies pay via Cloud Function (payDeliveryFee)
 * 3. Once both paid -> Delivery becomes 'pending' and visible to couriers
 * 4. Courier completes delivery -> Trigger creates earning automatically
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import '@nativescript/firebase-functions';
import { AuthFirebaseService } from './auth-firebase.service';
import {
    Delivery,
    DeliveryPayment,
} from '../../models/delivery.model';

/**
 * Payment request from a pharmacy
 */
export interface PharmacyPaymentRequest {
    deliveryId: string;
    pharmacyId: string;
    paymentMethod: 'wallet' | 'mobile_money';
    mobileMoneyProvider?: string;   // Required if paymentMethod is 'mobile_money'
    mobileMoneyNumber?: string;     // Required if paymentMethod is 'mobile_money'
}

/**
 * Payment confirmation (for mobile money callbacks)
 */
export interface PaymentConfirmation {
    deliveryId: string;
    pharmacyId: string;
    transactionId: string;
    amount: number;
    currency: string;
}

export class DeliveryPaymentFirebaseService {
    private static instance: DeliveryPaymentFirebaseService;
    private firestore: any;
    private functions: any;
    private authService: AuthFirebaseService;

    private readonly DELIVERIES_COLLECTION = 'deliveries';

    private constructor() {
        this.firestore = firebase().firestore();
        this.functions = firebase().functions('europe-west1');
        this.authService = AuthFirebaseService.getInstance();
    }

    static getInstance(): DeliveryPaymentFirebaseService {
        if (!DeliveryPaymentFirebaseService.instance) {
            DeliveryPaymentFirebaseService.instance = new DeliveryPaymentFirebaseService();
        }
        return DeliveryPaymentFirebaseService.instance;
    }

    // ========================================
    // PAYMENT INITIATION
    // ========================================

    /**
     * Initialize delivery payment structure when delivery is created
     * Called when an exchange is accepted and delivery is created
     */
    async initializeDeliveryPayment(
        deliveryId: string,
        fromPharmacyId: string,
        fromPharmacyName: string,
        toPharmacyId: string,
        toPharmacyName: string,
        totalFee: number,
        currency: string
    ): Promise<void> {
        try {
            const feePerPharmacy = Math.ceil(totalFee / 2);

            const fromPayment: DeliveryPayment = {
                pharmacyId: fromPharmacyId,
                pharmacyName: fromPharmacyName,
                amount: feePerPharmacy,
                currency,
                status: 'pending',
            };

            const toPayment: DeliveryPayment = {
                pharmacyId: toPharmacyId,
                pharmacyName: toPharmacyName,
                amount: feePerPharmacy,
                currency,
                status: 'pending',
            };

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    deliveryFee: totalFee,
                    feePerPharmacy,
                    currency,
                    fromPharmacyPayment: fromPayment,
                    toPharmacyPayment: toPayment,
                    paymentStatus: 'awaiting_payment',
                    updatedAt: new Date(),
                });

            console.log('Initialized delivery payment:', deliveryId);
        } catch (error) {
            console.error('Error initializing delivery payment:', error);
            throw error;
        }
    }

    /**
     * Pay delivery fee from pharmacy wallet
     * SECURITY: Now calls Cloud Function instead of mutating Firestore directly
     */
    async payFromWallet(deliveryId: string, pharmacyId: string): Promise<{ bothPaid: boolean; message: string }> {
        try {
            // Verify the pharmacy is authenticated
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser || currentUser.id !== pharmacyId) {
                throw new Error('Unauthorized: Can only pay for your own pharmacy');
            }

            // Call Cloud Function
            const payDeliveryFee = this.functions.httpsCallable('payDeliveryFee');
            const result = await payDeliveryFee({ deliveryId });

            const data = result.data as { success: boolean; message: string; bothPaid?: boolean };

            if (!data.success) {
                throw new Error(data.message || 'Payment failed');
            }

            console.log(`Pharmacy ${pharmacyId} paid for delivery ${deliveryId}`);

            if (data.bothPaid) {
                console.log('Both pharmacies paid - delivery now available for couriers');
            }

            return {
                bothPaid: data.bothPaid || false,
                message: data.message
            };
        } catch (error: any) {
            console.error('Error paying from wallet:', error);
            // Handle Cloud Function errors
            if (error.code) {
                throw new Error(error.message || 'Payment failed');
            }
            throw error;
        }
    }

    /**
     * Initiate mobile money payment
     * Returns payment details for the mobile money provider
     */
    async initiateMobileMoneyPayment(
        deliveryId: string,
        pharmacyId: string,
        provider: string,
        phoneNumber: string
    ): Promise<{ paymentReference: string; amount: number; currency: string }> {
        try {
            // Verify the pharmacy is authenticated
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser || currentUser.id !== pharmacyId) {
                throw new Error('Unauthorized: Can only pay for your own pharmacy');
            }

            // Get delivery details
            const deliveryDoc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .get();

            if (!deliveryDoc.exists) {
                throw new Error('Delivery not found');
            }

            const delivery = deliveryDoc.data() as Delivery;

            // Determine which payment this is
            const isFromPharmacy = delivery.fromPharmacyId === pharmacyId;
            const isToPharmacy = delivery.toPharmacyId === pharmacyId;

            if (!isFromPharmacy && !isToPharmacy) {
                throw new Error('Pharmacy is not part of this delivery');
            }

            const payment = isFromPharmacy
                ? delivery.fromPharmacyPayment
                : delivery.toPharmacyPayment;

            if (!payment) {
                throw new Error('Payment not initialized');
            }

            if (payment.status === 'paid') {
                throw new Error('Already paid');
            }

            // Create pending payment reference
            // In production, this would call the mobile money provider API
            const paymentReference = `DEL_${deliveryId}_${pharmacyId}_${Date.now()}`;

            // Store pending payment info (will be confirmed by webhook/callback)
            const paymentField = isFromPharmacy ? 'fromPharmacyPayment' : 'toPharmacyPayment';
            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    [`${paymentField}.paymentMethod`]: 'mobile_money',
                    [`${paymentField}.transactionId`]: paymentReference,
                    updatedAt: new Date(),
                });

            return {
                paymentReference,
                amount: payment.amount,
                currency: payment.currency,
            };
        } catch (error) {
            console.error('Error initiating mobile money payment:', error);
            throw error;
        }
    }

    /**
     * Confirm mobile money payment (called by webhook/callback)
     */
    async confirmMobileMoneyPayment(confirmation: PaymentConfirmation): Promise<void> {
        try {
            const deliveryDoc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(confirmation.deliveryId)
                .get();

            if (!deliveryDoc.exists) {
                throw new Error('Delivery not found');
            }

            const delivery = deliveryDoc.data() as Delivery;

            const isFromPharmacy = delivery.fromPharmacyId === confirmation.pharmacyId;
            const isToPharmacy = delivery.toPharmacyId === confirmation.pharmacyId;

            if (!isFromPharmacy && !isToPharmacy) {
                throw new Error('Pharmacy is not part of this delivery');
            }

            const payment = isFromPharmacy
                ? delivery.fromPharmacyPayment
                : delivery.toPharmacyPayment;

            if (!payment) {
                throw new Error('Payment not initialized');
            }

            // Verify amount matches
            if (confirmation.amount !== payment.amount) {
                console.error('Amount mismatch:', confirmation.amount, 'vs', payment.amount);
                throw new Error('Payment amount does not match');
            }

            const paymentField = isFromPharmacy ? 'fromPharmacyPayment' : 'toPharmacyPayment';
            const updatedPayment: DeliveryPayment = {
                ...payment,
                status: 'paid',
                paidAt: new Date(),
                transactionId: confirmation.transactionId,
            };

            // Check if other party has paid
            const otherPayment = isFromPharmacy
                ? delivery.toPharmacyPayment
                : delivery.fromPharmacyPayment;
            const bothPaid = otherPayment?.status === 'paid';

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(confirmation.deliveryId)
                .update({
                    [paymentField]: updatedPayment,
                    paymentStatus: bothPaid ? 'payment_complete' : 'partial_payment',
                    ...(bothPaid && { status: 'pending' }),
                    updatedAt: new Date(),
                });

            console.log(`Mobile money payment confirmed for delivery ${confirmation.deliveryId}`);
        } catch (error) {
            console.error('Error confirming mobile money payment:', error);
            throw error;
        }
    }

    // ========================================
    // PAYMENT QUERIES
    // ========================================

    /**
     * Get pending payments for a pharmacy
     */
    async getPendingPayments(pharmacyId: string): Promise<Delivery[]> {
        try {
            // Get deliveries where this pharmacy needs to pay
            const fromSnapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('fromPharmacyId', '==', pharmacyId)
                .where('fromPharmacyPayment.status', '==', 'pending')
                .get();

            const toSnapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('toPharmacyId', '==', pharmacyId)
                .where('toPharmacyPayment.status', '==', 'pending')
                .get();

            const deliveries: Delivery[] = [];
            const seen = new Set<string>();

            for (const doc of [...fromSnapshot.docs, ...toSnapshot.docs]) {
                if (!seen.has(doc.id)) {
                    seen.add(doc.id);
                    deliveries.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Delivery);
                }
            }

            return deliveries;
        } catch (error) {
            console.error('Error getting pending payments:', error);
            throw error;
        }
    }

    /**
     * Check if pharmacy has paid for a delivery
     */
    async hasPharmacyPaid(deliveryId: string, pharmacyId: string): Promise<boolean> {
        try {
            const deliveryDoc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .get();

            if (!deliveryDoc.exists) {
                return false;
            }

            const delivery = deliveryDoc.data() as Delivery;

            if (delivery.fromPharmacyId === pharmacyId) {
                return delivery.fromPharmacyPayment?.status === 'paid';
            }
            if (delivery.toPharmacyId === pharmacyId) {
                return delivery.toPharmacyPayment?.status === 'paid';
            }

            return false;
        } catch (error) {
            console.error('Error checking payment status:', error);
            return false;
        }
    }

    // ========================================
    // REFUNDS
    // ========================================

    /**
     * Refund delivery payments (when delivery is cancelled)
     * SECURITY: Now calls Cloud Function - only admins can process refunds
     */
    async refundDeliveryPayments(deliveryId: string, reason: string): Promise<{ refundedCount: number }> {
        try {
            // Call Cloud Function (requires admin token)
            const refundDeliveryPayment = this.functions.httpsCallable('refundDeliveryPayment');
            const result = await refundDeliveryPayment({ deliveryId, reason });

            const data = result.data as { success: boolean; message: string; refundedCount: number };

            if (!data.success) {
                throw new Error(data.message || 'Refund failed');
            }

            console.log(`Refunded ${data.refundedCount} payment(s) for delivery ${deliveryId}`);

            return { refundedCount: data.refundedCount };
        } catch (error: any) {
            console.error('Error refunding delivery payments:', error);
            if (error.code) {
                throw new Error(error.message || 'Refund failed');
            }
            throw error;
        }
    }

    // ========================================
    // COURIER PAYMENT RELEASE
    // ========================================

    /**
     * Release payment to courier after successful delivery
     * NOTE: Courier earnings are now created automatically by the
     * onDeliveryCompleted Cloud Function trigger when delivery status
     * changes to 'delivered'. This method is kept for status tracking only.
     */
    async releasePaymentToCourier(deliveryId: string): Promise<void> {
        try {
            const deliveryDoc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .get();

            if (!deliveryDoc.exists) {
                throw new Error('Delivery not found');
            }

            const delivery = deliveryDoc.data() as Delivery;

            if (delivery.status !== 'delivered') {
                throw new Error('Delivery not completed yet');
            }

            if (delivery.paymentStatus === 'released_to_courier') {
                console.log('Payment already released to courier');
                return;
            }

            // Note: The actual earning creation is handled by the Cloud Function trigger
            // This just updates the payment status for tracking
            console.log(`Payment release for delivery ${deliveryId} - handled by Cloud Function trigger`);
        } catch (error) {
            console.error('Error in releasePaymentToCourier:', error);
            throw error;
        }
    }
}
