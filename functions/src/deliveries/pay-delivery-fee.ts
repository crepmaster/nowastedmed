/**
 * Pay Delivery Fee - Cloud Function
 *
 * Callable function that handles pharmacy payment for delivery fees.
 * Replaces client-side payFromWallet in delivery-payment-firebase.service.ts
 *
 * Flow:
 * 1. Verify pharmacy authentication
 * 2. Get delivery and verify pharmacy is involved
 * 3. Check wallet balance
 * 4. Deduct from wallet atomically
 * 5. Create ledger entry
 * 6. Update delivery payment status
 * 7. If both pharmacies paid, mark delivery as ready for couriers
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTIONS,
  FieldValue,
  createAuditLog
} from '../utils/firestore';

/**
 * Request payload
 */
interface PayDeliveryFeeRequest {
  deliveryId: string;
}

/**
 * Response payload
 */
interface PayDeliveryFeeResponse {
  success: boolean;
  message: string;
  bothPaid?: boolean;
  deliveryStatus?: string;
}

/**
 * Delivery payment structure
 */
interface DeliveryPayment {
  pharmacyId: string;
  pharmacyName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded';
  paidAt?: number;
  paymentMethod?: string;
  transactionId?: string;
}

/**
 * Pay delivery fee from pharmacy wallet
 */
export const payDeliveryFee = onCall<PayDeliveryFeeRequest, Promise<PayDeliveryFeeResponse>>(
  { region: 'europe-west1' },
  async (request: CallableRequest<PayDeliveryFeeRequest>): Promise<PayDeliveryFeeResponse> => {
    const { data, auth } = request;

    // 1. Verify authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const pharmacyId = auth.uid;
    const { deliveryId } = data;

    // 2. Validate input
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new HttpsError('invalid-argument', 'Delivery ID is required');
    }

    try {
      // 3. Get delivery details
      const deliveryRef = db.collection(COLLECTIONS.DELIVERIES).doc(deliveryId);
      const deliveryDoc = await deliveryRef.get();

      if (!deliveryDoc.exists) {
        throw new HttpsError('not-found', 'Delivery not found');
      }

      const delivery = deliveryDoc.data()!;

      // 4. Verify pharmacy is part of this delivery
      const isFromPharmacy = delivery.fromPharmacyId === pharmacyId;
      const isToPharmacy = delivery.toPharmacyId === pharmacyId;

      if (!isFromPharmacy && !isToPharmacy) {
        throw new HttpsError('permission-denied', 'You are not part of this delivery');
      }

      // 5. Get the relevant payment
      const payment: DeliveryPayment = isFromPharmacy
        ? delivery.fromPharmacyPayment
        : delivery.toPharmacyPayment;

      if (!payment) {
        throw new HttpsError('failed-precondition', 'Payment not initialized for this delivery');
      }

      if (payment.status === 'paid') {
        throw new HttpsError('already-exists', 'Payment already completed');
      }

      // 6. Get wallet and check balance
      const walletRef = db.collection(COLLECTIONS.WALLETS).doc(pharmacyId);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        throw new HttpsError('not-found', 'Wallet not found');
      }

      const wallet = walletDoc.data()!;
      const balance = wallet.balance || 0;
      const balanceCents = wallet.balanceCents || Math.round(balance * 100);

      // Check balance (use cents if available, otherwise use regular balance)
      const paymentAmountCents = Math.round(payment.amount * 100);

      if (balanceCents < paymentAmountCents && balance < payment.amount) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient balance. Required: ${payment.amount} ${payment.currency}, Available: ${balance} ${wallet.currency}`
        );
      }

      // 7. Execute payment atomically
      const now = Date.now();
      const paymentField = isFromPharmacy ? 'fromPharmacyPayment' : 'toPharmacyPayment';

      // Check if other party has paid
      const otherPayment: DeliveryPayment = isFromPharmacy
        ? delivery.toPharmacyPayment
        : delivery.fromPharmacyPayment;
      const bothPaid = otherPayment?.status === 'paid';

      const ledgerEntryId = await db.runTransaction(async (transaction) => {
        // Re-check wallet balance in transaction
        const freshWallet = await transaction.get(walletRef);
        const freshBalance = freshWallet.data()?.balance || 0;

        if (freshBalance < payment.amount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // Deduct from wallet
        transaction.update(walletRef, {
          balance: FieldValue.increment(-payment.amount),
          balanceCents: FieldValue.increment(-paymentAmountCents),
          updatedAt: now
        });

        // Create ledger entry
        const ledgerRef = db.collection(COLLECTIONS.LEDGER).doc();
        transaction.set(ledgerRef, {
          userId: pharmacyId,
          type: 'debit',
          amount: payment.amount,
          amountCents: paymentAmountCents,
          currency: payment.currency,
          description: `Delivery fee for delivery ${deliveryId}`,
          reference: deliveryId,
          referenceType: 'delivery_payment',
          status: 'completed',
          createdAt: now
        });

        // Update delivery payment status
        const updatedPayment: DeliveryPayment = {
          ...payment,
          status: 'paid',
          paidAt: now,
          paymentMethod: 'wallet',
          transactionId: ledgerRef.id
        };

        const deliveryUpdate: Record<string, any> = {
          [paymentField]: updatedPayment,
          paymentStatus: bothPaid ? 'payment_complete' : 'partial_payment',
          updatedAt: now
        };

        // If both paid, make delivery visible to couriers
        if (bothPaid) {
          deliveryUpdate.status = 'pending';
        }

        transaction.update(deliveryRef, deliveryUpdate);

        return ledgerRef.id;
      });

      // 8. Create audit log
      await createAuditLog({
        userId: pharmacyId,
        action: 'delivery_payment',
        resource: 'delivery',
        resourceId: deliveryId,
        details: {
          amount: payment.amount,
          currency: payment.currency,
          ledgerEntryId,
          bothPaid
        }
      });

      console.log(`Pharmacy ${pharmacyId} paid ${payment.amount} ${payment.currency} for delivery ${deliveryId}`);

      return {
        success: true,
        message: bothPaid
          ? 'Payment complete! Delivery is now available for couriers.'
          : 'Payment successful. Waiting for other pharmacy to pay.',
        bothPaid,
        deliveryStatus: bothPaid ? 'pending' : 'awaiting_payment'
      };

    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }

      if (error.message === 'INSUFFICIENT_BALANCE') {
        throw new HttpsError('failed-precondition', 'Insufficient wallet balance');
      }

      console.error('Pay delivery fee error:', error);
      throw new HttpsError('internal', 'Failed to process payment');
    }
  }
);

/**
 * Refund delivery payment
 * Called when a delivery is cancelled
 */
export const refundDeliveryPayment = onCall<{ deliveryId: string; reason: string }>(
  { region: 'europe-west1' },
  async (request: CallableRequest<{ deliveryId: string; reason: string }>) => {
    const { data, auth } = request;

    // Only admins can process refunds
    if (!auth?.token.admin) {
      throw new HttpsError('permission-denied', 'Only admins can process refunds');
    }

    const { deliveryId, reason } = data;

    if (!deliveryId || !reason) {
      throw new HttpsError('invalid-argument', 'Delivery ID and reason are required');
    }

    try {
      const deliveryRef = db.collection(COLLECTIONS.DELIVERIES).doc(deliveryId);
      const deliveryDoc = await deliveryRef.get();

      if (!deliveryDoc.exists) {
        throw new HttpsError('not-found', 'Delivery not found');
      }

      const delivery = deliveryDoc.data()!;

      if (delivery.paymentStatus === 'released_to_courier') {
        throw new HttpsError('failed-precondition', 'Cannot refund - payment already released to courier');
      }

      const now = Date.now();
      let refundedCount = 0;

      await db.runTransaction(async (transaction) => {
        // Refund from pharmacy if paid
        if (delivery.fromPharmacyPayment?.status === 'paid') {
          const walletRef = db.collection(COLLECTIONS.WALLETS).doc(delivery.fromPharmacyId);
          transaction.update(walletRef, {
            balance: FieldValue.increment(delivery.fromPharmacyPayment.amount),
            updatedAt: now
          });

          // Create refund ledger entry
          const ledgerRef = db.collection(COLLECTIONS.LEDGER).doc();
          transaction.set(ledgerRef, {
            userId: delivery.fromPharmacyId,
            type: 'credit',
            amount: delivery.fromPharmacyPayment.amount,
            currency: delivery.fromPharmacyPayment.currency,
            description: `Refund for cancelled delivery ${deliveryId}: ${reason}`,
            reference: deliveryId,
            referenceType: 'delivery_refund',
            status: 'completed',
            createdAt: now
          });

          refundedCount++;
        }

        // Refund to pharmacy if paid
        if (delivery.toPharmacyPayment?.status === 'paid') {
          const walletRef = db.collection(COLLECTIONS.WALLETS).doc(delivery.toPharmacyId);
          transaction.update(walletRef, {
            balance: FieldValue.increment(delivery.toPharmacyPayment.amount),
            updatedAt: now
          });

          // Create refund ledger entry
          const ledgerRef = db.collection(COLLECTIONS.LEDGER).doc();
          transaction.set(ledgerRef, {
            userId: delivery.toPharmacyId,
            type: 'credit',
            amount: delivery.toPharmacyPayment.amount,
            currency: delivery.toPharmacyPayment.currency,
            description: `Refund for cancelled delivery ${deliveryId}: ${reason}`,
            reference: deliveryId,
            referenceType: 'delivery_refund',
            status: 'completed',
            createdAt: now
          });

          refundedCount++;
        }

        // Update delivery status
        transaction.update(deliveryRef, {
          paymentStatus: 'refunded',
          'fromPharmacyPayment.status': delivery.fromPharmacyPayment?.status === 'paid' ? 'refunded' : 'pending',
          'fromPharmacyPayment.refundedAt': delivery.fromPharmacyPayment?.status === 'paid' ? now : null,
          'toPharmacyPayment.status': delivery.toPharmacyPayment?.status === 'paid' ? 'refunded' : 'pending',
          'toPharmacyPayment.refundedAt': delivery.toPharmacyPayment?.status === 'paid' ? now : null,
          updatedAt: now
        });
      });

      await createAuditLog({
        userId: auth.uid,
        action: 'delivery_refund',
        resource: 'delivery',
        resourceId: deliveryId,
        details: { reason, refundedCount }
      });

      return {
        success: true,
        message: `Refunded ${refundedCount} payment(s)`,
        refundedCount
      };

    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Refund error:', error);
      throw new HttpsError('internal', 'Failed to process refund');
    }
  }
);
