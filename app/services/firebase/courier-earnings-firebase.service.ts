/**
 * Courier Earnings Firebase Service
 *
 * Handles all courier earnings, payouts, and wallet operations.
 * Tracks delivery fees, platform commissions, and payout processing.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { FieldValue } from '@nativescript/firebase-firestore';
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
    private authService: AuthFirebaseService;

    private readonly EARNINGS_COLLECTION = 'courier_earnings';
    private readonly PAYOUTS_COLLECTION = 'courier_payouts';
    private readonly WALLETS_COLLECTION = 'courier_wallets';
    private readonly FEE_CONFIG_COLLECTION = 'delivery_fee_configs';

    // Default platform commission (15%)
    private readonly DEFAULT_PLATFORM_COMMISSION = 15;
    // Default base fee in local currency unit
    private readonly DEFAULT_BASE_FEE = 500;
    // Hours before earnings become available for payout
    private readonly EARNINGS_HOLD_HOURS = 24;

    private constructor() {
        this.firestore = firebase().firestore();
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
     * Called by delivery service after confirmDelivery
     */
    async createEarning(delivery: Delivery): Promise<string> {
        try {
            if (!delivery.courierId) {
                throw new Error('Delivery has no assigned courier');
            }

            // Calculate fee if not already set
            let feeCalc: FeeCalculation;
            if (delivery.deliveryFee && delivery.currency) {
                const platformCommission = this.DEFAULT_PLATFORM_COMMISSION;
                const platformFee = Math.round((delivery.deliveryFee * platformCommission) / 100);
                feeCalc = {
                    deliveryFee: delivery.deliveryFee,
                    platformFee,
                    courierEarning: delivery.deliveryFee - platformFee,
                    currency: delivery.currency,
                };
            } else {
                feeCalc = await this.calculateDeliveryFee(
                    delivery.location?.cityId || '',
                    delivery.location?.countryCode || ''
                );
            }

            // Calculate when earnings become available
            const availableAt = new Date();
            availableAt.setHours(availableAt.getHours() + this.EARNINGS_HOLD_HOURS);

            const earningData: Omit<CourierEarning, 'id'> = {
                courierId: delivery.courierId,
                deliveryId: delivery.id,
                exchangeId: delivery.exchangeId,
                amount: feeCalc.deliveryFee,
                currency: feeCalc.currency,
                platformFee: feeCalc.platformFee,
                netAmount: feeCalc.courierEarning,
                status: 'pending',
                fromPharmacyName: delivery.fromPharmacyName,
                toPharmacyName: delivery.toPharmacyName,
                cityName: delivery.location?.cityName || '',
                deliveryCompletedAt: new Date(),
                availableAt,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Use batch to update earning and wallet atomically
            const batch = this.firestore.batch();

            // Create earning record
            const earningRef = this.firestore.collection(this.EARNINGS_COLLECTION).doc();
            batch.set(earningRef, earningData);

            // Update courier wallet
            const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(delivery.courierId);
            const walletDoc = await walletRef.get();

            if (walletDoc.exists) {
                batch.update(walletRef, {
                    pendingBalance: FieldValue.increment(feeCalc.courierEarning),
                    totalEarned: FieldValue.increment(feeCalc.courierEarning),
                    updatedAt: new Date(),
                });
            } else {
                // Initialize wallet if doesn't exist
                batch.set(walletRef, {
                    courierId: delivery.courierId,
                    availableBalance: 0,
                    pendingBalance: feeCalc.courierEarning,
                    totalEarned: feeCalc.courierEarning,
                    totalWithdrawn: 0,
                    currency: feeCalc.currency,
                    updatedAt: new Date(),
                });
            }

            await batch.commit();

            console.log('Created earning record:', earningRef.id);
            return earningRef.id;
        } catch (error) {
            console.error('Error creating earning:', error);
            throw error;
        }
    }

    /**
     * Process pending earnings - move to available after hold period
     * Should be called periodically (e.g., by a cloud function)
     */
    async processPendingEarnings(): Promise<number> {
        try {
            const now = new Date();

            // Get pending earnings that have passed the hold period
            const snapshot = await this.firestore
                .collection(this.EARNINGS_COLLECTION)
                .where('status', '==', 'pending')
                .where('availableAt', '<=', now)
                .limit(100)
                .get();

            if (snapshot.empty) {
                return 0;
            }

            let processedCount = 0;
            const courierUpdates = new Map<string, number>();

            // Group by courier
            for (const doc of snapshot.docs) {
                const earning = doc.data();
                const current = courierUpdates.get(earning.courierId) || 0;
                courierUpdates.set(earning.courierId, current + earning.netAmount);
            }

            // Process in batches
            for (const [courierId, amount] of courierUpdates) {
                const batch = this.firestore.batch();

                // Update all earnings for this courier
                const courierEarnings = snapshot.docs.filter(
                    (d: any) => d.data().courierId === courierId
                );

                for (const doc of courierEarnings) {
                    batch.update(doc.ref, {
                        status: 'available',
                        updatedAt: new Date(),
                    });
                    processedCount++;
                }

                // Update wallet - move from pending to available
                const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(courierId);
                batch.update(walletRef, {
                    pendingBalance: FieldValue.increment(-amount),
                    availableBalance: FieldValue.increment(amount),
                    updatedAt: new Date(),
                });

                await batch.commit();
            }

            console.log(`Processed ${processedCount} pending earnings`);
            return processedCount;
        } catch (error) {
            console.error('Error processing pending earnings:', error);
            throw error;
        }
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
     */
    async requestPayout(courierId: string, request: PayoutRequest): Promise<string> {
        try {
            const wallet = await this.getCourierWallet(courierId);

            // Validate amount
            if (request.amount <= 0) {
                throw new Error('Payout amount must be positive');
            }
            if (request.amount > wallet.availableBalance) {
                throw new Error('Insufficient available balance');
            }

            // Get available earnings to include in payout
            const availableEarnings = await this.getCourierEarnings(courierId, 'available', 100);
            let remainingAmount = request.amount;
            const earningIds: string[] = [];

            for (const earning of availableEarnings) {
                if (remainingAmount <= 0) break;
                earningIds.push(earning.id);
                remainingAmount -= earning.netAmount;
            }

            const payoutData: Omit<CourierPayout, 'id'> = {
                courierId,
                amount: request.amount,
                currency: wallet.currency,
                paymentMethod: request.paymentMethod,
                paymentProvider: request.paymentProvider,
                paymentAccount: request.paymentAccount,
                accountHolderName: request.accountHolderName,
                status: 'pending',
                statusHistory: [{
                    status: 'pending',
                    timestamp: new Date(),
                    note: 'Payout requested',
                }],
                earningIds,
                createdAt: new Date(),
            };

            // Use batch for atomic update
            const batch = this.firestore.batch();

            // Create payout record
            const payoutRef = this.firestore.collection(this.PAYOUTS_COLLECTION).doc();
            batch.set(payoutRef, payoutData);

            // Update wallet - deduct from available
            const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(courierId);
            batch.update(walletRef, {
                availableBalance: FieldValue.increment(-request.amount),
                updatedAt: new Date(),
            });

            // Update earnings status to processing
            for (const earningId of earningIds) {
                const earningRef = this.firestore.collection(this.EARNINGS_COLLECTION).doc(earningId);
                batch.update(earningRef, {
                    status: 'processing',
                    payoutId: payoutRef.id,
                    updatedAt: new Date(),
                });
            }

            await batch.commit();

            console.log('Created payout request:', payoutRef.id);
            return payoutRef.id;
        } catch (error) {
            console.error('Error requesting payout:', error);
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
     */
    async completePayout(
        payoutId: string,
        transactionId: string,
        adminId: string
    ): Promise<void> {
        try {
            const payoutRef = this.firestore.collection(this.PAYOUTS_COLLECTION).doc(payoutId);
            const payoutDoc = await payoutRef.get();

            if (!payoutDoc.exists) {
                throw new Error('Payout not found');
            }

            const payout = payoutDoc.data();
            if (payout.status !== 'pending' && payout.status !== 'processing') {
                throw new Error('Payout is not in a valid state for completion');
            }

            const batch = this.firestore.batch();

            // Update payout status
            batch.update(payoutRef, {
                status: 'completed',
                transactionId,
                processedBy: adminId,
                processedAt: new Date(),
                completedAt: new Date(),
                statusHistory: FieldValue.arrayUnion([{
                    status: 'completed',
                    timestamp: new Date(),
                    note: `Completed by admin. Transaction: ${transactionId}`,
                    updatedBy: adminId,
                }]),
            });

            // Update wallet
            const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(payout.courierId);
            batch.update(walletRef, {
                totalWithdrawn: FieldValue.increment(payout.amount),
                updatedAt: new Date(),
            });

            // Update earnings status to paid
            for (const earningId of payout.earningIds) {
                const earningRef = this.firestore.collection(this.EARNINGS_COLLECTION).doc(earningId);
                batch.update(earningRef, {
                    status: 'paid',
                    paidAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            await batch.commit();

            console.log('Completed payout:', payoutId);
        } catch (error) {
            console.error('Error completing payout:', error);
            throw error;
        }
    }

    /**
     * Fail a payout (admin operation)
     */
    async failPayout(
        payoutId: string,
        reason: string,
        adminId: string
    ): Promise<void> {
        try {
            const payoutRef = this.firestore.collection(this.PAYOUTS_COLLECTION).doc(payoutId);
            const payoutDoc = await payoutRef.get();

            if (!payoutDoc.exists) {
                throw new Error('Payout not found');
            }

            const payout = payoutDoc.data();

            const batch = this.firestore.batch();

            // Update payout status
            batch.update(payoutRef, {
                status: 'failed',
                failureReason: reason,
                processedBy: adminId,
                processedAt: new Date(),
                statusHistory: FieldValue.arrayUnion([{
                    status: 'failed',
                    timestamp: new Date(),
                    note: reason,
                    updatedBy: adminId,
                }]),
            });

            // Return funds to wallet
            const walletRef = this.firestore.collection(this.WALLETS_COLLECTION).doc(payout.courierId);
            batch.update(walletRef, {
                availableBalance: FieldValue.increment(payout.amount),
                updatedAt: new Date(),
            });

            // Revert earnings status to available
            for (const earningId of payout.earningIds) {
                const earningRef = this.firestore.collection(this.EARNINGS_COLLECTION).doc(earningId);
                batch.update(earningRef, {
                    status: 'available',
                    payoutId: null,
                    updatedAt: new Date(),
                });
            }

            await batch.commit();

            console.log('Failed payout:', payoutId, reason);
        } catch (error) {
            console.error('Error failing payout:', error);
            throw error;
        }
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
