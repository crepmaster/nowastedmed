/**
 * Wallet Firebase Service
 *
 * Handles wallet and transaction operations with Firebase
 * Note: Wallet balance modifications should be done via Cloud Functions
 * for security. This service provides read access and initiates requests.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Wallet, WalletTransaction, WalletSummary, TopUpRequest } from '../../models/wallet.model';

export class WalletFirebaseService {
    private static instance: WalletFirebaseService;
    private firestore: any;
    private readonly WALLETS_COLLECTION = 'wallets';
    private readonly LEDGER_COLLECTION = 'ledger';
    private readonly TOPUP_REQUESTS_COLLECTION = 'topup_requests';

    private constructor() {
        this.firestore = firebase().firestore();
    }

    static getInstance(): WalletFirebaseService {
        if (!WalletFirebaseService.instance) {
            WalletFirebaseService.instance = new WalletFirebaseService();
        }
        return WalletFirebaseService.instance;
    }

    /**
     * Get user's wallet
     */
    async getWallet(userId: string): Promise<Wallet | null> {
        try {
            const doc = await this.firestore
                .collection(this.WALLETS_COLLECTION)
                .doc(userId)
                .get();

            if (doc.exists) {
                return this.transformWallet(doc);
            }
            return null;
        } catch (error) {
            console.error('Error getting wallet:', error);
            throw error;
        }
    }

    /**
     * Subscribe to wallet updates (real-time)
     */
    subscribeToWallet(userId: string, callback: (wallet: Wallet | null) => void): () => void {
        return this.firestore
            .collection(this.WALLETS_COLLECTION)
            .doc(userId)
            .onSnapshot((doc: any) => {
                if (doc.exists) {
                    callback(this.transformWallet(doc));
                } else {
                    callback(null);
                }
            }, (error: any) => {
                console.error('Wallet subscription error:', error);
                callback(null);
            });
    }

    /**
     * Get wallet transactions
     */
    async getTransactions(userId: string, limit: number = 20): Promise<WalletTransaction[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => this.transformTransaction(doc));
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw error;
        }
    }

    /**
     * Subscribe to transaction updates (real-time)
     */
    subscribeToTransactions(
        userId: string,
        callback: (transactions: WalletTransaction[]) => void,
        limit: number = 20
    ): () => void {
        return this.firestore
            .collection(this.LEDGER_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .onSnapshot((snapshot: any) => {
                const transactions = snapshot.docs.map((doc: any) => this.transformTransaction(doc));
                callback(transactions);
            }, (error: any) => {
                console.error('Transaction subscription error:', error);
                callback([]);
            });
    }

    /**
     * Get a single transaction by ID
     */
    async getTransaction(transactionId: string): Promise<WalletTransaction | null> {
        try {
            const doc = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .doc(transactionId)
                .get();

            if (doc.exists) {
                return this.transformTransaction(doc);
            }
            return null;
        } catch (error) {
            console.error('Error getting transaction:', error);
            throw error;
        }
    }

    /**
     * Request a top-up (creates a pending request for backend to process)
     */
    async requestTopUp(userId: string, request: TopUpRequest): Promise<string> {
        try {
            const docRef = await this.firestore
                .collection(this.TOPUP_REQUESTS_COLLECTION)
                .add({
                    userId,
                    amount: request.amount,
                    paymentMethod: request.paymentMethod,
                    phoneNumber: request.phoneNumber || null,
                    provider: request.provider || null,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

            console.log('Top-up request created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating top-up request:', error);
            throw error;
        }
    }

    /**
     * Get wallet summary with pending transactions
     */
    async getWalletSummary(userId: string): Promise<WalletSummary | null> {
        try {
            const wallet = await this.getWallet(userId);
            if (!wallet) {
                return null;
            }

            // Get pending transactions
            const pendingSnapshot = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .where('userId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            let pendingCredits = 0;
            let pendingDebits = 0;

            pendingSnapshot.docs.forEach((doc: any) => {
                const data = doc.data();
                if (data.type === 'credit' || data.type === 'refund') {
                    pendingCredits += data.amount;
                } else {
                    pendingDebits += data.amount;
                }
            });

            // Get total transaction count
            const countSnapshot = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .where('userId', '==', userId)
                .get();

            // Get last transaction
            const lastTransactionSnapshot = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            let lastTransactionDate: Date | undefined;
            if (!lastTransactionSnapshot.empty) {
                const lastTx = lastTransactionSnapshot.docs[0].data();
                lastTransactionDate = lastTx.createdAt?.toDate?.() || lastTx.createdAt;
            }

            return {
                balance: wallet.balance,
                currency: wallet.currency,
                pendingCredits,
                pendingDebits,
                lastTransactionDate,
                totalTransactions: countSnapshot.size,
            };
        } catch (error) {
            console.error('Error getting wallet summary:', error);
            throw error;
        }
    }

    /**
     * Get transactions filtered by type
     */
    async getTransactionsByType(
        userId: string,
        type: string,
        limit: number = 20
    ): Promise<WalletTransaction[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.LEDGER_COLLECTION)
                .where('userId', '==', userId)
                .where('type', '==', type)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => this.transformTransaction(doc));
        } catch (error) {
            console.error('Error getting transactions by type:', error);
            throw error;
        }
    }

    /**
     * Transform Firestore document to Wallet
     */
    private transformWallet(doc: any): Wallet {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            balance: data.balance || 0,
            currency: data.currency || 'XOF',
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    }

    /**
     * Transform Firestore document to WalletTransaction
     */
    private transformTransaction(doc: any): WalletTransaction {
        const data = doc.data();
        return {
            id: doc.id,
            walletId: data.walletId,
            userId: data.userId,
            type: data.type,
            amount: data.amount,
            currency: data.currency || 'XOF',
            status: data.status,
            description: data.description,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
            metadata: data.metadata,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    }
}
