/**
 * Money Helpers
 *
 * Utilities for handling monetary amounts safely.
 * All internal amounts are stored in cents (integer) to avoid
 * floating-point precision issues.
 */

/**
 * Supported currencies with their decimal places
 */
const CURRENCY_DECIMALS: Record<string, number> = {
  XOF: 0,  // West African CFA franc (no decimals)
  XAF: 0,  // Central African CFA franc (no decimals)
  GNF: 0,  // Guinean franc (no decimals)
  NGN: 2,  // Nigerian Naira
  GHS: 2,  // Ghanaian Cedi
  KES: 2,  // Kenyan Shilling
  TZS: 2,  // Tanzanian Shilling
  UGX: 0,  // Ugandan Shilling (no decimals)
  BWP: 2,  // Botswanan Pula
  ZAR: 2,  // South African Rand
  USD: 2,  // US Dollar
  EUR: 2   // Euro
};

/**
 * Get decimal places for a currency
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2;
}

/**
 * Convert display amount to cents (integer storage)
 *
 * @param amount - Display amount (e.g., 100.50)
 * @param currency - Currency code
 * @returns Integer amount in smallest unit
 *
 * @example
 * toCents(100.50, 'NGN') // 10050
 * toCents(1000, 'XOF')   // 1000 (no decimals)
 */
export function toCents(amount: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier);
}

/**
 * Convert cents to display amount
 *
 * @param cents - Amount in smallest unit
 * @param currency - Currency code
 * @returns Display amount
 *
 * @example
 * fromCents(10050, 'NGN') // 100.50
 * fromCents(1000, 'XOF')  // 1000
 */
export function fromCents(cents: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  const divisor = Math.pow(10, decimals);
  return cents / divisor;
}

/**
 * Format amount for display
 *
 * @param amount - Display amount
 * @param currency - Currency code
 * @returns Formatted string
 *
 * @example
 * formatAmount(1000, 'XOF') // "1,000 XOF"
 * formatAmount(100.50, 'NGN') // "100.50 NGN"
 */
export function formatAmount(amount: number, currency: string): string {
  const decimals = getCurrencyDecimals(currency);

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${formatted} ${currency}`;
}

/**
 * Validate amount is positive and within limits
 *
 * @param amountCents - Amount in cents
 * @param currency - Currency code
 * @param minCents - Minimum allowed (default: 100 cents)
 * @param maxCents - Maximum allowed (default: 100,000,000 cents = 1M)
 * @returns Validation result
 */
export function validateAmount(
  amountCents: number,
  currency: string,
  minCents: number = 100,
  maxCents: number = 100000000
): { valid: boolean; error?: string } {
  if (!Number.isInteger(amountCents)) {
    return { valid: false, error: 'Amount must be an integer (cents)' };
  }

  if (amountCents <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }

  if (amountCents < minCents) {
    const minDisplay = fromCents(minCents, currency);
    return {
      valid: false,
      error: `Minimum amount is ${formatAmount(minDisplay, currency)}`
    };
  }

  if (amountCents > maxCents) {
    const maxDisplay = fromCents(maxCents, currency);
    return {
      valid: false,
      error: `Maximum amount is ${formatAmount(maxDisplay, currency)}`
    };
  }

  return { valid: true };
}

/**
 * Calculate fee based on amount
 *
 * @param amountCents - Transaction amount in cents
 * @param feePercent - Fee percentage (e.g., 1.4 for 1.4%)
 * @param feeCap - Maximum fee in cents (optional)
 * @returns Fee amount in cents
 */
export function calculateFee(
  amountCents: number,
  feePercent: number,
  feeCap?: number
): number {
  const fee = Math.round(amountCents * (feePercent / 100));
  if (feeCap && fee > feeCap) {
    return feeCap;
  }
  return fee;
}

/**
 * Safe addition of money amounts (avoids floating point issues)
 */
export function addCents(a: number, b: number): number {
  return Math.round(a + b);
}

/**
 * Safe subtraction of money amounts
 */
export function subtractCents(a: number, b: number): number {
  return Math.round(a - b);
}
