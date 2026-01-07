/**
 * Flutterwave Configuration
 *
 * Environment variables should be set via Firebase Functions config:
 * firebase functions:config:set flutterwave.secret_key="YOUR_SECRET_KEY"
 * firebase functions:config:set flutterwave.public_key="YOUR_PUBLIC_KEY"
 * firebase functions:config:set flutterwave.webhook_hash="YOUR_WEBHOOK_HASH"
 */

import * as functions from 'firebase-functions';

// Flutterwave API configuration
export const FLUTTERWAVE_CONFIG = {
  // Get from Firebase Functions config or environment
  get secretKey(): string {
    return process.env.FLUTTERWAVE_SECRET_KEY ||
           functions.config().flutterwave?.secret_key ||
           '';
  },
  get publicKey(): string {
    return process.env.FLUTTERWAVE_PUBLIC_KEY ||
           functions.config().flutterwave?.public_key ||
           '';
  },
  get webhookHash(): string {
    return process.env.FLUTTERWAVE_WEBHOOK_HASH ||
           functions.config().flutterwave?.webhook_hash ||
           '';
  },
  // Alias for consistency with verify-signature.ts
  get webhookSecret(): string {
    return this.webhookHash;
  },

  // API endpoints
  baseUrl: 'https://api.flutterwave.com/v3',

  // Supported currencies
  supportedCurrencies: ['XOF', 'NGN', 'GHS', 'GNF', 'KES', 'TZS', 'UGX', 'BWP'],

  // Payment types
  paymentTypes: {
    mobileMoney: 'mobilemoney',
    card: 'card',
    bankTransfer: 'banktransfer'
  }
};

/**
 * Map NowasteMed provider IDs to Flutterwave network codes
 */
export const PROVIDER_TO_FLUTTERWAVE: Record<string, string> = {
  // West Africa - XOF Zone
  'mtn_momo_xof': 'MTN',
  'orange_money_xof': 'ORANGE',
  'moov_money': 'MOOV',
  'wave_xof': 'WAVE',
  'free_money': 'FREE',

  // Nigeria
  'mtn_momo_ng': 'MTN',
  'airtel_money_ng': 'AIRTEL',
  'opay_ng': 'OPAY',
  'palmpay_ng': 'PALMPAY',

  // Ghana
  'mtn_momo_gh': 'MTN',
  'vodafone_cash_gh': 'VODAFONE',
  'airteltigo_gh': 'AIRTELTIGO',

  // Guinea
  'orange_money_gn': 'ORANGE',
  'mtn_momo_gn': 'MTN',

  // Kenya
  'mpesa_ke': 'MPESA',
  'airtel_money_ke': 'AIRTEL',
  'tkash_ke': 'TKASH',

  // Tanzania
  'mpesa_tz': 'MPESA',
  'tigopesa_tz': 'TIGO',
  'airtel_money_tz': 'AIRTEL',
  'halopesa_tz': 'HALO',

  // Uganda
  'mtn_momo_ug': 'MTN',
  'airtel_money_ug': 'AIRTEL',

  // Botswana
  'orange_money_bw': 'ORANGE',
  'myzaka_bw': 'MYZAKA',
  'smega_bw': 'SMEGA'
};

/**
 * Map currency to Flutterwave country code
 */
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  'XOF': 'BJ', // Benin (or TG, SN, CI, etc.)
  'NGN': 'NG',
  'GHS': 'GH',
  'GNF': 'GN',
  'KES': 'KE',
  'TZS': 'TZ',
  'UGX': 'UG',
  'BWP': 'BW'
};

/**
 * Transaction status mapping
 */
export const FLUTTERWAVE_STATUS = {
  successful: 'successful',
  failed: 'failed',
  pending: 'pending'
};
