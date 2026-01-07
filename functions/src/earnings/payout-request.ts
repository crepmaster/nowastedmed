/**
 * Courier Payout Request
 *
 * Callable function that allows couriers to request withdrawal
 * of their available earnings via mobile money.
 *
 * Flow:
 * 1. Verify courier authentication
 * 2. Check available balance
 * 3. Create payout request
 * 4. Initiate Flutterwave transfer
 * 5. Update wallet (move to processing)
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTIONS,
  FieldValue,
  createAuditLog
} from '../utils/firestore';
import { FLUTTERWAVE_CONFIG } from '../config/flutterwave';
import { EARNINGS_ENV } from '../config/env';
import {
  validateAmount,
  fromCents,
  formatAmount
} from '../common/money';
// Note: Idempotency for payouts is handled via pending payout check
// rather than idempotency keys, since we want to allow new payouts
// after previous ones complete

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Flutterwave = require('flutterwave-node-v3');

/**
 * Payout request input
 * Supports both amount (decimal) and amountCents (integer) for backward compatibility
 */
interface PayoutRequest {
  amount?: number;        // Amount in decimal (e.g., 1000 for 1000 XAF) - from mobile app
  amountCents?: number;   // Amount in cents (e.g., 100000 for 1000 XAF) - internal
  currency: string;
  // Mobile money details (optional - uses wallet default if not provided)
  phoneNumber?: string;
  providerId?: string;
  // Payment method info from mobile app
  paymentMethod?: 'mobile_money' | 'bank_transfer';
  paymentProvider?: string;
  paymentAccount?: string;
  accountHolderName?: string;
}

/**
 * Payout record structure
 */
interface PayoutRecord {
  courierId: string;
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  currency: string;
  phoneNumber: string;
  providerId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  flutterwaveRef?: string;
  transferId?: number;
  errorMessage?: string;
  requestedAt: number;
  processedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Generate unique payout reference
 * @param _courierId - Courier ID (for traceability, prefixed with _ to indicate intentionally unused in ref)
 */
function generatePayoutRef(_courierId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NWM_PAYOUT_${timestamp}_${random}`;
}

/**
 * Calculate payout fee
 */
function calculatePayoutFee(amountCents: number): number {
  const feePercent = EARNINGS_ENV.payoutFeePercent;
  return Math.round(amountCents * (feePercent / 100));
}

/**
 * Request payout - callable function
 */
export const requestPayout = onCall<PayoutRequest>(
  { region: 'europe-west1' },
  async (request: CallableRequest<PayoutRequest>) => {
    const { data, auth } = request;

    // 1. Verify authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const courierId = auth.uid;

    // 2. Validate and normalize input
    const { amount, amountCents: inputAmountCents, currency, phoneNumber, providerId, paymentProvider, paymentAccount } = data;

    if (!currency) {
      throw new HttpsError(
        'invalid-argument',
        'Currency is required'
      );
    }

    // Normalize amount to cents
    // Accept either 'amount' (decimal from mobile) or 'amountCents' (integer)
    let amountCents: number;
    if (inputAmountCents !== undefined && inputAmountCents > 0) {
      // Already in cents
      amountCents = Math.round(inputAmountCents);
    } else if (amount !== undefined && amount > 0) {
      // Convert decimal to cents (for currencies like XAF where 1 unit = 100 cents)
      amountCents = Math.round(amount * 100);
    } else {
      throw new HttpsError(
        'invalid-argument',
        'Amount is required and must be positive'
      );
    }

    // Validate amount
    const amountValidation = validateAmount(
      amountCents,
      currency,
      EARNINGS_ENV.minPayoutCents
    );

    if (!amountValidation.valid) {
      throw new HttpsError(
        'invalid-argument',
        amountValidation.error!
      );
    }

    try {
      // 3. Get courier wallet
      const walletRef = db.collection(COLLECTIONS.COURIER_WALLETS).doc(courierId);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        throw new HttpsError(
          'not-found',
          'Courier wallet not found'
        );
      }

      const wallet = walletDoc.data()!;

      // Verify currency matches
      if (wallet.currency !== currency) {
        throw new HttpsError(
          'invalid-argument',
          `Currency mismatch: wallet is ${wallet.currency}`
        );
      }

      // Check available balance
      if (wallet.availableCents < amountCents) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient available balance. Available: ${formatAmount(fromCents(wallet.availableCents, currency), currency)}`
        );
      }

      // 4. Check for pending payouts (prevent double requests)
      const pendingPayoutQuery = await db
        .collection(COLLECTIONS.COURIER_PAYOUTS)
        .where('courierId', '==', courierId)
        .where('status', 'in', ['pending', 'processing'])
        .limit(1)
        .get();

      if (!pendingPayoutQuery.empty) {
        throw new HttpsError(
          'already-exists',
          'You already have a pending payout request'
        );
      }

      // 5. Get courier profile for mobile money details
      const courierDoc = await db.collection(COLLECTIONS.COURIERS).doc(courierId).get();
      if (!courierDoc.exists) {
        throw new HttpsError(
          'not-found',
          'Courier profile not found'
        );
      }

      const courier = courierDoc.data()!;
      // Use provided details from mobile app, or fall back to courier profile
      const payoutPhone = paymentAccount || phoneNumber || courier.phoneNumber;
      const payoutProvider = paymentProvider || providerId || courier.mobileMoneyProvider;

      if (!payoutPhone || !payoutProvider) {
        throw new HttpsError(
          'invalid-argument',
          'Mobile money phone number and provider are required'
        );
      }

      // 6. Calculate fee and net amount
      const feeCents = calculatePayoutFee(amountCents);
      const netAmountCents = amountCents - feeCents;

      // 7. Create payout record
      const now = Date.now();
      const payoutRef = generatePayoutRef(courierId);

      const payoutRecord: PayoutRecord = {
        courierId,
        amountCents,
        feeCents,
        netAmountCents,
        currency,
        phoneNumber: payoutPhone,
        providerId: payoutProvider,
        status: 'pending',
        requestedAt: now,
        createdAt: now,
        updatedAt: now
      };

      // 8. Atomic transaction: create payout + update wallet
      const payoutDocRef = await db.runTransaction(async (transaction) => {
        // Re-check balance in transaction
        const freshWallet = await transaction.get(walletRef);
        if (freshWallet.data()!.availableCents < amountCents) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // Create payout document
        const payoutDoc = db.collection(COLLECTIONS.COURIER_PAYOUTS).doc();
        transaction.set(payoutDoc, payoutRecord);

        // Update wallet - move amount from available to processing
        transaction.update(walletRef, {
          availableCents: FieldValue.increment(-amountCents),
          updatedAt: now
        });

        return payoutDoc;
      });

      // 9. Initiate Flutterwave transfer (outside transaction)
      try {
        const flw = new Flutterwave(
          FLUTTERWAVE_CONFIG.publicKey,
          FLUTTERWAVE_CONFIG.secretKey
        );

        const transferPayload = {
          account_bank: payoutProvider, // Maps to mobile money network
          account_number: payoutPhone,
          amount: fromCents(netAmountCents, currency),
          currency,
          reference: payoutRef,
          narration: 'NowasteMed Courier Payout',
          callback_url: `https://europe-west1-nowastedmed.cloudfunctions.net/flutterwaveWebhook`,
          meta: {
            source: 'nowastedmed',
            type: 'courier_payout',
            courier_id: courierId,
            payout_id: payoutDocRef.id
          }
        };

        const response = await flw.Transfer.initiate(transferPayload);

        if (response.status === 'success') {
          // Update payout with Flutterwave reference
          await payoutDocRef.update({
            status: 'processing',
            flutterwaveRef: response.data.reference,
            transferId: response.data.id,
            updatedAt: Date.now()
          });

          await createAuditLog({
            userId: courierId,
            action: 'payout_requested',
            resource: 'courier_payout',
            resourceId: payoutDocRef.id,
            details: {
              amountCents,
              feeCents,
              netAmountCents,
              currency,
              transferId: response.data.id
            }
          });

          return {
            success: true,
            payoutId: payoutDocRef.id,
            amount: formatAmount(fromCents(amountCents, currency), currency),
            fee: formatAmount(fromCents(feeCents, currency), currency),
            netAmount: formatAmount(fromCents(netAmountCents, currency), currency),
            status: 'processing',
            message: 'Payout request submitted successfully'
          };

        } else {
          // Transfer initiation failed - revert wallet
          await db.runTransaction(async (transaction) => {
            transaction.update(walletRef, {
              availableCents: FieldValue.increment(amountCents),
              updatedAt: Date.now()
            });

            transaction.update(payoutDocRef, {
              status: 'failed',
              errorMessage: response.message || 'Transfer initiation failed',
              updatedAt: Date.now()
            });
          });

          throw new HttpsError(
            'internal',
            response.message || 'Failed to initiate transfer'
          );
        }

      } catch (flwError: any) {
        // Flutterwave API error - revert wallet
        console.error('Flutterwave transfer error:', flwError);

        await db.runTransaction(async (transaction) => {
          transaction.update(walletRef, {
            availableCents: FieldValue.increment(amountCents),
            updatedAt: Date.now()
          });

          transaction.update(payoutDocRef, {
            status: 'failed',
            errorMessage: flwError.message || 'Transfer API error',
            updatedAt: Date.now()
          });
        });

        throw new HttpsError(
          'internal',
          'Failed to process payout request'
        );
      }

    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }

      if (error.message === 'INSUFFICIENT_BALANCE') {
        throw new HttpsError(
          'failed-precondition',
          'Insufficient available balance'
        );
      }

      console.error('Payout request error:', error);
      throw new HttpsError(
        'internal',
        'An unexpected error occurred'
      );
    }
  }
);
