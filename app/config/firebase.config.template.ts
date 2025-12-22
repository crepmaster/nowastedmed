/**
 * Firebase Configuration Template for MediExchange (NoWasteMed)
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to firebase.config.ts
 * 2. Replace all PLACEHOLDER values with your actual Firebase configuration
 * 3. Get your config from Firebase Console > Project Settings > Your apps
 *
 * Security Notes:
 * - API keys for mobile apps are not secret (they identify the app, not authenticate it)
 * - Security is enforced through Firebase Security Rules and App Check
 * - For production, enable App Check to prevent unauthorized access
 */

export interface FirebaseConfig {
  apiKey: string;
  appId: string;
  messagingSenderId: string;
  projectId: string;
  authDomain: string;
  storageBucket: string;
  databaseURL?: string;
}

/**
 * Production Firebase Configuration
 * Source: Firebase Console > Project Settings > Your apps > Web app
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  appId: 'YOUR_FIREBASE_APP_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'YOUR_PROJECT_ID',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app'
};

/**
 * Get the current environment configuration
 */
export function getFirebaseConfig(): FirebaseConfig {
  return firebaseConfig;
}

/**
 * Firebase Functions Backend URLs
 * Update these with your actual Cloud Functions region and endpoints
 */
export const FIREBASE_FUNCTIONS = {
  region: 'europe-west1',
  baseUrl: 'https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net',

  endpoints: {
    // Health
    health: '/health',

    // Authentication
    createPharmacyUser: '/createPharmacyUser',
    createCourierUser: '/createCourierUser',
    createAdminUser: '/createAdminUser',

    // Wallet
    getWallet: '/getWallet',
    topupIntent: '/topupIntent',
    sandboxCredit: '/sandboxCredit',
    sandboxDebit: '/sandboxDebit',

    // Payments
    momoWebhook: '/momoWebhook',
    orangeWebhook: '/orangeWebhook',

    // Exchange
    createExchangeHold: '/createExchangeHold',
    exchangeCapture: '/exchangeCapture',
    exchangeCancel: '/exchangeCancel',

    // Subscription
    validateInventoryAccess: '/validateInventoryAccess',
    validateProposalAccess: '/validateProposalAccess',
    validateAnalyticsAccess: '/validateAnalyticsAccess',
    getSubscriptionStatus: '/getSubscriptionStatus'
  }
};

/**
 * Get full endpoint URL
 */
export function getEndpointUrl(endpoint: keyof typeof FIREBASE_FUNCTIONS.endpoints): string {
  return `${FIREBASE_FUNCTIONS.baseUrl}${FIREBASE_FUNCTIONS.endpoints[endpoint]}`;
}
