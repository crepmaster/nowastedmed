/**
 * Courier Earnings Firebase Service
 *
 * Handles all courier earnings, payouts, and wallet operations.
 * Tracks delivery fees, platform commissions, and payout processing.
 *
 * SECURITY UPDATE: Financial mutations are now handled by Cloud Functions.
 * - createEarning: Handled by onDeliveryCompleted trigger
 * - processPendingEarnings: Handled by releaseCourierEarnings scheduled function
 * - requestPayout: Now calls Cloud Function
 * - completePayout/failPayout: Admin-only via Cloud Functions
 *
 * This service now primarily handles:
 * - Read operations (getCourierEarnings, getCourierWallet, getEarningsSummary)
 * - Calling Cloud Functions for mutations
 * - Payment preference updates (allowed by rules)
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import '@nativescript/firebase-functions';
import { AuthFirebaseService } from './auth-firebase.service';
import {
    CourierEarning,
    CourierPayout,
    CourierWallet,
    DeliveryFeeConfig,
    EarningsSummary,
    EarningStatus,
    PayoutStatus,
    Delivery,
} from '../../models/delivery.model';

/**
 * Payout request from courier
 */
export interface PayoutRequest {
    amount: number;
    paymentMethod: 'mobile_money' | 'bank_transfer';
    paymentProvider?: string;
    paymentAccount: string;
    accountHolderName: string;
}

/**
 * Fee calculation result
 */
export interface FeeCalculation {
    deliveryFee: number;
    platformFee: number;
    courierEarning: number;
    currency: string;
}

export class CourierEarningsFirebaseService {
    private static instance: CourierEarningsFirebaseService;
    private firestore: any;
    private functions: any;
    private authService: AuthFirebaseService;

    private readonly EARNINGS_COLLECTION = 'courier_earnings';
    private readonly PAYOUTS_COLLECTION = 'courier_payouts';
    private readonly WALLETS_COLLECTION = 'courier_wallets';
    private readonly FEE_CONFIG_COLLECTION = 'delivery_fee_configs';

    // Default platform commission (15%)
    private readonly DEFAULT_PLATFORM_COMMISSION = 15;
    // Default base fee in local currency unit
    private readonly DEFAULT_BASE_FEE = 500;

    private constructor() {
        this.firestore = firebase().firestore();
        this.functions = firebase().functions('europe-west1');
        this.authService = AuthFirebaseService.getInstance();
    }

    static getInstance(): CourierEarningsFirebaseService {
        if (!CourierEarningsFirebaseService.instance) {
            CourierEarningsFirebaseService.instance = new CourierEarningsFirebaseService();
        }
        return CourierEarningsFirebaseService.instance;
    }

    // ========================================
    // FEE CALCULATION
    // ========================================

    /**
     * Calculate delivery fee for a city
     */
    async calculateDeliveryFee(cityId: string, countryCode: string): Promise<FeeCalculation> {
        try {
            // Get fee config for city
            const config = await this.getFeeConfigForCity(cityId);

            let deliveryFee: number;
            let platformCommissionPercent: number;
            let currency: string;

            if (config) {
                deliveryFee = config.baseFee;
                platformCommissionPercent = config.platformCommissionPercent;
                currency = config.currency;
            } else {
                // Use defaults based on country
                const defaultConfig = this.getDefaultFeeConfig(countryCode);
                deliveryFee = defaultConfig.baseFee;
                platformCommissionPercent = defaultConfig.platformCommissionPercent;
                currency = defaultConfig.currency;
            }

            const platformFee = Math.round((deliveryFee * platformCommissionPercent) / 100);
            const courierEarning = deliveryFee - platformFee;

            return {
                deliveryFee,
                platformFee,
                courierEarning,
                currency,
            };
        } catch (error) {
            console.error('Error calculating delivery fee:', error);
            throw error;
        }
    }

    /**
     * Get fee configuration for a city
     */
    async getFeeConfigForCity(cityId: string): Promise<DeliveryFeeConfig | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.FEE_CONFIG_COLLECTION)
                .where('cityId', '==', cityId)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            };
        } catch (error) {
            console.error('Error getting fee config:', error);
            return null;
        }
    }

    /**
     * Get default fee configuration based on country
     */
    private getDefaultFeeConfig(countryCode: string): { baseFee: number; platformCommissionPercent: number; currency: string } {
        // Default fees by country/region
        const configs: Record<string, { baseFee: number; currency: string }> = {
            CM: { baseFee: 500, currency: 'XAF' },      // Cameroon
            NG: { baseFee: 500, currency: 'NGN' },      // Nigeria
            KE: { baseFee: 100, currency: 'KES' },      // Kenya
            GH: { baseFee: 10, currency: 'GHS' },       // Ghana
            SN: { baseFee: 500, currency: 'XOF' },      // Senegal
            CI: { baseFee: 500, currency: 'XOF' },      // Ivory Coast
            TZ: { baseFee: 2000, currency: 'TZS' },     // Tanzania
            UG: { baseFee: 5000, currency: 'UGX' },     // Uganda
            RW: { baseFee: 500, currency: 'RWF' },      // Rwanda
            ZA: { baseFee: 50, currency: 'ZAR' },       // South Africa
        };

        const config = configs[countryCode?.toUpperCase()] || { baseFee: 500, currency: 'XAF' };

        return {
            ...config,
            platformCommissionPercent: this.DEFAULT_PLATFORM_COMMISSION,
        };
    }

    // ========================================
    // EARNINGS MANAGEMENT
    // ========================================

    /**
     * Create earning record when delivery is completed
     *
     * SECURITY UPDATE: This method is now DEPRECATED.
     * Earnings are created automatically by the onDeliveryCompleted Cloud Function
     * when delivery status changes to 'delivered'.
     *
     * This method is kept for backward compatibility but will throw an error.
     * The Cloud Function handles:
     * - Earning creation
     * - Wallet balance updates
     * - Audit logging
     *
     * @deprecated Use Cloud Function trigger instead
     */
    async createEarning(delivery: Delivery): Promise<string> {
        // Check if earning already exists (created by Cloud Function)
        const existingEarning = await this.firestore
            .collection(this.EARNINGS_COLLECTION)
            .where('deliveryId', '==', delivery.id)
            .limit(1)
            .get();

        if (!existingEarning.empty) {
            console.log('Earning already exists (created by Cloud Function):', delivery.id);
            return existingEarning.docs[0].id;
        }

        // If no earning exists yet, the Cloud Function hasn't triggered yet
        // This can happen if there's a timing issue
        console.log('Waiting for Cloud Function to create earning for delivery:', delivery.id);
        throw new Error('Earning creation is now handled by Cloud Function. Please wait a moment and refresh.');
    }

    /**
     * Process pending earnings - move to available after hold period
     *
     * SECURITY UPDATE: This method is now DEPRECATED.
     * Earnings processing is handled by the releaseCourierEarnings Cloud Function
     * which runs on a schedule (every hour).
     *
     * @deprecated Use Cloud Function scheduler instead
     */
    async processPendingEarnings(): Promise<number> {
        console.warn('processPendingEarnings is deprecated. Use Cloud Function scheduler instead.');
        // Return 0 as this is now handled by Cloud Functions
        return 0;
    }

    /**
     * Get courier earnings history
     */
    async getCourierEarnings(
        courierId: string,
        status?: EarningStatus,
        limit: number = 50
    ): Promise<CourierEarning[]> {
        try {
            let query = this.firestore
                .collection(this.EARNINGS_COLLECTION)
                .where('courierId', '==', courierId);

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                deliveryCompletedAt: doc.data().deliveryCompletedAt?.toDate?.() || doc.data().deliveryCompletedAt,
                availableAt: doc.data().availableAt?.toDate?.() || doc.data().availableAt,
                paidAt: doc.data().paidAt?.toDate?.() || doc.data().paidAt,
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting courier earnings:', error);
            throw error;
        }
    }

    // ========================================
    // WALLET OPERATIONS
    // ========================================

    /**
     * Get or create courier wallet
     */
    async getCourierWallet(courierId: string): Promise<CourierWallet> {
        try {
            const docRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(courierId);
            const doc = await docRef.get();

            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data(),
                    updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
                };
            }

            // Create new wallet
            const wallet: Omit<CourierWallet, 'id'> = {
                courierId,
                availableBalance: 0,
                pendingBalance: 0,
                totalEarned: 0,
                totalWithdrawn: 0,
                currency: 'XAF', // Default currency
                updatedAt: new Date(),
            };

            await docRef.set(wallet);

            return { id: courierId, ...wallet };
        } catch (error) {
            console.error('Error getting courier wallet:', error);
            throw error;
        }
    }

    /**
     * Get earnings summary for dashboard
     */
    async getEarningsSummary(courierId: string): Promise<EarningsSummary> {
        try {
            const wallet = await this.getCourierWallet(courierId);

            // Calculate date ranges
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get earnings for different periods
            const allEarnings = await this.getCourierEarnings(courierId, undefined, 500);

            let todayEarnings = 0;
            let weekEarnings = 0;
            let monthEarnings = 0;
            let todayCount = 0;
            let weekCount = 0;
            let monthCount = 0;

            for (const earning of allEarnings) {
                const date = earning.deliveryCompletedAt instanceof Date
                    ? earning.deliveryCompletedAt
                    : new Date(earning.deliveryCompletedAt);

                if (date >= startOfDay) {
                    todayEarnings += earning.netAmount;
                    todayCount++;
                }
                if (date >= startOfWeek) {
                    weekEarnings += earning.netAmount;
                    weekCount++;
                }
                if (date >= startOfMonth) {
                    monthEarnings += earning.netAmount;
                    monthCount++;
                }
            }

            return {
                availableBalance: wallet.availableBalance,
                pendingBalance: wallet.pendingBalance,
                todayEarnings,
                weekEarnings,
                monthEarnings,
                totalEarnings: wallet.totalEarned,
                currency: wallet.currency,
                completedDeliveriesToday: todayCount,
                completedDeliveriesThisWeek: weekCount,
                completedDeliveriesThisMonth: monthCount,
            };
        } catch (error) {
            console.error('Error getting earnings summary:', error);
            throw error;
        }
    }

    /**
     * Update courier payment preferences
     */
    async updatePaymentPreferences(
        courierId: string,
        preferences: {
            preferredPaymentMethod: 'mobile_money' | 'bank_transfer';
            preferredProvider?: string;
            paymentAccount: string;
            accountHolderName: string;
        }
    ): Promise<void> {
        try {
            await this.firestore
                .collection(this.WALLETS_COLLECTION)
                .doc(courierId)
                .update({
                    ...preferences,
                    updatedAt: new Date(),
                });

            console.log('Updated payment preferences for courier:', courierId);
        } catch (error) {
            console.error('Error updating payment preferences:', error);
            throw error;
        }
    }

    // ========================================
    // PAYOUT OPERATIONS
    // ========================================

    /**
     * Request a payout
     * SECURITY UPDATE: Now calls Cloud Function instead of direct Firestore mutation
     */
    async requestPayout(courierId: string, request: PayoutRequest): Promise<string> {
        try {
            // Validate current user is the courier requesting payout
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser || currentUser.id !== courierId) {
                throw new Error('Unauthorized: Can only request payout for yourself');
            }

            // Basic input validation (Cloud Function does full validation)
            if (request.amount <= 0) {
                throw new Error('Payout amount must be positive');
            }

            if (!request.paymentAccount || request.paymentAccount.length < 8) {
                throw new Error('Invalid payment account');
            }

            if (!request.accountHolderName || request.accountHolderName.length < 2) {
                throw new Error('Account holder name is required');
            }

            // Get wallet to determine currency
            const wallet = await this.getCourierWallet(courierId);

            // Call Cloud Function
            const requestPayoutFn = this.functions.httpsCallable('requestPayout');
            const result = await requestPayoutFn({
                amount: request.amount,
                currency: wallet.currency,
                paymentMethod: request.paymentMethod,
                paymentProvider: request.paymentProvider,
                paymentAccount: request.paymentAccount,
                accountHolderName: request.accountHolderName,
            });

            const data = result.data as { success: boolean; message: string; payoutId?: string };

            if (!data.success) {
                throw new Error(data.message || 'Payout request failed');
            }

            console.log('Created payout request via Cloud Function:', data.payoutId);
            return data.payoutId!;
        } catch (error: any) {
            console.error('Error requesting payout:', error);
            // Handle Cloud Function errors
            if (error.code) {
                throw new Error(error.message || 'Payout request failed');
            }
            throw error;
        }
    }

    /**
     * Get courier payouts
     */
    async getCourierPayouts(
        courierId: string,
        status?: PayoutStatus,
        limit: number = 20
    ): Promise<CourierPayout[]> {
        try {
            let query = this.firestore
                .collection(this.PAYOUTS_COLLECTION)
                .where('courierId', '==', courierId);

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                processedAt: doc.data().processedAt?.toDate?.() || doc.data().processedAt,
                completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
            }));
        } catch (error) {
            console.error('Error getting courier payouts:', error);
            throw error;
        }
    }

    /**
     * Complete a payout (admin operation)
     *
     * SECURITY UPDATE: This method is now DEPRECATED.
     * Payout completion is handled by admin Cloud Functions only.
     *
     * @deprecated Use admin Cloud Function instead
     */
    async completePayout(
        _payoutId: string,
        _transactionId: string,
        _adminId: string
    ): Promise<void> {
        console.warn('completePayout is deprecated. Use admin Cloud Function instead.');
        throw new Error('Payout completion is now handled by admin Cloud Functions only.');
    }

    /**
     * Fail a payout (admin operation)
     *
     * SECURITY UPDATE: This method is now DEPRECATED.
     * Payout failure processing is handled by admin Cloud Functions only.
     *
     * @deprecated Use admin Cloud Function instead
     */
    async failPayout(
        _payoutId: string,
        _reason: string,
        _adminId: string
    ): Promise<void> {
        console.warn('failPayout is deprecated. Use admin Cloud Function instead.');
        throw new Error('Payout failure processing is now handled by admin Cloud Functions only.');
    }

    // ========================================
    // FEE CONFIGURATION (ADMIN)
    // ========================================

    /**
     * Create or update fee configuration for a city
     */
    async setFeeConfig(
        config: Omit<DeliveryFeeConfig, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<string> {
        try {
            // Check if config already exists
            const existing = await this.getFeeConfigForCity(config.cityId);

            const configData = {
                ...config,
                updatedAt: new Date(),
            };

            if (existing) {
                await this.firestore
                    .collection(this.FEE_CONFIG_COLLECTION)
                    .doc(existing.id)
                    .update(configData);
                return existing.id;
            }

            const docRef = await this.firestore
                .collection(this.FEE_CONFIG_COLLECTION)
                .add({
                    ...configData,
                    createdAt: new Date(),
                });

            return docRef.id;
        } catch (error) {
            console.error('Error setting fee config:', error);
            throw error;
        }
    }

    /**
     * Get all fee configurations
     */
    async getAllFeeConfigs(): Promise<DeliveryFeeConfig[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.FEE_CONFIG_COLLECTION)
                .orderBy('countryCode', 'asc')
                .orderBy('cityName', 'asc')
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting fee configs:', error);
            throw error;
        }
    }
}
