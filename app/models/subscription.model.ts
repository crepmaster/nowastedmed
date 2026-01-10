/**
 * Subscription Models
 *
 * Models for subscription and plan management
 */

export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';
export type PlanType = 'free' | 'basic' | 'premium' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

/**
 * Subscription Plan Definition
 *
 * Plans can be:
 * - Global: No countryCode/cityId set (applies everywhere)
 * - Country-specific: countryCode set (applies to all cities in that country)
 * - City-specific: countryCode + cityId set (applies only to that city)
 *
 * Plans are admin-managed via Firestore collection 'subscription_plans'
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    type: PlanType;
    description: string;
    price: number;
    currency: string;
    billingCycle: BillingCycle;
    features: PlanFeature[];
    limits: PlanLimits;
    isActive: boolean;
    // Location-specific fields (admin-managed)
    countryCode?: string;       // If set, plan is country-specific
    countryName?: string;       // Country name for display
    cityId?: string;            // If set with countryCode, plan is city-specific
    cityName?: string;          // City name for display
    region?: string;            // Region for grouping (e.g., 'west_africa')
    // Metadata
    createdAt: Date | any;
    updatedAt?: Date | any;
    createdBy?: string;         // Admin who created the plan
}

/**
 * Plan Features
 */
export interface PlanFeature {
    name: string;
    description: string;
    included: boolean;
}

/**
 * Plan Limits
 */
export interface PlanLimits {
    maxExchangesPerMonth: number;
    maxMedicinesInInventory: number;
    maxActiveExchanges: number;
    prioritySupport: boolean;
    analyticsAccess: boolean;
    apiAccess: boolean;
}

/**
 * User Subscription
 */
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    planType: PlanType;
    status: SubscriptionStatus;
    startDate: Date | any;
    endDate: Date | any;
    autoRenew: boolean;
    lastPaymentDate?: Date | any;
    nextPaymentDate?: Date | any;
    paymentMethod?: string;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Subscription with Plan Details (for display)
 */
export interface SubscriptionWithPlan extends Subscription {
    plan: SubscriptionPlan;
    daysRemaining: number;
    usageStats: SubscriptionUsage;
}

/**
 * Subscription Usage Statistics
 */
export interface SubscriptionUsage {
    exchangesThisMonth: number;
    medicinesInInventory: number;
    activeExchanges: number;
}

/**
 * Get applicable plans for a user's location
 * Priority: city-specific > country-specific > global
 *
 * @param plans - All available plans
 * @param countryCode - User's country code
 * @param cityId - User's city ID (optional)
 * @returns Filtered and sorted plans for the user's location
 */
export function getPlansForLocation(
    plans: SubscriptionPlan[],
    countryCode: string,
    cityId?: string
): SubscriptionPlan[] {
    // Filter active plans only
    const activePlans = plans.filter(p => p.isActive);

    // Get plans applicable to this location
    const applicablePlans = activePlans.filter(plan => {
        // City-specific plan
        if (plan.cityId && plan.countryCode) {
            return plan.countryCode === countryCode && plan.cityId === cityId;
        }
        // Country-specific plan
        if (plan.countryCode && !plan.cityId) {
            return plan.countryCode === countryCode;
        }
        // Global plan (no location restriction)
        return !plan.countryCode && !plan.cityId;
    });

    // Sort by price (free first, then ascending)
    return applicablePlans.sort((a, b) => a.price - b.price);
}

/**
 * Get the Free plan (always available as fallback)
 */
export function getFreePlan(): SubscriptionPlan {
    return {
        id: 'plan_free',
        name: 'Free',
        type: 'free',
        description: 'Basic access to the platform',
        price: 0,
        currency: 'XOF',
        billingCycle: 'monthly',
        features: [
            { name: 'Medicine Exchange', description: 'Exchange medicines with other pharmacies', included: true },
            { name: 'Basic Inventory', description: 'Manage up to 50 medicines', included: true },
            { name: 'QR Verification', description: 'Verify exchanges with QR codes', included: true },
            { name: 'Priority Support', description: '24/7 priority support', included: false },
            { name: 'Analytics', description: 'Advanced analytics dashboard', included: false },
        ],
        limits: {
            maxExchangesPerMonth: 5,
            maxMedicinesInInventory: 50,
            maxActiveExchanges: 2,
            prioritySupport: false,
            analyticsAccess: false,
            apiAccess: false,
        },
        isActive: true,
        createdAt: new Date(),
    };
}

/**
 * Default Plans Configuration (fallback if no admin-created plans)
 */
export const DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt'>[] = [
    {
        name: 'Free',
        type: 'free',
        description: 'Basic access to the platform',
        price: 0,
        currency: 'XOF',
        billingCycle: 'monthly',
        features: [
            { name: 'Medicine Exchange', description: 'Exchange medicines with other pharmacies', included: true },
            { name: 'Basic Inventory', description: 'Manage up to 50 medicines', included: true },
            { name: 'QR Verification', description: 'Verify exchanges with QR codes', included: true },
            { name: 'Priority Support', description: '24/7 priority support', included: false },
            { name: 'Analytics', description: 'Advanced analytics dashboard', included: false },
        ],
        limits: {
            maxExchangesPerMonth: 5,
            maxMedicinesInInventory: 50,
            maxActiveExchanges: 2,
            prioritySupport: false,
            analyticsAccess: false,
            apiAccess: false,
        },
        isActive: true,
    },
    {
        name: 'Basic',
        type: 'basic',
        description: 'For small pharmacies',
        price: 5000,
        currency: 'XOF',
        billingCycle: 'monthly',
        features: [
            { name: 'Medicine Exchange', description: 'Exchange medicines with other pharmacies', included: true },
            { name: 'Extended Inventory', description: 'Manage up to 200 medicines', included: true },
            { name: 'QR Verification', description: 'Verify exchanges with QR codes', included: true },
            { name: 'Email Support', description: 'Email support within 24 hours', included: true },
            { name: 'Analytics', description: 'Advanced analytics dashboard', included: false },
        ],
        limits: {
            maxExchangesPerMonth: 20,
            maxMedicinesInInventory: 200,
            maxActiveExchanges: 5,
            prioritySupport: false,
            analyticsAccess: false,
            apiAccess: false,
        },
        isActive: true,
    },
    {
        name: 'Premium',
        type: 'premium',
        description: 'For medium pharmacies',
        price: 15000,
        currency: 'XOF',
        billingCycle: 'monthly',
        features: [
            { name: 'Unlimited Exchanges', description: 'No limit on monthly exchanges', included: true },
            { name: 'Unlimited Inventory', description: 'No limit on medicines', included: true },
            { name: 'QR Verification', description: 'Verify exchanges with QR codes', included: true },
            { name: 'Priority Support', description: '24/7 priority support', included: true },
            { name: 'Analytics', description: 'Advanced analytics dashboard', included: true },
        ],
        limits: {
            maxExchangesPerMonth: -1, // Unlimited
            maxMedicinesInInventory: -1, // Unlimited
            maxActiveExchanges: -1, // Unlimited
            prioritySupport: true,
            analyticsAccess: true,
            apiAccess: false,
        },
        isActive: true,
    },
    {
        name: 'Enterprise',
        type: 'enterprise',
        description: 'For pharmacy chains',
        price: 50000,
        currency: 'XOF',
        billingCycle: 'monthly',
        features: [
            { name: 'Unlimited Everything', description: 'No limits on any feature', included: true },
            { name: 'Priority Support', description: '24/7 priority support with dedicated agent', included: true },
            { name: 'Advanced Analytics', description: 'Custom reports and insights', included: true },
            { name: 'API Access', description: 'Integrate with your systems', included: true },
            { name: 'Multi-Location', description: 'Manage multiple pharmacy locations', included: true },
        ],
        limits: {
            maxExchangesPerMonth: -1,
            maxMedicinesInInventory: -1,
            maxActiveExchanges: -1,
            prioritySupport: true,
            analyticsAccess: true,
            apiAccess: true,
        },
        isActive: true,
    },
];
