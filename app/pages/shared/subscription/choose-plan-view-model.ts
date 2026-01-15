import { Observable, Dialogs } from '@nativescript/core';
import { getSubscriptionService, ISubscriptionService } from '../../../services/subscription-factory.service';
import { SubscriptionPlan, PlanLimits, PlanType } from '../../../models/subscription.model';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { NavigationService } from '../../../services/navigation.service';

interface PlanDisplay extends SubscriptionPlan {
    isRecommended: boolean;
    buttonText: string;
    limitsText: string;
}

export class ChoosePlanViewModel extends Observable {
    private subscriptionService: ISubscriptionService;
    private authSession: AuthSessionService;
    private navigationService: NavigationService;

    // R6: Idempotence guard - prevents double-tap on subscription buttons
    private _isProcessingSubscription: boolean = false;

    private _plans: PlanDisplay[] = [];
    private _isLoading: boolean = true;
    private _showFreePlanHighlight: boolean = true;
    private _hasFreePlan: boolean = false;

    constructor() {
        super();
        this.subscriptionService = getSubscriptionService();
        this.authSession = getAuthSessionService();
        this.navigationService = NavigationService.getInstance();
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

    // R6: Expose processing state to disable buttons during subscription operations
    get isProcessingSubscription(): boolean { return this._isProcessingSubscription; }
    set isProcessingSubscription(value: boolean) {
        if (this._isProcessingSubscription !== value) {
            this._isProcessingSubscription = value;
            this.notifyPropertyChange('isProcessingSubscription', value);
        }
    }

    /**
     * Load available plans based on user's location
     */
    private async loadPlans(): Promise<void> {
        try {
            this.isLoading = true;
            const currentUser = this.authSession.currentUser;

            // Get plans filtered by user's location (service handles filtering)
            const location = currentUser ? (currentUser as any).location : null;
            let applicablePlans = await this.subscriptionService.getPlans(
                location?.countryCode,
                location?.cityId
            );

            // If no plans found for location, get all plans
            if (applicablePlans.length === 0) {
                applicablePlans = await this.subscriptionService.getPlans();
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
     * R6: Idempotence guard prevents double-tap
     */
    async onSelectPlan(args: any): Promise<void> {
        // R6: Prevent double-tap during processing
        if (this._isProcessingSubscription) return;

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
     * R6/R8: Free plan activation is profile-only (no subscription record needed)
     */
    private async activateFreePlan(planId: string, planType: string): Promise<void> {
        // R6: Set processing flag
        this.isProcessingSubscription = true;

        try {
            const currentUser = this.authSession.currentUser;
            if (!currentUser) return;

            // R8: Free plan is profile-only - skip Firestore subscription record
            // Only update user profile fields (no requestSubscription or activateSubscription calls)
            await this.authSession.updateUserProfile({
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
        } finally {
            // R6: Always reset processing flag
            this.isProcessingSubscription = false;
        }
    }

    /**
     * Handle paid plan selection with payment options
     * R6: Uses idempotence guard to prevent duplicate requests
     */
    private async handlePaidPlanSelection(plan: PlanDisplay): Promise<void> {
        // R6: Set processing flag
        this.isProcessingSubscription = true;

        try {
            const currentUser = this.authSession.currentUser;
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

            // Create subscription request
            await this.subscriptionService.requestSubscription(currentUser.id, plan.id, paymentMethod);

            if (paymentMethod === 'invoice') {
                // For invoice, update status to pending and proceed
                // NOTE: Type mismatch - 'pending' is not in User.SubscriptionStatus but was original code
                await this.authSession.updateUserProfile({
                    subscriptionPlanId: plan.id,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'pending' as any, // Pre-existing type mismatch, not fixing in this refactor
                    hasActiveSubscription: false,
                });

                await Dialogs.alert({
                    title: 'Invoice Requested',
                    message: 'Your subscription request has been submitted. You will receive an invoice via email. Your subscription will be activated once payment is confirmed.',
                    okButtonText: 'Continue',
                });
            } else {
                // For mobile money or wallet - auto-approve for demo
                // Create subscription document
                await this.subscriptionService.activateSubscription(
                    currentUser.id,
                    plan.id,
                    plan.type,
                    paymentMethod
                );

                // Also update user profile
                await this.authSession.updateUserProfile({
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
        } finally {
            // R6: Always reset processing flag
            this.isProcessingSubscription = false;
        }
    }

    /**
     * Continue with free plan (skip button)
     * R6: Idempotence guard prevents double-tap
     */
    async onContinueWithFree(): Promise<void> {
        // R6: Prevent double-tap during processing
        if (this._isProcessingSubscription) return;

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
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
            clearHistory: true,
            transition: {
                name: 'fade',
                duration: 200,
            },
        });
    }
}
