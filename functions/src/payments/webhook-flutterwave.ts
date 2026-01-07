/**
 * Flutterwave Webhook Handler
 *
 * HTTP endpoint that receives payment notifications from Flutterwave.
 * Processes payment confirmations and updates wallet balances.
 *
 * Security:
 * - Verifies webhook signature
 * - Uses idempotency to prevent duplicate processing
 * - All balance updates are atomic (Firestore transactions)
 */

import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import {
  db,
  COLLECTIONS,
  FieldValue
} from '../utils/firestore';
import { verifyFlutterwaveSignature } from '../common/verify-signature';
import {
  checkAndMarkInTransaction,
  generateIdempotencyKey
} from '../common/idempotency';
import { FLUTTERWAVE_CONFIG } from '../config/flutterwave';

// Flutterwave SDK for transaction verification
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Flutterwave = require('flutterwave-node-v3');

/**
 * Flutterwave webhook event types we handle
 */
type FlutterwaveEventType =
  | 'charge.completed'
  | 'charge.failed'
  | 'transfer.completed'
  | 'transfer.failed';

/**
 * Flutterwave webhook payload structure
 */
interface FlutterwaveWebhookPayload {
  event: FlutterwaveEventType;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    customer: {
      email: string;
      name: string;
      phone_number?: string;
    };
    meta?: {
      source?: string;
      type?: string;
    };
    created_at: string;
  };
}

/**
 * Verify transaction with Flutterwave API
 *
 * Double-check the transaction status directly with Flutterwave
 * to prevent spoofed webhook attacks
 */
async function verifyTransactionWithFlutterwave(
  transactionId: number
): Promise<{ verified: boolean; data?: any; error?: string }> {
  try {
    const flw = new Flutterwave(
      FLUTTERWAVE_CONFIG.publicKey,
      FLUTTERWAVE_CONFIG.secretKey
    );

    const response = await flw.Transaction.verify({ id: transactionId });

    if (response.status === 'success' && response.data.status === 'successful') {
      return { verified: true, data: response.data };
    }

    return {
      verified: false,
      error: `Transaction status: ${response.data?.status || 'unknown'}`
    };
  } catch (error: any) {
    console.error('Flutterwave verification error:', error);
    return { verified: false, error: error.message };
  }
}

/**
 * Process successful top-up payment
 *
 * Credits the user's wallet atomically with idempotency protection
 */
async function processTopUpPayment(
  payload: FlutterwaveWebhookPayload['data']
): Promise<{ success: boolean; error?: string }> {
  const { tx_ref, flw_ref, amount, currency } = payload;
  const transactionId = payload.id.toString();

  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey('flutterwave', transactionId, 'charge.completed');

  try {
    // Find the pending top-up request by tx_ref
    const topUpQuery = await db
      .collection(COLLECTIONS.TOPUP_REQUESTS)
      .where('txRef', '==', tx_ref)
      .limit(1)
      .get();

    if (topUpQuery.empty) {
      console.error(`Top-up request not found for tx_ref: ${tx_ref}`);
      return { success: false, error: 'Top-up request not found' };
    }

    const topUpDoc = topUpQuery.docs[0];
    const topUpData = topUpDoc.data();
    const userId = topUpData.userId;

    // Verify amount matches (security check)
    if (topUpData.amount !== amount || topUpData.currency !== currency) {
      console.error('Amount/currency mismatch', {
        expected: { amount: topUpData.amount, currency: topUpData.currency },
        received: { amount, currency }
      });
      return { success: false, error: 'Amount/currency mismatch' };
    }

    // Execute atomic transaction
    await db.runTransaction(async (transaction) => {
      // Check idempotency (inside transaction for atomicity)
      const idempotency = checkAndMarkInTransaction(
        transaction,
        idempotencyKey,
        'topup_credit'
      );

      const alreadyProcessed = await idempotency.check();
      if (alreadyProcessed) {
        console.log(`Transaction ${transactionId} already processed, skipping`);
        return; // Transaction will still commit but with no changes
      }

      // Get wallet reference
      const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error(`Wallet not found for user: ${userId}`);
      }

      // Update wallet balance
      transaction.update(walletRef, {
        balance: FieldValue.increment(amount),
        lastTopUpAt: Date.now(),
        updatedAt: Date.now()
      });

      // Update top-up request status
      const topUpRef = db.collection(COLLECTIONS.TOPUP_REQUESTS).doc(topUpDoc.id);
      transaction.update(topUpRef, {
        status: 'completed',
        flutterwaveRef: flw_ref,
        completedAt: Date.now(),
        updatedAt: Date.now()
      });

      // Create completed ledger entry
      const ledgerRef = db.collection(COLLECTIONS.LEDGER).doc();
      transaction.set(ledgerRef, {
        userId,
        walletId: userId,
        type: 'topup',
        amount,
        currency,
        status: 'completed',
        description: `Wallet top-up via ${payload.payment_type}`,
        referenceId: topUpDoc.id,
        referenceType: 'topup_request',
        externalRef: flw_ref,
        metadata: {
          txRef: tx_ref,
          flutterwaveId: transactionId,
          paymentType: payload.payment_type
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Mark as processed (idempotency)
      idempotency.mark({
        topUpId: topUpDoc.id,
        userId,
        amount,
        currency,
        flwRef: flw_ref
      });
    });

    console.log(`Successfully credited ${amount} ${currency} to user ${userId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error processing top-up payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process failed payment
 *
 * Updates the top-up request status to failed
 */
async function processFailedPayment(
  payload: FlutterwaveWebhookPayload['data']
): Promise<{ success: boolean; error?: string }> {
  const { tx_ref, flw_ref } = payload;

  try {
    const topUpQuery = await db
      .collection(COLLECTIONS.TOPUP_REQUESTS)
      .where('txRef', '==', tx_ref)
      .limit(1)
      .get();

    if (topUpQuery.empty) {
      return { success: false, error: 'Top-up request not found' };
    }

    const topUpDoc = topUpQuery.docs[0];

    await topUpDoc.ref.update({
      status: 'failed',
      flutterwaveRef: flw_ref,
      failedAt: Date.now(),
      updatedAt: Date.now(),
      errorMessage: 'Payment failed at provider'
    });

    // Also update the pending ledger entry
    const ledgerQuery = await db
      .collection(COLLECTIONS.LEDGER)
      .where('referenceId', '==', topUpDoc.id)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!ledgerQuery.empty) {
      await ledgerQuery.docs[0].ref.update({
        status: 'failed',
        updatedAt: Date.now()
      });
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error processing failed payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main webhook handler
 */
export const flutterwaveWebhook = onRequest(
  { region: 'europe-west1' },
  async (req: Request, res: Response) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify webhook signature
    const signature = req.headers['verif-hash'] as string | undefined;
    if (!verifyFlutterwaveSignature(signature)) {
      console.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const payload = req.body as FlutterwaveWebhookPayload;

    // Log webhook receipt
    console.log('Received Flutterwave webhook:', {
      event: payload.event,
      transactionId: payload.data?.id,
      txRef: payload.data?.tx_ref,
      status: payload.data?.status
    });

    // Validate payload
    if (!payload.event || !payload.data) {
      console.error('Invalid webhook payload');
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    // Check if this is from our app
    if (payload.data.meta?.source !== 'nowastedmed') {
      console.log('Ignoring webhook from different source');
      res.status(200).json({ message: 'Ignored - different source' });
      return;
    }

    try {
      let result: { success: boolean; error?: string };

      switch (payload.event) {
        case 'charge.completed':
          // Verify with Flutterwave before processing
          const verification = await verifyTransactionWithFlutterwave(payload.data.id);
          if (!verification.verified) {
            console.error('Transaction verification failed:', verification.error);
            res.status(400).json({ error: 'Verification failed' });
            return;
          }

          // Process based on transaction type
          if (payload.data.meta?.type === 'wallet_topup') {
            result = await processTopUpPayment(payload.data);
          } else if (payload.data.meta?.type === 'subscription_payment') {
            // TODO: Implement subscription payment processing
            result = { success: true };
          } else {
            console.log('Unknown transaction type:', payload.data.meta?.type);
            result = { success: true };
          }
          break;

        case 'charge.failed':
          result = await processFailedPayment(payload.data);
          break;

        case 'transfer.completed':
          // TODO: Handle payout completion (courier earnings)
          result = { success: true };
          break;

        case 'transfer.failed':
          // TODO: Handle payout failure
          result = { success: true };
          break;

        default:
          console.log('Unhandled event type:', payload.event);
          result = { success: true };
      }

      if (result.success) {
        res.status(200).json({ message: 'Webhook processed successfully' });
      } else {
        // Return 200 anyway to prevent Flutterwave from retrying indefinitely
        // Log the error for investigation
        console.error('Webhook processing error:', result.error);
        res.status(200).json({ message: 'Processed with errors', error: result.error });
      }

    } catch (error: any) {
      console.error('Webhook handler error:', error);
      // Return 200 to acknowledge receipt (prevent infinite retries)
      res.status(200).json({ message: 'Error processing webhook' });
    }
  }
);
