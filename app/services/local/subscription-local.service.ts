/**
 * Local Subscription Service
 *
 * Read-only subscription service for offline/demo mode.
 * NO Firebase imports or calls - uses profile fields and DEFAULT_PLANS only.
 *
 * Implements ISubscriptionService interface.
 */

import { getAuthSessionService } from '../auth-session.service';
import {
    SubscriptionPlan,
    DEFAULT_PLANS,
    getPlansForLocation,
    getFreePlan,
    PlanType,
} from '../../models/subscription.model';
import {
    ISubscriptionService,
    SubscriptionSnapshot,
} from '../subscription-factory.service';

export class SubscriptionLocalService implements ISubscriptionService {
    private static instance: SubscriptionLocalService;

    private constructor() {
        // No Firebase initialization
    }

    static getInstance(): SubscriptionLocalService {
        if (!SubscriptionLocalService.instance) {
            SubscriptionLocalService.instance = new SubscriptionLocalService();
        }
        return SubscriptionLocalService.instance;
    }

    /**
     * Get subscription snapshot from user profile fields
     * Falls back to free plan if no subscription data
     */
    async getSubscriptionSnapshot(userId: string): Promise<SubscriptionSnapshot> {
        const authSession = getAuthSessionService();
        const user = authSession.currentUser;

        // No user or user ID mismatch - return empty snapshot
        if (!user || user.id !== userId) {
            return this.getEmptySnapshot();
        }

        // Check profile subscription fields
        const hasSubscription = user.hasActiveSubscription === true;
        const status = user.subscriptionStatus || 'none';
        const planId = user.subscriptionPlanId || 'plan_free';

        // Find plan from defaults
        const plan = this.findPlanById(planId) || getFreePlan();

        // Calculate days remaining
        let daysRemaining = 0;
        let endDate: Date | null = null;
        let startDate: Date | null = null;

        if (user.subscriptionEndDate) {
            endDate = user.subscriptionEndDate instanceof Date
                ? user.subscriptionEndDate
                : new Date(user.subscriptionEndDate);
            const now = new Date();
            daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }

        if (user.subscriptionStartDate) {
            startDate = user.subscriptionStartDate instanceof Date
                ? user.subscriptionStartDate
                : new Date(user.subscriptionStartDate);
        }

        return {
            hasSubscription,
            subscriptionId: null, // No Firestore record in local mode
            planId: plan.id,
            planName: plan.name,
            planType: plan.type,
            status: status as any,
            daysRemaining,
            startDate,
            endDate,
            autoRenew: false, // Default for local mode
            usageStats: {
                exchangesThisMonth: 0,
                medicinesInInventory: 0,
                activeExchanges: 0,
            },
        };
    }

    /**
     * Get available plans from DEFAULT_PLANS
     * Optionally filtered by location
     */
    async getPlans(countryCode?: string, cityId?: string): Promise<SubscriptionPlan[]> {
        // Convert DEFAULT_PLANS to full SubscriptionPlan format
        const allPlans: SubscriptionPlan[] = DEFAULT_PLANS.map((plan, index) => ({
            id: `plan_${plan.type}`,
            ...plan,
            createdAt: new Date(),
        }));

        // Filter by location if provided
        if (countryCode) {
            return getPlansForLocation(allPlans, countryCode, cityId);
        }

        // Return all active plans
        return allPlans.filter(p => p.isActive);
    }

    /**
     * Check if user has an active subscription
     */
    async hasActiveSubscription(userId: string): Promise<boolean> {
        const snapshot = await this.getSubscriptionSnapshot(userId);
        return snapshot.hasSubscription && snapshot.status === 'active' && snapshot.daysRemaining > 0;
    }

    /**
     * Find plan by ID from DEFAULT_PLANS
     */
    private findPlanById(planId: string): SubscriptionPlan | null {
        // Extract type from plan ID (e.g., 'plan_free' -> 'free')
        const planType = planId.replace('plan_', '');
        const defaultPlan = DEFAULT_PLANS.find(p => p.type === planType);

        if (defaultPlan) {
            return {
                id: planId,
                ...defaultPlan,
                createdAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Return empty subscription snapshot (no subscription)
     */
    private getEmptySnapshot(): SubscriptionSnapshot {
        const freePlan = getFreePlan();
        return {
            hasSubscription: false,
            subscriptionId: null,
            planId: freePlan.id,
            planName: freePlan.name,
            planType: freePlan.type,
            status: 'inactive',
            daysRemaining: 0,
            startDate: null,
            endDate: null,
            autoRenew: false,
            usageStats: {
                exchangesThisMonth: 0,
                medicinesInInventory: 0,
                activeExchanges: 0,
            },
        };
    }

    // =========================================================================
    // Write methods (no-op in local/demo mode)
    // These exist to satisfy ISubscriptionService interface.
    // In local mode, profile updates are handled by AuthSessionService directly.
    // =========================================================================

    /**
     * Request subscription - no-op in local mode
     * Profile update is handled by ViewModel via authSession.updateUserProfile()
     */
    async requestSubscription(userId: string, planId: string, paymentMethod: string): Promise<void> {
        console.warn('[SubscriptionLocalService] requestSubscription called in demo mode - no-op (profile update handled by ViewModel)');
    }

    /**
     * Activate subscription - no-op in local mode
     * Profile update is handled by ViewModel via authSession.updateUserProfile()
     */
    async activateSubscription(userId: string, planId: string, planType: PlanType, paymentMethod: string): Promise<void> {
        console.warn('[SubscriptionLocalService] activateSubscription called in demo mode - no-op (profile update handled by ViewModel)');
    }

    /**
     * Request cancellation - no-op in local mode
     * In demo mode, cancellation is not supported (no Firestore record to cancel)
     */
    async requestCancellation(userId: string, subscriptionId: string, reason?: string): Promise<void> {
        console.warn('[SubscriptionLocalService] requestCancellation called in demo mode - no-op (no subscription record exists)');
    }
}
