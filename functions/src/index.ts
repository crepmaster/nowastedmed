/**
 * NowasteMed Cloud Functions
 *
 * Main entry point for all Firebase Cloud Functions.
 *
 * Functions:
 * - payments/requestTopUp: Initiate wallet top-up
 * - payments/flutterwaveWebhook: Handle payment webhooks
 * - subscriptions/activateSubscription: Activate user subscription
 * - earnings/releaseCourierEarnings: Scheduled release of courier earnings
 * - earnings/requestPayout: Courier payout request
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// ====================
// Payment Functions
// ====================
export { requestTopUp } from './payments/initiate-topup';
export { flutterwaveWebhook } from './payments/webhook-flutterwave';

// ====================
// Subscription Functions
// ====================
export { activateSubscription } from './subscriptions/activate';

// ====================
// Courier Earnings Functions
// ====================
// Scheduled: Releases pending courier earnings every hour
export { releaseCourierEarnings, triggerEarningsRelease } from './earnings/release';
export { requestPayout } from './earnings/payout-request';

// ====================
// Delivery Functions (Phase 1 security fixes)
// ====================
// Firestore trigger: Creates delivery when exchange is accepted
export { onExchangeAccepted } from './deliveries/on-exchange-accepted';
// Firestore trigger: Creates courier earning when delivery is completed
export { onDeliveryCompleted } from './deliveries/on-delivery-completed';
// Callable: Pay delivery fee from pharmacy wallet (replaces client-side mutation)
export { payDeliveryFee, refundDeliveryPayment } from './deliveries/pay-delivery-fee';

/**
 * Health check endpoint for monitoring
 */
import { onRequest } from 'firebase-functions/v2/https';

export const healthCheck = onRequest(
  { region: 'europe-west1' },
  (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      region: 'europe-west1',
      version: '1.0.0'
    });
  }
);
