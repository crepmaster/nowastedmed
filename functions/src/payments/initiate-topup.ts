/**
 * Initiate Top-Up Request
 *
 * Callable function that creates a payment request with Flutterwave
 * and stores the pending transaction in Firestore.
 *
 * Flow:
 * 1. Validate user authentication
 * 2. Validate input parameters
 * 3. Get user wallet and mobile money info
 * 4. Create Flutterwave payment request
 * 5. Store pending transaction in Firestore
 * 6. Return payment link to client
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTIONS,
  createLedgerEntry,
  getWallet,
  getUserProfile,
  createAuditLog
} from '../utils/firestore';
import {
  FLUTTERWAVE_CONFIG,
  PROVIDER_TO_FLUTTERWAVE,
  CURRENCY_TO_COUNTRY
} from '../config/flutterwave';

// Flutterwave SDK
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Flutterwave = require('flutterwave-node-v3');

/**
 * Input validation interface
 */
interface TopUpRequest {
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card';
  phoneNumber?: string;
  providerId?: string;
  redirectUrl?: string;
}

/**
 * Response interface
 */
interface TopUpResponse {
  success: boolean;
  transactionId?: string;
  paymentLink?: string;
  message?: string;
  error?: string;
}

/**
 * Validate top-up request parameters
 */
function validateRequest(data: TopUpRequest): { valid: boolean; error?: string } {
  // Amount validation
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    return { valid: false, error: 'Invalid amount: must be a positive number' };
  }

  // Minimum amount check (100 units in local currency)
  if (data.amount < 100) {
    return { valid: false, error: 'Minimum top-up amount is 100' };
  }

  // Maximum amount check (1,000,000 units)
  if (data.amount > 1000000) {
    return { valid: false, error: 'Maximum top-up amount is 1,000,000' };
  }

  // Currency validation
  if (!FLUTTERWAVE_CONFIG.supportedCurrencies.includes(data.currency)) {
    return {
      valid: false,
      error: `Unsupported currency: ${data.currency}. Supported: ${FLUTTERWAVE_CONFIG.supportedCurrencies.join(', ')}`
    };
  }

  // Payment method validation
  if (!['mobile_money', 'card'].includes(data.paymentMethod)) {
    return { valid: false, error: 'Invalid payment method: must be mobile_money or card' };
  }

  // Mobile money requires phone number and provider
  if (data.paymentMethod === 'mobile_money') {
    if (!data.phoneNumber || typeof data.phoneNumber !== 'string') {
      return { valid: false, error: 'Phone number is required for mobile money payments' };
    }

    if (!data.providerId || typeof data.providerId !== 'string') {
      return { valid: false, error: 'Provider ID is required for mobile money payments' };
    }

    // Validate provider exists in our mapping
    if (!PROVIDER_TO_FLUTTERWAVE[data.providerId]) {
      return { valid: false, error: `Unknown provider: ${data.providerId}` };
    }
  }

  return { valid: true };
}

/**
 * Generate unique transaction reference
 * @param _userId - User ID (included in pattern for traceability, prefixed with _ to indicate intentionally unused)
 */
function generateTransactionRef(_userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NWM_TOPUP_${timestamp}_${random}`;
}

/**
 * Create Flutterwave mobile money charge
 */
async function createMobileMoneyCharge(params: {
  flw: any;
  txRef: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  providerId: string;
  email: string;
  fullName: string;
  redirectUrl: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const network = PROVIDER_TO_FLUTTERWAVE[params.providerId];
  const country = CURRENCY_TO_COUNTRY[params.currency];

  if (!network || !country) {
    return { success: false, error: 'Invalid provider or currency mapping' };
  }

  try {
    const payload = {
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      phone_number: params.phoneNumber,
      network: network,
      email: params.email,
      fullname: params.fullName,
      redirect_url: params.redirectUrl,
      meta: {
        source: 'nowastedmed',
        type: 'wallet_topup'
      }
    };

    // Flutterwave mobile money charge endpoint varies by country
    let response;

    if (['XOF', 'GNF'].includes(params.currency)) {
      // Francophone West Africa
      response = await params.flw.MobileMoney.franco_phone(payload);
    } else if (params.currency === 'GHS') {
      // Ghana
      response = await params.flw.MobileMoney.ghana(payload);
    } else if (params.currency === 'UGX') {
      // Uganda
      response = await params.flw.MobileMoney.uganda(payload);
    } else if (['KES', 'TZS'].includes(params.currency)) {
      // East Africa (M-Pesa)
      response = await params.flw.MobileMoney.mpesa(payload);
    } else if (params.currency === 'NGN') {
      // Nigeria - use bank transfer or USSD
      response = await params.flw.Charge.ng(payload);
    } else {
      // Default mobile money
      response = await params.flw.MobileMoney.charge(payload);
    }

    if (response.status === 'success') {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.message || 'Payment initiation failed' };
    }
  } catch (error: any) {
    console.error('Flutterwave API error:', error);
    return { success: false, error: error.message || 'Payment gateway error' };
  }
}

/**
 * Main callable function: Request Top-Up
 */
export const requestTopUp = onCall<TopUpRequest, Promise<TopUpResponse>>(
  { region: 'europe-west1' }, // Closer to Africa
  async (request: CallableRequest<TopUpRequest>): Promise<TopUpResponse> => {
    const { data, auth } = request;

    // 1. Check authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to request a top-up'
      );
    }

    const userId = auth.uid;
    const userEmail = auth.token.email || '';

    // 2. Validate request
    const validation = validateRequest(data);
    if (!validation.valid) {
      throw new HttpsError('invalid-argument', validation.error || 'Invalid request');
    }

    try {
      // 3. Get user wallet
      const wallet = await getWallet(userId);
      if (!wallet) {
        throw new HttpsError('not-found', 'Wallet not found for this user');
      }

      // Verify currency matches wallet
      if (wallet.currency !== data.currency) {
        throw new HttpsError(
          'invalid-argument',
          `Currency mismatch: wallet is ${wallet.currency}, requested ${data.currency}`
        );
      }

      // 4. Get user profile for name
      const userProfile = await getUserProfile(userId);
      if (!userProfile) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const fullName = userProfile.profile.pharmacyName ||
                       userProfile.profile.name ||
                       'NowasteMed User';

      // 5. Generate transaction reference
      const txRef = generateTransactionRef(userId);

      // 6. Create pending transaction record
      const now = Date.now();
      const topUpRequestDoc = {
        userId,
        txRef,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        providerId: data.providerId || null,
        phoneNumber: data.phoneNumber || wallet.mobileMoneyNumber,
        status: 'pending',
        flutterwaveRef: null,
        paymentLink: null,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + (30 * 60 * 1000) // 30 minutes expiry
      };

      const topUpRef = await db.collection(COLLECTIONS.TOPUP_REQUESTS).add(topUpRequestDoc);

      // 7. Create pending ledger entry
      await createLedgerEntry({
        userId,
        walletId: userId,
        type: 'topup',
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        description: `Wallet top-up via ${data.paymentMethod}`,
        referenceId: topUpRef.id,
        referenceType: 'topup_request',
        metadata: { txRef }
      });

      // 8. Initialize Flutterwave
      const flw = new Flutterwave(
        FLUTTERWAVE_CONFIG.publicKey,
        FLUTTERWAVE_CONFIG.secretKey
      );

      // 9. Create payment request based on method
      let paymentResult;

      if (data.paymentMethod === 'mobile_money') {
        const redirectUrl = data.redirectUrl ||
          `https://nowastedmed.web.app/payment-callback?ref=${txRef}`;

        paymentResult = await createMobileMoneyCharge({
          flw,
          txRef,
          amount: data.amount,
          currency: data.currency,
          phoneNumber: data.phoneNumber || wallet.mobileMoneyNumber,
          providerId: data.providerId!,
          email: userEmail,
          fullName,
          redirectUrl
        });
      } else {
        // Card payment - generate payment link
        const paymentLinkPayload = {
          tx_ref: txRef,
          amount: data.amount,
          currency: data.currency,
          redirect_url: data.redirectUrl ||
            `https://nowastedmed.web.app/payment-callback?ref=${txRef}`,
          customer: {
            email: userEmail,
            name: fullName
          },
          customizations: {
            title: 'NowasteMed Wallet Top-Up',
            description: `Top-up ${data.amount} ${data.currency}`,
            logo: 'https://nowastedmed.web.app/assets/logo.png'
          }
        };

        const linkResponse = await flw.Payment.create_link(paymentLinkPayload);
        paymentResult = {
          success: linkResponse.status === 'success',
          data: linkResponse.data,
          error: linkResponse.message
        };
      }

      if (!paymentResult.success) {
        // Update request as failed
        await topUpRef.update({
          status: 'failed',
          errorMessage: paymentResult.error,
          updatedAt: Date.now()
        });

        throw new HttpsError(
          'internal',
          paymentResult.error || 'Failed to initiate payment'
        );
      }

      // 10. Update request with Flutterwave response
      const paymentLink = paymentResult.data?.link ||
                          paymentResult.data?.meta?.authorization?.redirect ||
                          null;

      await topUpRef.update({
        flutterwaveRef: paymentResult.data?.flw_ref || null,
        paymentLink,
        updatedAt: Date.now()
      });

      // 11. Create audit log
      await createAuditLog({
        userId,
        action: 'topup_initiated',
        resource: 'wallet',
        resourceId: userId,
        details: {
          amount: data.amount,
          currency: data.currency,
          txRef,
          paymentMethod: data.paymentMethod
        }
      });

      // 12. Return response
      return {
        success: true,
        transactionId: topUpRef.id,
        paymentLink,
        message: 'Payment initiated successfully'
      };

    } catch (error: any) {
      console.error('Top-up error:', error);

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new HttpsError(
        'internal',
        error.message || 'An unexpected error occurred'
      );
    }
  }
);
