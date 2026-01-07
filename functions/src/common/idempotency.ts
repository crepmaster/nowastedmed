/**
 * Idempotency Helpers
 *
 * Ensures that webhook events are processed exactly once,
 * preventing duplicate credits/debits from retry attempts.
 */

import { db } from '../utils/firestore';

/**
 * Idempotency key collection
 */
const IDEMPOTENCY_COLLECTION = 'idempotency_keys';

/**
 * Check if an operation has already been processed
 *
 * @param key - Unique idempotency key (e.g., Flutterwave transaction ID)
 * @param operation - Type of operation (e.g., 'topup_credit', 'subscription_activate')
 * @returns boolean - True if already processed
 */
export async function isAlreadyProcessed(
  key: string,
  operation: string
): Promise<boolean> {
  const docId = `${operation}_${key}`;
  const doc = await db.collection(IDEMPOTENCY_COLLECTION).doc(docId).get();
  return doc.exists;
}

/**
 * Mark an operation as processed
 *
 * Should be called AFTER the operation succeeds, within the same transaction
 *
 * @param key - Unique idempotency key
 * @param operation - Type of operation
 * @param metadata - Additional metadata to store
 */
export async function markAsProcessed(
  key: string,
  operation: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const docId = `${operation}_${key}`;
  await db.collection(IDEMPOTENCY_COLLECTION).doc(docId).set({
    key,
    operation,
    processedAt: Date.now(),
    metadata
  });
}

/**
 * Check and mark in a transaction (atomic operation)
 *
 * This is the preferred method - check and mark atomically
 * to prevent race conditions between parallel webhook deliveries
 *
 * @param transaction - Firestore transaction
 * @param key - Unique idempotency key
 * @param operation - Type of operation
 * @returns boolean - True if already processed (should skip)
 */
export function checkAndMarkInTransaction(
  transaction: FirebaseFirestore.Transaction,
  key: string,
  operation: string
): {
  check: () => Promise<boolean>;
  mark: (metadata?: Record<string, any>) => void;
} {
  const docId = `${operation}_${key}`;
  const docRef = db.collection(IDEMPOTENCY_COLLECTION).doc(docId);

  return {
    /**
     * Check if already processed (call this inside transaction)
     */
    check: async (): Promise<boolean> => {
      const doc = await transaction.get(docRef);
      return doc.exists;
    },

    /**
     * Mark as processed (call this inside transaction after successful operation)
     */
    mark: (metadata: Record<string, any> = {}): void => {
      transaction.set(docRef, {
        key,
        operation,
        processedAt: Date.now(),
        metadata
      });
    }
  };
}

/**
 * Generate a unique idempotency key from webhook data
 *
 * @param provider - Payment provider name
 * @param transactionId - Provider's transaction ID
 * @param eventType - Type of event (e.g., 'charge.completed')
 * @returns string - Unique idempotency key
 */
export function generateIdempotencyKey(
  provider: string,
  transactionId: string,
  eventType: string
): string {
  return `${provider}_${transactionId}_${eventType}`;
}
