/**
 * Environment Configuration
 *
 * Centralized access to environment variables and secrets.
 * All secrets should be set via Firebase Functions config or Secret Manager.
 *
 * Setup:
 * firebase functions:config:set flutterwave.public_key="FLWPUBK_xxx"
 * firebase functions:config:set flutterwave.secret_key="FLWSECK_xxx"
 * firebase functions:config:set flutterwave.webhook_secret="your_webhook_hash"
 */

import * as functions from 'firebase-functions';

/**
 * Get environment configuration
 */
function getConfig() {
  return functions.config();
}

/**
 * Flutterwave API credentials
 */
export const FLUTTERWAVE_ENV = {
  get publicKey(): string {
    const config = getConfig();
    return config.flutterwave?.public_key || process.env.FLUTTERWAVE_PUBLIC_KEY || '';
  },

  get secretKey(): string {
    const config = getConfig();
    return config.flutterwave?.secret_key || process.env.FLUTTERWAVE_SECRET_KEY || '';
  },

  get webhookSecret(): string {
    const config = getConfig();
    return config.flutterwave?.webhook_secret || process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';
  },

  get encryptionKey(): string {
    const config = getConfig();
    return config.flutterwave?.encryption_key || process.env.FLUTTERWAVE_ENCRYPTION_KEY || '';
  }
};

/**
 * App configuration
 */
export const APP_ENV = {
  get environment(): 'development' | 'staging' | 'production' {
    const config = getConfig();
    const env = config.app?.environment || process.env.NODE_ENV || 'development';
    return env as 'development' | 'staging' | 'production';
  },

  get baseUrl(): string {
    const config = getConfig();
    return config.app?.base_url || 'https://nowastedmed.web.app';
  },

  get region(): string {
    return 'europe-west1'; // Closer to Africa
  }
};

/**
 * Earnings/Payout configuration
 */
export const EARNINGS_ENV = {
  // Hours before courier earnings become available
  get releaseDelayHours(): number {
    const config = getConfig();
    return parseInt(config.earnings?.release_delay_hours || '24', 10);
  },

  // Minimum payout amount in cents
  get minPayoutCents(): number {
    const config = getConfig();
    return parseInt(config.earnings?.min_payout_cents || '100000', 10); // 1000 in display currency
  },

  // Payout fee percentage
  get payoutFeePercent(): number {
    const config = getConfig();
    return parseFloat(config.earnings?.payout_fee_percent || '1.0');
  }
};

/**
 * Validate required configuration is present
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!FLUTTERWAVE_ENV.publicKey) {
    missing.push('flutterwave.public_key');
  }

  if (!FLUTTERWAVE_ENV.secretKey) {
    missing.push('flutterwave.secret_key');
  }

  if (!FLUTTERWAVE_ENV.webhookSecret) {
    missing.push('flutterwave.webhook_secret');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
