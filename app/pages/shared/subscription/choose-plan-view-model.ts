import { Observable, Frame, Dialogs } from '@nativescript/core';
import { SubscriptionFirebaseService } from '../../../services/firebase/subscription-firebase.service';
import { SubscriptionPlan, PlanLimits, getPlansForLocation } from '../../../models/subscription.model';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';

interface PlanDisplay extends SubscriptionPlan {
    isRecommended: boolean;
    buttonText: string;
    limitsText: string;
}

export class ChoosePlanViewModel extends Observable {
    private subscriptionService: SubscriptionFirebaseService;
    private authService: AuthFirebaseService;

    private _plans: PlanDisplay[] = [];
    private _isLoading: boolean = true;
    private _showFreePlanHighlight: boolean = true;
    private _hasFreePlan: boolean = false;

    constructor() {
        super();
        this.subscriptionService = SubscriptionFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();
        this.loadPlans();
    }

    // Getters and Setters
    get plans(): PlanDisplay[] { return this._plans; }
    set plans(value: PlanDisplay[]) {
        if (this._plans !== value) {
            this._plans = value;
            this.notifyPropertyChange('plans', value);
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get showFreePlanHighlight(): boolean { return this._showFreePlanHighlight; }
    set showFreePlanHighlight(value: boolean) {
        if (this._showFreePlanHighlight !== value) {
            this._showFreePlanHighlight = value;
            this.notifyPropertyChange('showFreePlanHighlight', value);
        }
    }

    get hasFreePlan(): boolean { return this._hasFreePlan; }
    set hasFreePlan(value: boolean) {
        if (this._hasFreePlan !== value) {
            this._hasFreePlan = value;
            this.notifyPropertyChange('hasFreePlan', value);
        }
    }

    /**
     * Load available plans based on user's location
     */
    private async loadPlans(): Promise<void> {
        try {
            this.isLoading = true;
            const currentUser = this.authService.getCurrentUser();

            // Get all plans
            const allPlans = await this.subscriptionService.getPlans();

            // Filter by user's location if available
            let applicablePlans = allPlans;
            if (currentUser) {
                const location = (currentUser as any).location;
                if (location?.countryCode) {
                    applicablePlans = getPlansForLocation(
                        allPlans,
                        location.countryCode,
                        location.cityId
                    );
                }
            }

            // If no plans found for location, use all active plans
            if (applicablePlans.length === 0) {
                applicablePlans = allPlans.filter(p => p.isActive);
            }

            // Check if there's a free plan
            this.hasFreePlan = applicablePlans.some(p => p.price === 0);
            this.showFreePlanHighlight = this.hasFreePlan;

            // Format plans for display
            this.plans = applicablePlans.map(plan => this.formatPlanForDisplay(plan));

        } catch (error) {
            console.error('Error loading plans:', error);
            Dialogs.alert({
                title: 'Error',
                message: 'Failed to load subscription plans. Please try again.',
                okButtonText: 'OK',
            });
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Format plan for display
     */
    private formatPlanForDisplay(plan: SubscriptionPlan): PlanDisplay {
        // Recommend Basic plan for new users (good balance of features and price)
        const isRecommended = plan.type === 'basic';

        return {
            ...plan,
            isRecommended,
            buttonText: plan.price === 0 ? 'Start Free' : `Subscribe - ${plan.price} ${plan.currency}`,
            limitsText: this.formatLimits(plan.limits),
        };
    }

    /**
     * Format limits for display
     */
    private formatLimits(limits: PlanLimits): string {
        const parts: string[] = [];

        if (limits.maxExchangesPerMonth === -1) {
            parts.push('Unlimited exchanges');
        } else {
            parts.push(`${limits.maxExchangesPerMonth} exchanges/month`);
        }

        if (limits.maxMedicinesInInventory === -1) {
            parts.push('Unlimited inventory');
        } else {
            parts.push(`${limits.maxMedicinesInInventory} medicines max`);
        }

        return parts.join(' • ');
    }

    /**
     * Handle plan selection
     */
    async onSelectPlan(args: any): Promise<void> {
        const planId = args.object.planId;
        const planType = args.object.planType;
        const planPrice = parseFloat(args.object.planPrice) || 0;

        const plan = this._plans.find(p => p.id === planId);
        if (!plan) return;

        if (planPrice === 0) {
            // Free plan - just confirm and proceed
            await this.activateFreePlan(planId, planType);
        } else {
            // Paid plan - show payment options
            await this.handlePaidPlanSelection(plan);
        }
    }

    /**
     * Activate free plan and proceed to dashboard
     */
    private async activateFreePlan(planId: string, planType: string): Promise<void> {
        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) return;

            // Create subscription document in Firestore
            await this.subscriptionService.activateSubscription(
                currentUser.id,
                planId,
                planType as any,
                'free'
            );

            // Update user's subscription to free plan
            await this.authService.updateUserProfile({
                subscriptionPlanId: planId,
                subscriptionPlanType: planType,
                subscriptionStatus: 'active',
                hasActiveSubscription: true,
            });

            // Navigate to pharmacy dashboard
            this.navigateToDashboard();

        } catch (error) {
            console.error('Error activating free plan:', error);
            Dialogs.alert({
                title: 'Error',
                message: 'Failed to activate plan. Please try again.',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Handle paid plan selection with payment options
     */
    private async handlePaidPlanSelection(plan: PlanDisplay): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        const confirmMessage = `Subscribe to ${plan.name} for ${plan.price} ${plan.currency}/${plan.billingCycle}?`;

        const confirmed = await Dialogs.confirm({
            title: 'Confirm Subscription',
            message: confirmMessage,
            okButtonText: 'Proceed to Payment',
            cancelButtonText: 'Cancel',
        });

        if (!confirmed) return;

        // Show payment method selection
        const paymentResult = await Dialogs.action({
            title: 'Payment Method',
            message: `Total: ${plan.price} ${plan.currency}`,
            cancelButtonText: 'Cancel',
            actions: ['Mobile Money', 'Wallet Balance', 'Pay Later (Invoice)'],
        });

        if (!paymentResult || paymentResult === 'Cancel') return;

        let paymentMethod = 'wallet';
        if (paymentResult === 'Mobile Money') {
            paymentMethod = 'mobile_money';
        } else if (paymentResult === 'Pay Later (Invoice)') {
            paymentMethod = 'invoice';
        }

        try {
            // Create subscription request
            await this.subscriptionService.requestSubscription(currentUser.id, plan.id, paymentMethod);

            if (paymentMethod === 'invoice') {
                // For invoice, update status to pending and proceed
                await this.authService.updateUserProfile({
                    subscriptionPlanId: plan.id,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'pending',
                    hasActiveSubscription: false,
                });

                await Dialogs.alert({
                    title: 'Invoice Requested',
                    message: 'Your subscription request has been submitted. You will receive an invoice via email. Your subscription will be activated once payment is confirmed.',
                    okButtonText: 'Continue',
                });
            } else {
                // For mobile money or wallet - auto-approve for demo
                // Create subscription document in Firestore
                await this.subscriptionService.activateSubscription(
                    currentUser.id,
                    plan.id,
                    plan.type,
                    paymentMethod
                );

                // Also update user profile
                await this.authService.updateUserProfile({
                    subscriptionPlanId: plan.id,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'active',
                    hasActiveSubscription: true,
                });

                await Dialogs.alert({
                    title: 'Subscription Activated',
                    message: `Your ${plan.name} subscription is now active!`,
                    okButtonText: 'Continue',
                });
            }

            // Navigate to dashboard
            this.navigateToDashboard();

        } catch (error) {
            console.error('Error processing subscription:', error);
            Dialogs.alert({
                title: 'Error',
                message: 'Failed to process subscription. Please try again.',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Continue with free plan (skip button)
     */
    async onContinueWithFree(): Promise<void> {
        const freePlan = this._plans.find(p => p.price === 0);
        if (freePlan) {
            await this.activateFreePlan(freePlan.id, freePlan.type);
        } else {
            // Fallback if no free plan in list
            await this.activateFreePlan('plan_free', 'free');
        }
    }

    /**
     * Navigate to pharmacy dashboard
     */
    private navigateToDashboard(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
            clearHistory: true,
            transition: {
                name: 'fade',
                duration: 200,
            },
        });
    }
}
