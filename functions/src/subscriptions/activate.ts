/**
 * Subscription Activation
 *
 * Activates a user's subscription after successful payment.
 * Can be triggered by webhook or called directly after payment confirmation.
 *
 * Flow:
 * 1. Validate payment reference
 * 2. Get subscription plan details
 * 3. Calculate subscription period
 * 4. Create/update subscription record
 * 5. Create ledger entry
 * 6. Update wallet balance (debit)
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTIONS,
  FieldValue,
  createAuditLog
} from '../utils/firestore';
import {
  checkAndMarkInTransaction,
  generateIdempotencyKey
} from '../common/idempotency';

/**
 * Subscription plan structure
 */
interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  durationDays: number;
  features: {
    maxListings: number;
    maxExchangesPerMonth: number;
    prioritySupport: boolean;
    analytics: boolean;
    customBranding?: boolean;
    apiAccess?: boolean;
  };
}

/**
 * Subscription record structure
 */
interface Subscription {
  userId: string;
  planId: string;
  planTier: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startedAt: number;
  expiresAt: number;
  renewAt?: number;
  autoRenew: boolean;
  paymentRef?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Request structure for activating subscription via wallet payment
 */
interface ActivateSubscriptionRequest {
  planId: string;
  paymentMethod: 'wallet' | 'external';
  externalPaymentRef?: string; // For external payment confirmation
}

/**
 * Calculate subscription expiry date
 */
function calculateExpiryDate(startDate: number, durationDays: number): number {
  return startDate + (durationDays * 24 * 60 * 60 * 1000);
}

/**
 * Get subscription plan by ID
 */
async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const planDoc = await db.collection(COLLECTIONS.SUBSCRIPTION_PLANS).doc(planId).get();
  if (!planDoc.exists) {
    return null;
  }
  return { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;
}

/**
 * Activate subscription with wallet payment
 *
 * Deducts subscription cost from user's wallet and activates the subscription
 */
export const activateSubscription = onCall<ActivateSubscriptionRequest>(
  { region: 'europe-west1' },
  async (request: CallableRequest<ActivateSubscriptionRequest>) => {
    const { data, auth } = request;

    // 1. Verify authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = auth.uid;
    const { planId, paymentMethod, externalPaymentRef } = data;

    // 2. Validate input
    if (!planId || typeof planId !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Plan ID is required'
      );
    }

    if (!['wallet', 'external'].includes(paymentMethod)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid payment method'
      );
    }

    // 3. Get subscription plan
    const plan = await getSubscriptionPlan(planId);
    if (!plan) {
      throw new HttpsError(
        'not-found',
        'Subscription plan not found'
      );
    }

    // Free tier doesn't require payment
    if (plan.tier === 'free') {
      return activateFreeTier(userId, plan);
    }

    // 4. For wallet payment, verify and deduct balance
    if (paymentMethod === 'wallet') {
      return activateWithWalletPayment(userId, plan);
    }

    // 5. For external payment, verify the payment reference
    if (paymentMethod === 'external' && externalPaymentRef) {
      return activateWithExternalPayment(userId, plan, externalPaymentRef);
    }

    throw new HttpsError(
      'invalid-argument',
      'External payment reference required'
    );
  }
);

/**
 * Activate free tier subscription
 */
async function activateFreeTier(
  userId: string,
  plan: SubscriptionPlan
): Promise<{ success: boolean; subscription: Partial<Subscription> }> {
  const now = Date.now();
  const expiresAt = calculateExpiryDate(now, plan.durationDays);

  const subscriptionData: Subscription = {
    userId,
    planId: plan.id,
    planTier: plan.tier,
    status: 'active',
    startedAt: now,
    expiresAt,
    autoRenew: true, // Free tier auto-renews
    createdAt: now,
    updatedAt: now
  };

  await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId).set(subscriptionData);

  await createAuditLog({
    userId,
    action: 'subscription_activated',
    resource: 'subscription',
    resourceId: userId,
    details: {
      planId: plan.id,
      planTier: plan.tier,
      expiresAt
    }
  });

  return {
    success: true,
    subscription: {
      planId: plan.id,
      planTier: plan.tier,
      status: 'active',
      expiresAt
    }
  };
}

/**
 * Activate subscription using wallet balance
 */
async function activateWithWalletPayment(
  userId: string,
  plan: SubscriptionPlan
): Promise<{ success: boolean; subscription: Partial<Subscription> }> {
  const now = Date.now();
  // Use date-based key (YYYYMMDD) to allow one subscription activation per day per plan
  // This prevents duplicate charges while allowing renewals on different days
  const dateKey = new Date(now).toISOString().split('T')[0].replace(/-/g, '');
  const idempotencyKey = generateIdempotencyKey('wallet_subscription', `${userId}_${plan.id}`, dateKey);

  try {
    const result = await db.runTransaction(async (transaction) => {
      // Check idempotency
      const idempotency = checkAndMarkInTransaction(
        transaction,
        idempotencyKey,
        'subscription_wallet_payment'
      );

      const alreadyProcessed = await idempotency.check();
      if (alreadyProcessed) {
        throw new Error('ALREADY_PROCESSED');
      }

      // Get wallet
      const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error('WALLET_NOT_FOUND');
      }

      const wallet = walletDoc.data()!;

      // Verify currency matches
      if (wallet.currency !== plan.currency) {
        throw new Error(`CURRENCY_MISMATCH: wallet is ${wallet.currency}, plan requires ${plan.currency}`);
      }

      // Verify sufficient balance
      if (wallet.balance < plan.price) {
        throw new Error(`INSUFFICIENT_BALANCE: need ${plan.price}, have ${wallet.balance}`);
      }

      // Deduct from wallet
      transaction.update(walletRef, {
        balance: FieldValue.increment(-plan.price),
        updatedAt: now
      });

      // Create/update subscription
      const subscriptionRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId);
      const expiresAt = calculateExpiryDate(now, plan.durationDays);

      const subscriptionData: Subscription = {
        userId,
        planId: plan.id,
        planTier: plan.tier,
        status: 'active',
        startedAt: now,
        expiresAt,
        renewAt: expiresAt - (7 * 24 * 60 * 60 * 1000), // Remind 7 days before expiry
        autoRenew: false,
        createdAt: now,
        updatedAt: now
      };

      transaction.set(subscriptionRef, subscriptionData);

      // Create ledger entry
      const ledgerRef = db.collection(COLLECTIONS.LEDGER).doc();
      transaction.set(ledgerRef, {
        userId,
        walletId: userId,
        type: 'subscription_payment',
        amount: -plan.price, // Negative for debit
        currency: plan.currency,
        status: 'completed',
        description: `${plan.name} subscription payment`,
        referenceId: userId,
        referenceType: 'subscription',
        metadata: {
          planId: plan.id,
          planTier: plan.tier,
          durationDays: plan.durationDays
        },
        createdAt: now,
        updatedAt: now
      });

      // Mark as processed
      idempotency.mark({
        userId,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency
      });

      return {
        expiresAt,
        planTier: plan.tier
      };
    });

    await createAuditLog({
      userId,
      action: 'subscription_activated',
      resource: 'subscription',
      resourceId: userId,
      details: {
        planId: plan.id,
        planTier: plan.tier,
        paymentMethod: 'wallet',
        amount: plan.price,
        currency: plan.currency
      }
    });

    return {
      success: true,
      subscription: {
        planId: plan.id,
        planTier: result.planTier,
        status: 'active',
        expiresAt: result.expiresAt
      }
    };

  } catch (error: any) {
    if (error.message === 'ALREADY_PROCESSED') {
      // Return current subscription
      const subDoc = await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId).get();
      if (subDoc.exists) {
        const sub = subDoc.data() as Subscription;
        return {
          success: true,
          subscription: {
            planId: sub.planId,
            planTier: sub.planTier,
            status: sub.status,
            expiresAt: sub.expiresAt
          }
        };
      }
    }

    if (error.message.startsWith('WALLET_NOT_FOUND')) {
      throw new HttpsError('not-found', 'Wallet not found');
    }

    if (error.message.startsWith('CURRENCY_MISMATCH')) {
      throw new HttpsError('failed-precondition', error.message);
    }

    if (error.message.startsWith('INSUFFICIENT_BALANCE')) {
      throw new HttpsError('failed-precondition', 'Insufficient wallet balance');
    }

    console.error('Subscription activation error:', error);
    throw new HttpsError('internal', 'Failed to activate subscription');
  }
}

/**
 * Activate subscription after external payment (Flutterwave) is confirmed
 */
async function activateWithExternalPayment(
  userId: string,
  plan: SubscriptionPlan,
  paymentRef: string
): Promise<{ success: boolean; subscription: Partial<Subscription> }> {
  // Verify the payment request exists and is completed
  const paymentQuery = await db
    .collection(COLLECTIONS.SUBSCRIPTION_REQUESTS)
    .where('userId', '==', userId)
    .where('flutterwaveRef', '==', paymentRef)
    .where('status', '==', 'completed')
    .limit(1)
    .get();

  if (paymentQuery.empty) {
    throw new HttpsError(
      'not-found',
      'Payment confirmation not found'
    );
  }

  const paymentDoc = paymentQuery.docs[0];
  const paymentData = paymentDoc.data();

  // Verify plan matches
  if (paymentData.planId !== plan.id) {
    throw new HttpsError(
      'failed-precondition',
      'Payment was for a different plan'
    );
  }

  const now = Date.now();
  const expiresAt = calculateExpiryDate(now, plan.durationDays);

  const subscriptionData: Subscription = {
    userId,
    planId: plan.id,
    planTier: plan.tier,
    status: 'active',
    startedAt: now,
    expiresAt,
    renewAt: expiresAt - (7 * 24 * 60 * 60 * 1000),
    autoRenew: false,
    paymentRef,
    createdAt: now,
    updatedAt: now
  };

  await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId).set(subscriptionData);

  await createAuditLog({
    userId,
    action: 'subscription_activated',
    resource: 'subscription',
    resourceId: userId,
    details: {
      planId: plan.id,
      planTier: plan.tier,
      paymentMethod: 'external',
      paymentRef
    }
  });

  return {
    success: true,
    subscription: {
      planId: plan.id,
      planTier: plan.tier,
      status: 'active',
      expiresAt
    }
  };
}
