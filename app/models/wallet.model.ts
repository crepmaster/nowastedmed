/**
 * Wallet Models
 *
 * Models for wallet and transaction management
 */

export type TransactionType = 'credit' | 'debit' | 'refund' | 'subscription_payment' | 'exchange_fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * User Wallet
 */
export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    currency: string;
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
    paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
    phoneNumber?: string;
    provider?: string; // MTN, Orange, etc.
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
