import { Observable, Frame, Dialogs } from '@nativescript/core';
import { SubscriptionFirebaseService } from '../../../services/firebase/subscription-firebase.service';
import { SubscriptionPlan, SubscriptionWithPlan, PlanLimits } from '../../../models/subscription.model';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';

interface PlanDisplay extends SubscriptionPlan {
    isCurrentPlan: boolean;
    buttonText: string;
    limitsText: string;
}

export class SubscriptionViewModel extends Observable {
    private subscriptionService: SubscriptionFirebaseService;
    private authService: AuthFirebaseService;
    private unsubscribe: (() => void) | null = null;
    private currentSubscription: SubscriptionWithPlan | null = null;

    // Subscription data
    private _hasSubscription: boolean = false;
    private _currentPlanName: string = '';
    private _subscriptionStatus: string = '';
    private _daysRemaining: number = 0;
    private _usageExchanges: number = 0;
    private _usageMedicines: number = 0;
    private _usageActive: number = 0;
    private _plans: PlanDisplay[] = [];
    private _isLoading: boolean = true;

    constructor() {
        super();
        this.subscriptionService = SubscriptionFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();
        this.loadData();
    }

    // Getters and Setters
    get hasSubscription(): boolean { return this._hasSubscription; }
    set hasSubscription(value: boolean) {
        if (this._hasSubscription !== value) {
            this._hasSubscription = value;
            this.notifyPropertyChange('hasSubscription', value);
        }
    }

    get currentPlanName(): string { return this._currentPlanName; }
    set currentPlanName(value: string) {
        if (this._currentPlanName !== value) {
            this._currentPlanName = value;
            this.notifyPropertyChange('currentPlanName', value);
        }
    }

    get subscriptionStatus(): string { return this._subscriptionStatus; }
    set subscriptionStatus(value: string) {
        if (this._subscriptionStatus !== value) {
            this._subscriptionStatus = value;
            this.notifyPropertyChange('subscriptionStatus', value);
        }
    }

    get daysRemaining(): number { return this._daysRemaining; }
    set daysRemaining(value: number) {
        if (this._daysRemaining !== value) {
            this._daysRemaining = value;
            this.notifyPropertyChange('daysRemaining', value);
        }
    }

    get usageExchanges(): number { return this._usageExchanges; }
    set usageExchanges(value: number) {
        if (this._usageExchanges !== value) {
            this._usageExchanges = value;
            this.notifyPropertyChange('usageExchanges', value);
        }
    }

    get usageMedicines(): number { return this._usageMedicines; }
    set usageMedicines(value: number) {
        if (this._usageMedicines !== value) {
            this._usageMedicines = value;
            this.notifyPropertyChange('usageMedicines', value);
        }
    }

    get usageActive(): number { return this._usageActive; }
    set usageActive(value: number) {
        if (this._usageActive !== value) {
            this._usageActive = value;
            this.notifyPropertyChange('usageActive', value);
        }
    }

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

    /**
     * Load subscription and plans data
     */
    private async loadData(): Promise<void> {
        try {
            this.isLoading = true;
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                console.error('No user logged in');
                return;
            }

            // Load current subscription
            this.currentSubscription = await this.subscriptionService.getSubscriptionWithPlan(currentUser.id);

            if (this.currentSubscription) {
                this.hasSubscription = true;
                this.currentPlanName = this.currentSubscription.plan.name;
                this.subscriptionStatus = this.currentSubscription.status;
                this.daysRemaining = this.currentSubscription.daysRemaining;
                this.usageExchanges = this.currentSubscription.usageStats.exchangesThisMonth;
                this.usageMedicines = this.currentSubscription.usageStats.medicinesInInventory;
                this.usageActive = this.currentSubscription.usageStats.activeExchanges;
            } else {
                this.hasSubscription = false;
            }

            // Load available plans
            const allPlans = await this.subscriptionService.getPlans();
            this.plans = allPlans.map(plan => this.formatPlanForDisplay(plan));

        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Format plan for display
     */
    private formatPlanForDisplay(plan: SubscriptionPlan): PlanDisplay {
        const isCurrentPlan = this.currentSubscription?.planType === plan.type;

        return {
            ...plan,
            isCurrentPlan,
            buttonText: isCurrentPlan ? 'Current Plan' : (plan.price === 0 ? 'Select' : 'Subscribe'),
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
        const plan = this._plans.find(p => p.id === planId);

        if (!plan || plan.isCurrentPlan) return;

        const confirmMessage = plan.price === 0
            ? `Switch to the ${plan.name} plan?`
            : `Subscribe to ${plan.name} for ${plan.price} ${plan.currency}/${plan.billingCycle}?`;

        const confirmed = await Dialogs.confirm({
            title: 'Confirm Subscription',
            message: confirmMessage,
            okButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
        });

        if (confirmed) {
            await this.processSubscription(planId, plan);
        }
    }

    /**
     * Process subscription request
     */
    private async processSubscription(planId: string, plan: SubscriptionPlan): Promise<void> {
        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) return;

            // For paid plans, ask for payment method
            let paymentMethod = 'wallet';
            if (plan.price > 0) {
                const result = await Dialogs.action({
                    title: 'Payment Method',
                    message: `Total: ${plan.price} ${plan.currency}`,
                    cancelButtonText: 'Cancel',
                    actions: ['Wallet Balance', 'Mobile Money', 'Pay Later'],
                });

                if (!result || result === 'Cancel') return;

                if (result === 'Mobile Money') {
                    paymentMethod = 'mobile_money';
                } else if (result === 'Pay Later') {
                    paymentMethod = 'invoice';
                }
            }

            await this.subscriptionService.requestSubscription(currentUser.id, planId, paymentMethod);

            await Dialogs.alert({
                title: 'Request Submitted',
                message: plan.price === 0
                    ? 'Your plan has been updated.'
                    : 'Your subscription request has been submitted. You will be notified once processed.',
                okButtonText: 'OK',
            });

            // Reload data
            await this.loadData();

        } catch (error) {
            console.error('Error processing subscription:', error);
            await Dialogs.alert({
                title: 'Error',
                message: 'Failed to process subscription. Please try again.',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Manage current subscription
     */
    async onManageSubscription(): Promise<void> {
        const result = await Dialogs.action({
            title: 'Manage Subscription',
            message: `Current plan: ${this.currentPlanName}`,
            cancelButtonText: 'Close',
            actions: ['View History', 'Cancel Subscription'],
        });

        if (result === 'View History') {
            Frame.topmost().navigate({
                moduleName: 'pages/shared/subscription/subscription-history-page',
            });
        } else if (result === 'Cancel Subscription') {
            await this.cancelSubscription();
        }
    }

    /**
     * Cancel subscription
     */
    private async cancelSubscription(): Promise<void> {
        const confirmed = await Dialogs.confirm({
            title: 'Cancel Subscription',
            message: 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
            okButtonText: 'Yes, Cancel',
            cancelButtonText: 'Keep Subscription',
        });

        if (confirmed && this.currentSubscription) {
            try {
                const currentUser = this.authService.getCurrentUser();
                if (!currentUser) return;

                // Ask for reason
                const reasonResult = await Dialogs.prompt({
                    title: 'Feedback',
                    message: 'Please tell us why you\'re cancelling (optional):',
                    okButtonText: 'Submit',
                    cancelButtonText: 'Skip',
                });

                await this.subscriptionService.requestCancellation(
                    currentUser.id,
                    this.currentSubscription.id,
                    reasonResult.text || undefined
                );

                await Dialogs.alert({
                    title: 'Cancellation Requested',
                    message: 'Your cancellation request has been submitted. Your subscription will remain active until the end of the current billing period.',
                    okButtonText: 'OK',
                });

                await this.loadData();

            } catch (error) {
                console.error('Error cancelling subscription:', error);
                await Dialogs.alert({
                    title: 'Error',
                    message: 'Failed to cancel subscription. Please try again.',
                    okButtonText: 'OK',
                });
            }
        }
    }

    /**
     * Cleanup
     */
    onUnloaded(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
