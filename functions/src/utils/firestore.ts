/**
 * Firestore Utility Functions
 *
 * Common Firestore operations for Cloud Functions
 */

import * as admin from 'firebase-admin';

// Note: Firebase Admin is initialized in index.ts
// This module provides Firestore utilities

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;

/**
 * Collections
 */
export const COLLECTIONS = {
  WALLETS: 'wallets',
  LEDGER: 'ledger',
  TOPUP_REQUESTS: 'topup_requests',
  SUBSCRIPTIONS: 'subscriptions',
  SUBSCRIPTION_REQUESTS: 'subscription_requests',
  SUBSCRIPTION_PLANS: 'subscription_plans',
  PHARMACIES: 'pharmacies',
  COURIERS: 'couriers',
  COURIER_EARNINGS: 'courier_earnings',
  COURIER_WALLETS: 'courier_wallets',
  COURIER_PAYOUTS: 'courier_payouts',
  DELIVERIES: 'deliveries',
  AUDIT_LOGS: 'audit_logs'
};

/**
 * Transaction types for ledger
 */
export type TransactionType =
  | 'credit'
  | 'debit'
  | 'refund'
  | 'subscription_payment'
  | 'exchange_fee'
  | 'delivery_payment'
  | 'topup';

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Create a ledger entry (transaction record)
 */
export async function createLedgerEntry(params: {
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const now = Date.now();

  const ledgerEntry = {
    userId: params.userId,
    walletId: params.walletId,
    type: params.type,
    amount: params.amount,
    currency: params.currency,
    status: params.status,
    description: params.description,
    referenceId: params.referenceId || null,
    referenceType: params.referenceType || null,
    metadata: params.metadata || {},
    createdAt: now,
    updatedAt: now
  };

  const docRef = await db.collection(COLLECTIONS.LEDGER).add(ledgerEntry);
  return docRef.id;
}

/**
 * Update wallet balance atomically
 */
export async function updateWalletBalance(
  userId: string,
  amount: number,
  operation: 'increment' | 'decrement'
): Promise<boolean> {
  const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error(`Wallet not found for user: ${userId}`);
      }

      const currentBalance = walletDoc.data()?.balance || 0;
      const newBalance = operation === 'increment'
        ? currentBalance + amount
        : currentBalance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      transaction.update(walletRef, {
        balance: newBalance,
        updatedAt: Date.now()
      });
    });

    return true;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    return false;
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  await db.collection(COLLECTIONS.AUDIT_LOGS).add({
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress || null,
    timestamp: Date.now()
  });
}

/**
 * Get user wallet
 */
export async function getWallet(userId: string): Promise<any | null> {
  const walletDoc = await db.collection(COLLECTIONS.WALLETS).doc(userId).get();
  if (!walletDoc.exists) {
    return null;
  }
  return { id: walletDoc.id, ...walletDoc.data() };
}

/**
 * Get user profile (pharmacy or courier)
 */
export async function getUserProfile(userId: string): Promise<{
  profile: any;
  collection: string;
} | null> {
  // Check pharmacies first
  const pharmacyDoc = await db.collection(COLLECTIONS.PHARMACIES).doc(userId).get();
  if (pharmacyDoc.exists) {
    return {
      profile: { id: pharmacyDoc.id, ...pharmacyDoc.data() },
      collection: COLLECTIONS.PHARMACIES
    };
  }

  // Check couriers
  const courierDoc = await db.collection(COLLECTIONS.COURIERS).doc(userId).get();
  if (courierDoc.exists) {
    return {
      profile: { id: courierDoc.id, ...courierDoc.data() },
      collection: COLLECTIONS.COURIERS
    };
  }

  return null;
}
