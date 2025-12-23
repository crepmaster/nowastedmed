/**
 * Subscription Firebase Service
 *
 * Handles subscription and plan operations with Firebase
 * Note: Subscription modifications should be done via Cloud Functions
 * for security. This service provides read access and initiates requests.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import {
    Subscription,
    SubscriptionPlan,
    SubscriptionWithPlan,
    SubscriptionUsage,
    DEFAULT_PLANS,
    PlanType,
} from '../../models/subscription.model';

export class SubscriptionFirebaseService {
    private static instance: SubscriptionFirebaseService;
    private firestore: any;
    private readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';
    private readonly PLANS_COLLECTION = 'subscription_plans';
    private readonly SUBSCRIPTION_REQUESTS_COLLECTION = 'subscription_requests';

    private constructor() {
        this.firestore = firebase().firestore();
    }

    static getInstance(): SubscriptionFirebaseService {
        if (!SubscriptionFirebaseService.instance) {
            SubscriptionFirebaseService.instance = new SubscriptionFirebaseService();
        }
        return SubscriptionFirebaseService.instance;
    }

    /**
     * Get user's current subscription
     */
    async getSubscription(userId: string): Promise<Subscription | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.SUBSCRIPTIONS_COLLECTION)
                .where('userId', '==', userId)
                .where('status', 'in', ['active', 'pending'])
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return this.transformSubscription(snapshot.docs[0]);
            }
            return null;
        } catch (error) {
            console.error('Error getting subscription:', error);
            throw error;
        }
    }

    /**
     * Subscribe to subscription updates (real-time)
     */
    subscribeToSubscription(userId: string, callback: (subscription: Subscription | null) => void): () => void {
        return this.firestore
            .collection(this.SUBSCRIPTIONS_COLLECTION)
            .where('userId', '==', userId)
            .where('status', 'in', ['active', 'pending'])
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot((snapshot: any) => {
                if (!snapshot.empty) {
                    callback(this.transformSubscription(snapshot.docs[0]));
                } else {
                    callback(null);
                }
            }, (error: any) => {
                console.error('Subscription subscription error:', error);
                callback(null);
            });
    }

    /**
     * Get all available plans
     */
    async getPlans(): Promise<SubscriptionPlan[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .where('isActive', '==', true)
                .orderBy('price', 'asc')
                .get();

            if (snapshot.empty) {
                // Return default plans if none exist in Firestore
                return this.getDefaultPlans();
            }

            return snapshot.docs.map((doc: any) => this.transformPlan(doc));
        } catch (error) {
            console.error('Error getting plans:', error);
            // Return default plans on error
            return this.getDefaultPlans();
        }
    }

    /**
     * Get a specific plan by ID
     */
    async getPlan(planId: string): Promise<SubscriptionPlan | null> {
        try {
            const doc = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .doc(planId)
                .get();

            if (doc.exists) {
                return this.transformPlan(doc);
            }
            return null;
        } catch (error) {
            console.error('Error getting plan:', error);
            throw error;
        }
    }

    /**
     * Get plan by type
     */
    async getPlanByType(type: PlanType): Promise<SubscriptionPlan | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .where('type', '==', type)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return this.transformPlan(snapshot.docs[0]);
            }

            // Return from defaults
            const defaultPlan = DEFAULT_PLANS.find(p => p.type === type);
            if (defaultPlan) {
                return { id: type, ...defaultPlan, createdAt: new Date() };
            }
            return null;
        } catch (error) {
            console.error('Error getting plan by type:', error);
            throw error;
        }
    }

    /**
     * Request subscription change (creates a pending request for backend to process)
     */
    async requestSubscription(userId: string, planId: string, paymentMethod?: string): Promise<string> {
        try {
            const docRef = await this.firestore
                .collection(this.SUBSCRIPTION_REQUESTS_COLLECTION)
                .add({
                    userId,
                    planId,
                    paymentMethod: paymentMethod || 'wallet',
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

            console.log('Subscription request created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating subscription request:', error);
            throw error;
        }
    }

    /**
     * Request subscription cancellation
     */
    async requestCancellation(userId: string, subscriptionId: string, reason?: string): Promise<string> {
        try {
            const docRef = await this.firestore
                .collection(this.SUBSCRIPTION_REQUESTS_COLLECTION)
                .add({
                    userId,
                    subscriptionId,
                    type: 'cancellation',
                    reason: reason || '',
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

            console.log('Cancellation request created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating cancellation request:', error);
            throw error;
        }
    }

    /**
     * Get subscription with plan details
     */
    async getSubscriptionWithPlan(userId: string): Promise<SubscriptionWithPlan | null> {
        try {
            const subscription = await this.getSubscription(userId);
            if (!subscription) {
                return null;
            }

            let plan: SubscriptionPlan | null = null;

            // Try to get plan from Firestore
            if (subscription.planId) {
                plan = await this.getPlan(subscription.planId);
            }

            // Fall back to plan by type
            if (!plan) {
                plan = await this.getPlanByType(subscription.planType);
            }

            if (!plan) {
                console.error('Could not find plan for subscription');
                return null;
            }

            // Calculate days remaining
            const endDate = subscription.endDate instanceof Date
                ? subscription.endDate
                : subscription.endDate?.toDate?.() || new Date(subscription.endDate);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            // Get usage stats (simplified - would need exchange/medicine counts)
            const usageStats: SubscriptionUsage = {
                exchangesThisMonth: 0,
                medicinesInInventory: 0,
                activeExchanges: 0,
            };

            return {
                ...subscription,
                plan,
                daysRemaining,
                usageStats,
            };
        } catch (error) {
            console.error('Error getting subscription with plan:', error);
            throw error;
        }
    }

    /**
     * Get subscription history
     */
    async getSubscriptionHistory(userId: string, limit: number = 10): Promise<Subscription[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.SUBSCRIPTIONS_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => this.transformSubscription(doc));
        } catch (error) {
            console.error('Error getting subscription history:', error);
            throw error;
        }
    }

    /**
     * Check if user has active subscription
     */
    async hasActiveSubscription(userId: string): Promise<boolean> {
        try {
            const subscription = await this.getSubscription(userId);
            if (!subscription) {
                return false;
            }

            const endDate = subscription.endDate instanceof Date
                ? subscription.endDate
                : subscription.endDate?.toDate?.() || new Date(subscription.endDate);

            return subscription.status === 'active' && endDate > new Date();
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    /**
     * Check if user can perform action based on subscription limits
     */
    async checkLimit(userId: string, limitType: keyof SubscriptionPlan['limits'], currentUsage: number): Promise<boolean> {
        try {
            const subWithPlan = await this.getSubscriptionWithPlan(userId);

            // Default to free plan limits if no subscription
            if (!subWithPlan) {
                const freePlan = DEFAULT_PLANS.find(p => p.type === 'free');
                if (freePlan) {
                    const limit = freePlan.limits[limitType];
                    if (typeof limit === 'number') {
                        return limit === -1 || currentUsage < limit;
                    }
                }
                return true;
            }

            const limit = subWithPlan.plan.limits[limitType];
            if (typeof limit === 'number') {
                return limit === -1 || currentUsage < limit;
            }
            return !!limit;
        } catch (error) {
            console.error('Error checking limit:', error);
            return true; // Allow on error
        }
    }

    /**
     * Get default plans (when Firestore doesn't have plans configured)
     */
    private getDefaultPlans(): SubscriptionPlan[] {
        return DEFAULT_PLANS.map((plan, index) => ({
            id: plan.type,
            ...plan,
            createdAt: new Date(),
        }));
    }

    /**
     * Transform Firestore document to Subscription
     */
    private transformSubscription(doc: any): Subscription {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            planId: data.planId,
            planType: data.planType || 'free',
            status: data.status,
            startDate: data.startDate?.toDate?.() || data.startDate,
            endDate: data.endDate?.toDate?.() || data.endDate,
            autoRenew: data.autoRenew !== false,
            lastPaymentDate: data.lastPaymentDate?.toDate?.() || data.lastPaymentDate,
            nextPaymentDate: data.nextPaymentDate?.toDate?.() || data.nextPaymentDate,
            paymentMethod: data.paymentMethod,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    }

    /**
     * Transform Firestore document to SubscriptionPlan
     */
    private transformPlan(doc: any): SubscriptionPlan {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            type: data.type,
            description: data.description,
            price: data.price,
            currency: data.currency || 'XOF',
            billingCycle: data.billingCycle || 'monthly',
            features: data.features || [],
            limits: data.limits || {},
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
        };
    }
}
