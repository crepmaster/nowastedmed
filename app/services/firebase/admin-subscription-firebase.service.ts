/**
 * Admin Subscription Plan Firebase Service
 *
 * Handles admin operations for managing subscription plans per country.
 * Only users with 'admin' role can use these methods.
 *
 * SECURITY: All write operations require admin role verification.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import { AuthFirebaseService } from './auth-firebase.service';
import {
    SubscriptionPlan,
    PlanType,
    BillingCycle,
    PlanFeature,
    PlanLimits,
    DEFAULT_PLANS,
} from '../../models/subscription.model';

/**
 * Create subscription plan request
 */
export interface CreatePlanRequest {
    name: string;
    type: PlanType;
    description: string;
    price: number;
    currency: string;
    billingCycle: BillingCycle;
    features: PlanFeature[];
    limits: PlanLimits;
    countryCode?: string;   // Optional: country-specific plan
    countryName?: string;
    region?: string;
}

/**
 * Plan statistics per country
 */
export interface PlanStatistics {
    countryCode: string;
    countryName: string;
    totalPlans: number;
    activePlans: number;
    plansByType: {
        free: number;
        basic: number;
        premium: number;
        enterprise: number;
    };
}

export class AdminSubscriptionFirebaseService {
    private static instance: AdminSubscriptionFirebaseService;
    private firestore: any;
    private authService: AuthFirebaseService;

    private readonly PLANS_COLLECTION = 'subscription_plans';

    private constructor() {
        this.firestore = firebase().firestore();
        this.authService = AuthFirebaseService.getInstance();
    }

    static getInstance(): AdminSubscriptionFirebaseService {
        if (!AdminSubscriptionFirebaseService.instance) {
            AdminSubscriptionFirebaseService.instance = new AdminSubscriptionFirebaseService();
        }
        return AdminSubscriptionFirebaseService.instance;
    }

    // ========================================
    // AUTHORIZATION HELPERS
    // ========================================

    /**
     * Verify current user is an admin
     * @throws Error if user is not authenticated or not an admin
     */
    private verifyAdminAccess(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Unauthorized: Authentication required');
        }
        if (currentUser.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
        }
    }

    /**
     * Get current admin user ID
     */
    private getAdminUserId(): string {
        this.verifyAdminAccess();
        return this.authService.getCurrentUser()!.id;
    }

    // ========================================
    // PLAN MANAGEMENT
    // ========================================

    /**
     * Create a new subscription plan
     * @throws Error if user is not an admin
     */
    async createPlan(request: CreatePlanRequest): Promise<string> {
        try {
            // SECURITY: Verify admin access
            const adminId = this.getAdminUserId();

            // Validate required fields
            if (!request.name || !request.type || !request.currency) {
                throw new Error('Missing required fields: name, type, currency');
            }

            // Check if similar plan already exists for this country
            const existingPlans = await this.getPlansByCountry(request.countryCode || 'global');
            const duplicate = existingPlans.find(
                p => p.type === request.type && p.billingCycle === request.billingCycle
            );
            if (duplicate) {
                throw new Error(
                    `A ${request.type} plan with ${request.billingCycle} billing already exists for this country`
                );
            }

            const planData: Omit<SubscriptionPlan, 'id'> = {
                name: request.name,
                type: request.type,
                description: request.description || '',
                price: request.price,
                currency: request.currency.toUpperCase(),
                billingCycle: request.billingCycle,
                features: request.features || [],
                limits: request.limits || this.getDefaultLimits(request.type),
                isActive: true,
                countryCode: request.countryCode?.toUpperCase() || undefined,
                countryName: request.countryName || undefined,
                region: request.region || undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: adminId,
            };

            const docRef = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .add(planData);

            console.log('Subscription plan created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating subscription plan:', error);
            throw error;
        }
    }

    /**
     * Update an existing subscription plan
     * @throws Error if user is not an admin
     */
    async updatePlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<void> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Prevent updating critical fields
            const safeUpdates = { ...updates };
            delete safeUpdates.id;
            delete safeUpdates.createdAt;
            delete safeUpdates.createdBy;

            await this.firestore
                .collection(this.PLANS_COLLECTION)
                .doc(planId)
                .update({
                    ...safeUpdates,
                    updatedAt: new Date(),
                });

            console.log('Subscription plan updated:', planId);
        } catch (error) {
            console.error('Error updating subscription plan:', error);
            throw error;
        }
    }

    /**
     * Delete a subscription plan
     * @throws Error if user is not an admin
     */
    async deletePlan(planId: string): Promise<void> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Check if any users are subscribed to this plan
            const subscriptions = await this.firestore
                .collection('subscriptions')
                .where('planId', '==', planId)
                .where('status', '==', 'active')
                .limit(1)
                .get();

            if (!subscriptions.empty) {
                throw new Error('Cannot delete plan with active subscriptions. Deactivate the plan instead.');
            }

            await this.firestore
                .collection(this.PLANS_COLLECTION)
                .doc(planId)
                .delete();

            console.log('Subscription plan deleted:', planId);
        } catch (error) {
            console.error('Error deleting subscription plan:', error);
            throw error;
        }
    }

    /**
     * Toggle plan active status
     * @throws Error if user is not an admin
     */
    async togglePlanStatus(planId: string, isActive: boolean): Promise<void> {
        await this.updatePlan(planId, { isActive });
    }

    // ========================================
    // PLAN QUERIES
    // ========================================

    /**
     * Get all subscription plans
     */
    async getAllPlans(activeOnly: boolean = false): Promise<SubscriptionPlan[]> {
        try {
            let query = this.firestore.collection(this.PLANS_COLLECTION);

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('price', 'asc').get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting all plans:', error);
            throw error;
        }
    }

    /**
     * Get plans by country code
     * Returns country-specific plans plus global plans
     */
    async getPlansByCountry(countryCode: string): Promise<SubscriptionPlan[]> {
        try {
            // Get country-specific plans
            const countrySnapshot = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .where('countryCode', '==', countryCode.toUpperCase())
                .where('isActive', '==', true)
                .get();

            const countryPlans = countrySnapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));

            // If country code is 'global', just return the global plans
            if (countryCode.toLowerCase() === 'global') {
                const globalSnapshot = await this.firestore
                    .collection(this.PLANS_COLLECTION)
                    .where('countryCode', '==', null)
                    .where('isActive', '==', true)
                    .get();

                return globalSnapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                    updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
                }));
            }

            return countryPlans;
        } catch (error) {
            console.error('Error getting plans by country:', error);
            throw error;
        }
    }

    /**
     * Get plans available for a user based on their country
     * Returns country-specific plans if available, otherwise global plans
     */
    async getAvailablePlansForUser(countryCode?: string): Promise<SubscriptionPlan[]> {
        try {
            const allPlans = await this.getAllPlans(true);

            if (!countryCode) {
                // Return only global plans (no countryCode set)
                return allPlans.filter(p => !p.countryCode);
            }

            // Get country-specific plans
            const countryPlans = allPlans.filter(
                p => p.countryCode?.toUpperCase() === countryCode.toUpperCase()
            );

            // If country has specific plans, return those
            if (countryPlans.length > 0) {
                return countryPlans;
            }

            // Otherwise, return global plans
            return allPlans.filter(p => !p.countryCode);
        } catch (error) {
            console.error('Error getting available plans for user:', error);
            throw error;
        }
    }

    /**
     * Get a single plan by ID
     */
    async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
        try {
            const doc = await this.firestore
                .collection(this.PLANS_COLLECTION)
                .doc(planId)
                .get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            };
        } catch (error) {
            console.error('Error getting plan by ID:', error);
            throw error;
        }
    }

    // ========================================
    // INITIALIZATION & STATISTICS
    // ========================================

    /**
     * Initialize default plans for a country
     * @throws Error if user is not an admin
     */
    async initializeDefaultPlansForCountry(
        countryCode: string,
        countryName: string,
        currency: string,
        region?: string
    ): Promise<string[]> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Check if plans already exist for this country
            const existingPlans = await this.getPlansByCountry(countryCode);
            if (existingPlans.length > 0) {
                throw new Error(`Plans already exist for ${countryName}`);
            }

            const planIds: string[] = [];

            for (const defaultPlan of DEFAULT_PLANS) {
                const planId = await this.createPlan({
                    ...defaultPlan,
                    currency: currency.toUpperCase(),
                    countryCode: countryCode.toUpperCase(),
                    countryName,
                    region,
                });
                planIds.push(planId);
            }

            console.log(`Initialized ${planIds.length} default plans for ${countryName}`);
            return planIds;
        } catch (error) {
            console.error('Error initializing default plans:', error);
            throw error;
        }
    }

    /**
     * Get plan statistics by country
     */
    async getPlanStatistics(): Promise<{
        totalPlans: number;
        activePlans: number;
        byCountry: PlanStatistics[];
    }> {
        try {
            const allPlans = await this.getAllPlans(false);

            // Group by country
            const countryMap = new Map<string, SubscriptionPlan[]>();

            for (const plan of allPlans) {
                const key = plan.countryCode || 'GLOBAL';
                if (!countryMap.has(key)) {
                    countryMap.set(key, []);
                }
                countryMap.get(key)!.push(plan);
            }

            const byCountry: PlanStatistics[] = [];

            for (const [countryCode, plans] of countryMap) {
                byCountry.push({
                    countryCode,
                    countryName: plans[0]?.countryName || 'Global',
                    totalPlans: plans.length,
                    activePlans: plans.filter(p => p.isActive).length,
                    plansByType: {
                        free: plans.filter(p => p.type === 'free').length,
                        basic: plans.filter(p => p.type === 'basic').length,
                        premium: plans.filter(p => p.type === 'premium').length,
                        enterprise: plans.filter(p => p.type === 'enterprise').length,
                    },
                });
            }

            return {
                totalPlans: allPlans.length,
                activePlans: allPlans.filter(p => p.isActive).length,
                byCountry: byCountry.sort((a, b) => a.countryName.localeCompare(b.countryName)),
            };
        } catch (error) {
            console.error('Error getting plan statistics:', error);
            throw error;
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Get default limits for a plan type
     */
    private getDefaultLimits(type: PlanType): PlanLimits {
        switch (type) {
            case 'free':
                return {
                    maxExchangesPerMonth: 5,
                    maxMedicinesInInventory: 50,
                    maxActiveExchanges: 2,
                    prioritySupport: false,
                    analyticsAccess: false,
                    apiAccess: false,
                };
            case 'basic':
                return {
                    maxExchangesPerMonth: 20,
                    maxMedicinesInInventory: 200,
                    maxActiveExchanges: 5,
                    prioritySupport: false,
                    analyticsAccess: false,
                    apiAccess: false,
                };
            case 'premium':
                return {
                    maxExchangesPerMonth: -1, // Unlimited
                    maxMedicinesInInventory: -1,
                    maxActiveExchanges: -1,
                    prioritySupport: true,
                    analyticsAccess: true,
                    apiAccess: false,
                };
            case 'enterprise':
                return {
                    maxExchangesPerMonth: -1,
                    maxMedicinesInInventory: -1,
                    maxActiveExchanges: -1,
                    prioritySupport: true,
                    analyticsAccess: true,
                    apiAccess: true,
                };
            default:
                return {
                    maxExchangesPerMonth: 5,
                    maxMedicinesInInventory: 50,
                    maxActiveExchanges: 2,
                    prioritySupport: false,
                    analyticsAccess: false,
                    apiAccess: false,
                };
        }
    }

    /**
     * Validate plan features structure
     */
    validateFeatures(features: PlanFeature[]): boolean {
        if (!Array.isArray(features)) return false;

        return features.every(
            f => typeof f.name === 'string' &&
                 typeof f.description === 'string' &&
                 typeof f.included === 'boolean'
        );
    }

    /**
     * Validate plan limits structure
     */
    validateLimits(limits: PlanLimits): boolean {
        return (
            typeof limits.maxExchangesPerMonth === 'number' &&
            typeof limits.maxMedicinesInInventory === 'number' &&
            typeof limits.maxActiveExchanges === 'number' &&
            typeof limits.prioritySupport === 'boolean' &&
            typeof limits.analyticsAccess === 'boolean' &&
            typeof limits.apiAccess === 'boolean'
        );
    }
}
