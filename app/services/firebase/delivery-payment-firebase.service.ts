/**
 * Delivery Payment Firebase Service
 *
 * Handles delivery fee payments from pharmacies.
 * Both pharmacies split the delivery fee 50/50.
 *
 * Payment Flow:
 * 1. Exchange is accepted -> Delivery is created with 'awaiting_payment' status
 * 2. Both pharmacies pay their share (can pay from wallet or mobile money)
 * 3. Once both paid -> Delivery becomes 'pending' and visible to couriers
 * 4. Courier completes delivery -> Payment released to courier
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { FieldValue } from '@nativescript/firebase-firestore';
import { AuthFirebaseService } from './auth-firebase.service';
import { CourierEarningsFirebaseService } from './courier-earnings-firebase.service';
import {
    Delivery,
    DeliveryPayment,
    DeliveryPaymentStatus,
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
    private authService: AuthFirebaseService;
    private earningsService: CourierEarningsFirebaseService;

    private readonly DELIVERIES_COLLECTION = 'deliveries';
    private readonly WALLETS_COLLECTION = 'wallets';
    private readonly LEDGER_COLLECTION = 'ledger';

    private constructor() {
        this.firestore = firebase().firestore();
        this.authService = AuthFirebaseService.getInstance();
        this.earningsService = CourierEarningsFirebaseService.getInstance();
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
     */
    async payFromWallet(deliveryId: string, pharmacyId: string): Promise<void> {
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

            // Check wallet balance
            const walletDoc = await this.firestore
                .collection(this.WALLETS_COLLECTION)
                .doc(pharmacyId)
                .get();

            if (!walletDoc.exists) {
                throw new Error('Wallet not found');
            }

            const wallet = walletDoc.data();
            if (wallet.balance < payment.amount) {
                throw new Error(`Insufficient balance. Required: ${payment.amount} ${payment.currency}, Available: ${wallet.balance} ${wallet.currency}`);
            }

            // Use batch for atomic update
            const batch = this.firestore.batch();

            // Deduct from wallet
            const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(pharmacyId);
            batch.update(walletRef, {
                balance: FieldValue.increment(-payment.amount),
                updatedAt: new Date(),
            });

            // Create ledger entry
            const ledgerRef = this.firestore.collection(this.LEDGER_COLLECTION).doc();
            batch.set(ledgerRef, {
                userId: pharmacyId,
                type: 'debit',
                amount: payment.amount,
                currency: payment.currency,
                description: `Delivery fee for delivery ${deliveryId}`,
                reference: deliveryId,
                referenceType: 'delivery_payment',
                status: 'completed',
                createdAt: new Date(),
            });

            // Update payment status
            const paymentField = isFromPharmacy ? 'fromPharmacyPayment' : 'toPharmacyPayment';
            const updatedPayment: DeliveryPayment = {
                ...payment,
                status: 'paid',
                paidAt: new Date(),
                paymentMethod: 'wallet',
                transactionId: ledgerRef.id,
            };

            // Check if other party has paid
            const otherPayment = isFromPharmacy
                ? delivery.toPharmacyPayment
                : delivery.fromPharmacyPayment;
            const bothPaid = otherPayment?.status === 'paid';

            const deliveryRef = this.firestore.collection(this.DELIVERIES_COLLECTION).doc(deliveryId);
            batch.update(deliveryRef, {
                [paymentField]: updatedPayment,
                paymentStatus: bothPaid ? 'payment_complete' : 'partial_payment',
                // If both paid, make delivery visible to couriers
                ...(bothPaid && { status: 'pending' }),
                updatedAt: new Date(),
            });

            await batch.commit();

            console.log(`Pharmacy ${pharmacyId} paid for delivery ${deliveryId}`);

            if (bothPaid) {
                console.log('Both pharmacies paid - delivery now available for couriers');
            }
        } catch (error) {
            console.error('Error paying from wallet:', error);
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
     * Only admins or the system can initiate refunds
     */
    async refundDeliveryPayments(deliveryId: string, reason: string): Promise<void> {
        try {
            const deliveryDoc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .get();

            if (!deliveryDoc.exists) {
                throw new Error('Delivery not found');
            }

            const delivery = deliveryDoc.data() as Delivery;

            if (delivery.paymentStatus === 'released_to_courier') {
                throw new Error('Cannot refund - payment already released to courier');
            }

            const batch = this.firestore.batch();
            const deliveryRef = this.firestore.collection(this.DELIVERIES_COLLECTION).doc(deliveryId);

            // Refund from pharmacy if paid
            if (delivery.fromPharmacyPayment?.status === 'paid') {
                const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(delivery.fromPharmacyId);
                batch.update(walletRef, {
                    balance: FieldValue.increment(delivery.fromPharmacyPayment.amount),
                    updatedAt: new Date(),
                });

                // Create refund ledger entry
                const ledgerRef = this.firestore.collection(this.LEDGER_COLLECTION).doc();
                batch.set(ledgerRef, {
                    userId: delivery.fromPharmacyId,
                    type: 'credit',
                    amount: delivery.fromPharmacyPayment.amount,
                    currency: delivery.fromPharmacyPayment.currency,
                    description: `Refund for cancelled delivery ${deliveryId}: ${reason}`,
                    reference: deliveryId,
                    referenceType: 'delivery_refund',
                    status: 'completed',
                    createdAt: new Date(),
                });
            }

            // Refund to pharmacy if paid
            if (delivery.toPharmacyPayment?.status === 'paid') {
                const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(delivery.toPharmacyId);
                batch.update(walletRef, {
                    balance: FieldValue.increment(delivery.toPharmacyPayment.amount),
                    updatedAt: new Date(),
                });

                // Create refund ledger entry
                const ledgerRef = this.firestore.collection(this.LEDGER_COLLECTION).doc();
                batch.set(ledgerRef, {
                    userId: delivery.toPharmacyId,
                    type: 'credit',
                    amount: delivery.toPharmacyPayment.amount,
                    currency: delivery.toPharmacyPayment.currency,
                    description: `Refund for cancelled delivery ${deliveryId}: ${reason}`,
                    reference: deliveryId,
                    referenceType: 'delivery_refund',
                    status: 'completed',
                    createdAt: new Date(),
                });
            }

            // Update delivery payment status
            batch.update(deliveryRef, {
                paymentStatus: 'refunded',
                'fromPharmacyPayment.status': delivery.fromPharmacyPayment?.status === 'paid' ? 'refunded' : 'pending',
                'fromPharmacyPayment.refundedAt': delivery.fromPharmacyPayment?.status === 'paid' ? new Date() : null,
                'toPharmacyPayment.status': delivery.toPharmacyPayment?.status === 'paid' ? 'refunded' : 'pending',
                'toPharmacyPayment.refundedAt': delivery.toPharmacyPayment?.status === 'paid' ? new Date() : null,
                updatedAt: new Date(),
            });

            await batch.commit();

            console.log(`Refunded delivery payments for ${deliveryId}`);
        } catch (error) {
            console.error('Error refunding delivery payments:', error);
            throw error;
        }
    }

    // ========================================
    // COURIER PAYMENT RELEASE
    // ========================================

    /**
     * Release payment to courier after successful delivery
     * Called after confirmDelivery
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

            if (delivery.paymentStatus !== 'payment_complete') {
                throw new Error('Payment not complete from both pharmacies');
            }

            // Update delivery payment status
            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    paymentStatus: 'released_to_courier',
                    updatedAt: new Date(),
                });

            console.log(`Payment released to courier for delivery ${deliveryId}`);
        } catch (error) {
            console.error('Error releasing payment to courier:', error);
            throw error;
        }
    }
}
