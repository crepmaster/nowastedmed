/**
 * Courier Earnings Release
 *
 * Scheduled function that processes pending courier earnings
 * and makes them available for withdrawal after the release period.
 *
 * Flow:
 * 1. Query all PENDING earnings older than release delay
 * 2. Move them to AVAILABLE status
 * 3. Update courier wallet available balance
 *
 * Runs every hour to process matured earnings.
 */

import { onSchedule, ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTIONS,
  FieldValue
} from '../utils/firestore';
import { EARNINGS_ENV } from '../config/env';

/**
 * Courier earning record structure
 */
interface CourierEarning {
  id?: string;
  courierId: string;
  deliveryId: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'available' | 'paid_out' | 'cancelled';
  earnedAt: number;
  availableAt: number;
  paidOutAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Note: CourierWallet type is defined inline in the transaction
// to avoid unused interface warning since we use dynamic data access

/**
 * Release matured earnings - runs every hour
 */
export const releaseCourierEarnings = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'Africa/Lagos', // West African Time
    region: 'europe-west1'
  },
  async (_event: ScheduledEvent): Promise<void> => {
    console.log('Starting courier earnings release job');

    const releaseDelayMs = EARNINGS_ENV.releaseDelayHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - releaseDelayMs;

    try {
      // Query pending earnings that are ready to release
      const pendingEarningsQuery = await db
        .collection(COLLECTIONS.COURIER_EARNINGS)
        .where('status', '==', 'pending')
        .where('earnedAt', '<=', cutoffTime)
        .limit(500) // Process in batches
        .get();

      if (pendingEarningsQuery.empty) {
        console.log('No pending earnings to release');
        return;
      }

      console.log(`Found ${pendingEarningsQuery.size} earnings to release`);

      // Group earnings by courier for efficient wallet updates
      const earningsByCourier = new Map<string, CourierEarning[]>();

      pendingEarningsQuery.docs.forEach((doc) => {
        const earning = { id: doc.id, ...doc.data() } as CourierEarning;
        const existing = earningsByCourier.get(earning.courierId) || [];
        existing.push(earning);
        earningsByCourier.set(earning.courierId, existing);
      });

      // Process each courier's earnings
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const [courierId, earnings] of earningsByCourier) {
        try {
          await releaseEarningsForCourier(courierId, earnings);
          results.success += earnings.length;
        } catch (error: any) {
          console.error(`Failed to release earnings for courier ${courierId}:`, error);
          results.failed += earnings.length;
          results.errors.push(`${courierId}: ${error.message}`);
        }
      }

      console.log('Earnings release completed:', results);

    } catch (error: any) {
      console.error('Earnings release job failed:', error);
      throw error;
    }
  }
);

/**
 * Release earnings for a specific courier atomically
 */
async function releaseEarningsForCourier(
  courierId: string,
  earnings: CourierEarning[]
): Promise<void> {
  const now = Date.now();

  // Calculate total to release
  const totalToReleaseCents = earnings.reduce(
    (sum, e) => sum + e.amountCents,
    0
  );

  await db.runTransaction(async (transaction) => {
    // Get courier wallet
    const walletRef = db.collection(COLLECTIONS.COURIER_WALLETS).doc(courierId);
    const walletDoc = await transaction.get(walletRef);

    if (!walletDoc.exists) {
      // Create wallet if it doesn't exist
      transaction.set(walletRef, {
        courierId,
        balanceCents: totalToReleaseCents,
        pendingCents: 0,
        availableCents: totalToReleaseCents,
        currency: earnings[0].currency,
        createdAt: now,
        updatedAt: now
      });
    } else {
      // Update existing wallet
      transaction.update(walletRef, {
        balanceCents: FieldValue.increment(0), // No change to total
        pendingCents: FieldValue.increment(-totalToReleaseCents),
        availableCents: FieldValue.increment(totalToReleaseCents),
        updatedAt: now
      });
    }

    // Update each earning record
    for (const earning of earnings) {
      const earningRef = db.collection(COLLECTIONS.COURIER_EARNINGS).doc(earning.id!);
      transaction.update(earningRef, {
        status: 'available',
        availableAt: now,
        updatedAt: now
      });
    }
  });

  console.log(`Released ${earnings.length} earnings (${totalToReleaseCents} cents) for courier ${courierId}`);
}

/**
 * Manual trigger for testing/admin purposes
 */
export const triggerEarningsRelease = onCall(
  { region: 'europe-west1' },
  async (request: CallableRequest) => {
    const { auth } = request;

    // Only allow admins
    if (!auth?.token.admin) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can trigger manual earnings release'
      );
    }

    // Import and run the release logic
    const releaseDelayMs = EARNINGS_ENV.releaseDelayHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - releaseDelayMs;

    const pendingEarningsQuery = await db
      .collection(COLLECTIONS.COURIER_EARNINGS)
      .where('status', '==', 'pending')
      .where('earnedAt', '<=', cutoffTime)
      .get();

    if (pendingEarningsQuery.empty) {
      return { message: 'No pending earnings to release', count: 0 };
    }

    // Group and process
    const earningsByCourier = new Map<string, CourierEarning[]>();

    pendingEarningsQuery.docs.forEach((doc) => {
      const earning = { id: doc.id, ...doc.data() } as CourierEarning;
      const existing = earningsByCourier.get(earning.courierId) || [];
      existing.push(earning);
      earningsByCourier.set(earning.courierId, existing);
    });

    let totalReleased = 0;
    for (const [courierId, earnings] of earningsByCourier) {
      await releaseEarningsForCourier(courierId, earnings);
      totalReleased += earnings.length;
    }

    return {
      message: 'Earnings released successfully',
      count: totalReleased
    };
  }
);
