/**
 * Subscription Factory Service
 *
 * Returns the appropriate subscription service based on environment configuration.
 * - Firebase: For production (reads from Firestore subscription collection)
 * - Local: For offline demo mode (reads from profile fields / defaults)
 *
 * Uses the same pattern as auth-factory.service.ts with conditional require().
 */

import { getEnvironmentService } from '../config/environment.config';
import {
    SubscriptionPlan,
    SubscriptionStatus,
    PlanType,
} from '../models/subscription.model';

/**
 * Normalized subscription snapshot for UI display
 * This is the single source of truth for subscription state in ViewModels
 */
export interface SubscriptionSnapshot {
    hasSubscription: boolean;
    /** Firestore subscription document ID (null if no record exists) */
    subscriptionId: string | null;
    planId: string;
    planName: string;
    planType: PlanType;
    status: SubscriptionStatus;
    daysRemaining: number;
    startDate: Date | null;
    endDate: Date | null;
    autoRenew: boolean;
    // Usage stats (simplified for demo)
    usageStats: {
        exchangesThisMonth: number;
        medicinesInInventory: number;
        activeExchanges: number;
    };
}

/**
 * Common interface for subscription services (Firebase and Local)
 */
export interface ISubscriptionService {
    /**
     * Get normalized subscription snapshot for display
     * Returns a consistent structure regardless of backend
     */
    getSubscriptionSnapshot(userId: string): Promise<SubscriptionSnapshot>;

    /**
     * Get available plans (optionally filtered by location)
     */
    getPlans(countryCode?: string, cityId?: string): Promise<SubscriptionPlan[]>;

    /**
     * Check if user has an active subscription
     */
    hasActiveSubscription(userId: string): Promise<boolean>;

    /**
     * Request a subscription (creates pending request)
     * Firebase: Creates request document for backend processing
     * Local: No-op with warning (demo mode)
     */
    requestSubscription(userId: string, planId: string, paymentMethod: string): Promise<void>;

    /**
     * Activate a subscription immediately (for demo/free plans)
     * Firebase: Creates subscription document
     * Local: No-op with warning (demo mode)
     */
    activateSubscription(userId: string, planId: string, planType: PlanType, paymentMethod: string): Promise<void>;

    /**
     * Request subscription cancellation
     * Firebase: Creates cancellation request
     * Local: No-op with warning (demo mode)
     * @param subscriptionId - The Firestore subscription document ID (required for Firebase)
     */
    requestCancellation(userId: string, subscriptionId: string, reason?: string): Promise<void>;
}

let subscriptionServiceInstance: ISubscriptionService | null = null;

/**
 * Get the appropriate subscription service based on environment configuration
 */
export function getSubscriptionService(): ISubscriptionService {
    if (subscriptionServiceInstance) {
        return subscriptionServiceInstance;
    }

    const env = getEnvironmentService();
    const useFirebase = env.isFeatureEnabled('useFirebaseAuth');

    if (useFirebase) {
        console.log('📦 Using Firebase Subscription Service');
        const { SubscriptionFirebaseService } = require('./firebase/subscription-firebase.service');
        subscriptionServiceInstance = SubscriptionFirebaseService.getInstance();
    } else {
        console.log('📦 Using Local Subscription Service (Demo Mode)');
        const { SubscriptionLocalService } = require('./local/subscription-local.service');
        subscriptionServiceInstance = SubscriptionLocalService.getInstance();
    }

    return subscriptionServiceInstance!;
}

/**
 * Reset subscription service instance (for testing purposes)
 */
export function resetSubscriptionService(): void {
    subscriptionServiceInstance = null;
}
