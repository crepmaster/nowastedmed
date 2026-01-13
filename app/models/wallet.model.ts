/**
 * Wallet Models
 *
 * Models for wallet and transaction management
 */

export type TransactionType = 'credit' | 'debit' | 'refund' | 'subscription_payment' | 'exchange_fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Supported Regions
 */
export type SupportedRegion =
    | 'west_africa_xof'    // Benin, Togo, Senegal, Ivory Coast, Burkina Faso, Mali, Niger, Guinea-Bissau
    | 'west_africa_ngn'    // Nigeria
    | 'west_africa_ghs'    // Ghana
    | 'west_africa_gnf'    // Guinea
    | 'east_africa_kes'    // Kenya
    | 'east_africa_tzs'    // Tanzania
    | 'east_africa_ugx'    // Uganda
    | 'southern_africa_bwp'; // Botswana

/**
 * Mobile Money Provider Configuration
 */
export interface MobileMoneyProvider {
    id: string;
    name: string;
    shortName: string;
    regions: SupportedRegion[];
    currencies: string[];
    hasApi: boolean;
    apiType?: 'direct' | 'aggregator';
    aggregator?: string; // If using aggregator like Flutterwave, Paystack
    logo?: string;
    phonePrefix?: string[];
    isActive: boolean;
}

/**
 * All Supported Mobile Money Providers
 */
export const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
    // ============================================
    // WEST AFRICA - XOF Zone (Francophone)
    // ============================================
    {
        id: 'mtn_momo_xof',
        name: 'MTN Mobile Money',
        shortName: 'MTN MoMo',
        regions: ['west_africa_xof'],
        currencies: ['XOF'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+229', '+228', '+225', '+221'], // Benin, Togo, Ivory Coast, Senegal
        isActive: true,
    },
    {
        id: 'orange_money_xof',
        name: 'Orange Money',
        shortName: 'Orange',
        regions: ['west_africa_xof'],
        currencies: ['XOF'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+229', '+228', '+225', '+221'],
        isActive: true,
    },
    {
        id: 'moov_money',
        name: 'Moov Money',
        shortName: 'Moov',
        regions: ['west_africa_xof'],
        currencies: ['XOF'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Flutterwave',
        phonePrefix: ['+229', '+228'],
        isActive: true,
    },
    {
        id: 'wave_xof',
        name: 'Wave',
        shortName: 'Wave',
        regions: ['west_africa_xof'],
        currencies: ['XOF'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+221', '+225'], // Senegal, Ivory Coast
        isActive: true,
    },
    {
        id: 'free_money',
        name: 'Free Money',
        shortName: 'Free',
        regions: ['west_africa_xof'],
        currencies: ['XOF'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Flutterwave',
        phonePrefix: ['+221'], // Senegal
        isActive: true,
    },

    // ============================================
    // WEST AFRICA - Nigeria (NGN)
    // ============================================
    {
        id: 'mtn_momo_ng',
        name: 'MTN MoMo Nigeria',
        shortName: 'MTN MoMo',
        regions: ['west_africa_ngn'],
        currencies: ['NGN'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+234'],
        isActive: true,
    },
    {
        id: 'airtel_money_ng',
        name: 'Airtel Money Nigeria',
        shortName: 'Airtel',
        regions: ['west_africa_ngn'],
        currencies: ['NGN'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Paystack',
        phonePrefix: ['+234'],
        isActive: true,
    },
    {
        id: 'opay_ng',
        name: 'OPay',
        shortName: 'OPay',
        regions: ['west_africa_ngn'],
        currencies: ['NGN'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+234'],
        isActive: true,
    },
    {
        id: 'palmpay_ng',
        name: 'PalmPay',
        shortName: 'PalmPay',
        regions: ['west_africa_ngn'],
        currencies: ['NGN'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Flutterwave',
        phonePrefix: ['+234'],
        isActive: true,
    },

    // ============================================
    // WEST AFRICA - Ghana (GHS)
    // ============================================
    {
        id: 'mtn_momo_gh',
        name: 'MTN Mobile Money Ghana',
        shortName: 'MTN MoMo',
        regions: ['west_africa_ghs'],
        currencies: ['GHS'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+233'],
        isActive: true,
    },
    {
        id: 'vodafone_cash_gh',
        name: 'Vodafone Cash',
        shortName: 'Vodafone',
        regions: ['west_africa_ghs'],
        currencies: ['GHS'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Paystack',
        phonePrefix: ['+233'],
        isActive: true,
    },
    {
        id: 'airteltigo_gh',
        name: 'AirtelTigo Money',
        shortName: 'AirtelTigo',
        regions: ['west_africa_ghs'],
        currencies: ['GHS'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Paystack',
        phonePrefix: ['+233'],
        isActive: true,
    },

    // ============================================
    // WEST AFRICA - Guinea (GNF)
    // ============================================
    {
        id: 'orange_money_gn',
        name: 'Orange Money Guinea',
        shortName: 'Orange',
        regions: ['west_africa_gnf'],
        currencies: ['GNF'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+224'],
        isActive: true,
    },
    {
        id: 'mtn_momo_gn',
        name: 'MTN Mobile Money Guinea',
        shortName: 'MTN MoMo',
        regions: ['west_africa_gnf'],
        currencies: ['GNF'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+224'],
        isActive: true,
    },

    // ============================================
    // EAST AFRICA - Kenya (KES)
    // ============================================
    {
        id: 'mpesa_ke',
        name: 'M-Pesa Kenya',
        shortName: 'M-Pesa',
        regions: ['east_africa_kes'],
        currencies: ['KES'],
        hasApi: true,
        apiType: 'direct', // Safaricom Daraja API
        phonePrefix: ['+254'],
        isActive: true,
    },
    {
        id: 'airtel_money_ke',
        name: 'Airtel Money Kenya',
        shortName: 'Airtel',
        regions: ['east_africa_kes'],
        currencies: ['KES'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'IntaSend',
        phonePrefix: ['+254'],
        isActive: true,
    },
    {
        id: 'tkash_ke',
        name: 'T-Kash',
        shortName: 'T-Kash',
        regions: ['east_africa_kes'],
        currencies: ['KES'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Pesapal',
        phonePrefix: ['+254'],
        isActive: true,
    },

    // ============================================
    // EAST AFRICA - Tanzania (TZS)
    // ============================================
    {
        id: 'mpesa_tz',
        name: 'M-Pesa Tanzania',
        shortName: 'M-Pesa',
        regions: ['east_africa_tzs'],
        currencies: ['TZS'],
        hasApi: true,
        apiType: 'direct', // Vodacom M-Pesa API
        phonePrefix: ['+255'],
        isActive: true,
    },
    {
        id: 'tigopesa_tz',
        name: 'Tigo Pesa',
        shortName: 'Tigo Pesa',
        regions: ['east_africa_tzs'],
        currencies: ['TZS'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Beyonic',
        phonePrefix: ['+255'],
        isActive: true,
    },
    {
        id: 'airtel_money_tz',
        name: 'Airtel Money Tanzania',
        shortName: 'Airtel',
        regions: ['east_africa_tzs'],
        currencies: ['TZS'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Beyonic',
        phonePrefix: ['+255'],
        isActive: true,
    },
    {
        id: 'halopesa_tz',
        name: 'HaloPesa',
        shortName: 'HaloPesa',
        regions: ['east_africa_tzs'],
        currencies: ['TZS'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Beyonic',
        phonePrefix: ['+255'],
        isActive: true,
    },

    // ============================================
    // EAST AFRICA - Uganda (UGX)
    // ============================================
    {
        id: 'mtn_momo_ug',
        name: 'MTN Mobile Money Uganda',
        shortName: 'MTN MoMo',
        regions: ['east_africa_ugx'],
        currencies: ['UGX'],
        hasApi: true,
        apiType: 'direct', // MTN MoMo API launched in Uganda first
        phonePrefix: ['+256'],
        isActive: true,
    },
    {
        id: 'airtel_money_ug',
        name: 'Airtel Money Uganda',
        shortName: 'Airtel',
        regions: ['east_africa_ugx'],
        currencies: ['UGX'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'Beyonic',
        phonePrefix: ['+256'],
        isActive: true,
    },

    // ============================================
    // SOUTHERN AFRICA - Botswana (BWP)
    // ============================================
    {
        id: 'orange_money_bw',
        name: 'Orange Money Botswana',
        shortName: 'Orange',
        regions: ['southern_africa_bwp'],
        currencies: ['BWP'],
        hasApi: true,
        apiType: 'direct',
        phonePrefix: ['+267'],
        isActive: true,
    },
    {
        id: 'myzaka_bw',
        name: 'MyZaka',
        shortName: 'MyZaka',
        regions: ['southern_africa_bwp'],
        currencies: ['BWP'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'DPO',
        phonePrefix: ['+267'],
        isActive: true,
    },
    {
        id: 'smega_bw',
        name: 'Smega',
        shortName: 'Smega',
        regions: ['southern_africa_bwp'],
        currencies: ['BWP'],
        hasApi: true,
        apiType: 'aggregator',
        aggregator: 'DPO',
        phonePrefix: ['+267'],
        isActive: true,
    },
];

/**
 * Currency Configuration
 */
export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    region: SupportedRegion;
    decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
    { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', region: 'west_africa_xof', decimalPlaces: 0 },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'west_africa_ngn', decimalPlaces: 2 },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', region: 'west_africa_ghs', decimalPlaces: 2 },
    { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', region: 'west_africa_gnf', decimalPlaces: 0 },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'east_africa_kes', decimalPlaces: 2 },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'east_africa_tzs', decimalPlaces: 2 },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'east_africa_ugx', decimalPlaces: 0 },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P', region: 'southern_africa_bwp', decimalPlaces: 2 },
];

/**
 * Get providers by region
 */
export function getProvidersByRegion(region: SupportedRegion): MobileMoneyProvider[] {
    return MOBILE_MONEY_PROVIDERS.filter(p => p.regions.includes(region) && p.isActive);
}

/**
 * Get providers by currency
 */
export function getProvidersByCurrency(currency: string): MobileMoneyProvider[] {
    return MOBILE_MONEY_PROVIDERS.filter(p => p.currencies.includes(currency) && p.isActive);
}

/**
 * Get currency config
 */
export function getCurrencyConfig(code: string): CurrencyConfig | undefined {
    return SUPPORTED_CURRENCIES.find(c => c.code === code);
}

/**
 * User Wallet
 */
export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    region?: SupportedRegion;
    isActive: boolean;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Wallet Transaction
 */
export interface WalletTransaction {
    id: string;
    walletId: string;
    userId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    description: string;
    referenceId?: string; // Exchange ID, Subscription ID, etc.
    referenceType?: 'exchange' | 'subscription' | 'topup' | 'withdrawal';
    metadata?: Record<string, any>;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Top-up Request
 */
export interface TopUpRequest {
    amount: number;
    currency: string;
    paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
    phoneNumber?: string;
    providerId?: string;
    provider?: string; // Provider display name
}

/**
 * Withdraw Request
 */
export interface WithdrawRequest {
    amount: number;
    currency: string;
    paymentMethod: 'mobile_money' | 'bank_transfer';
    phoneNumber?: string;
    providerId?: string;
    provider?: string; // Provider display name
    bankAccountNumber?: string;
    bankName?: string;
}

/**
 * Wallet Summary for display
 */
export interface WalletSummary {
    balance: number;
    currency: string;
    pendingCredits: number;
    pendingDebits: number;
    lastTransactionDate?: Date;
    totalTransactions: number;
}
