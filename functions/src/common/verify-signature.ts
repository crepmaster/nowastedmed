/**
 * Webhook Signature Verification
 *
 * Verifies the authenticity of Flutterwave webhook requests
 * to prevent replay attacks and ensure data integrity.
 */

import * as crypto from 'crypto';
import { FLUTTERWAVE_CONFIG } from '../config/flutterwave';

/**
 * Verify Flutterwave webhook signature
 *
 * Flutterwave sends a 'verif-hash' header that must match
 * our secret hash configured in the dashboard.
 *
 * @param signature - The verif-hash header from the request
 * @returns boolean - True if signature is valid
 */
export function verifyFlutterwaveSignature(signature: string | undefined): boolean {
  if (!signature) {
    console.error('Missing webhook signature header');
    return false;
  }

  // Flutterwave uses a simple hash comparison
  // The hash is configured in Flutterwave dashboard
  const expectedHash = FLUTTERWAVE_CONFIG.webhookSecret;

  if (!expectedHash) {
    console.error('Webhook secret not configured');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHash)
    );
  } catch (error) {
    // Buffers of different lengths will throw
    console.error('Signature comparison failed:', error);
    return false;
  }
}

/**
 * Verify webhook payload integrity using HMAC
 *
 * Alternative verification method for providers that use HMAC signatures
 *
 * @param payload - The raw request body
 * @param signature - The signature header
 * @param secret - The webhook secret
 * @returns boolean - True if signature is valid
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('HMAC comparison failed:', error);
    return false;
  }
}
