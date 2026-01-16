import { Observable, Dialogs } from '@nativescript/core';
import { getSubscriptionService, ISubscriptionService, SubscriptionSnapshot } from '../../../services/subscription-factory.service';
import { SubscriptionPlan, PlanLimits, PlanType } from '../../../models/subscription.model';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { NavigationService } from '../../../services/navigation.service';

interface PlanDisplay extends SubscriptionPlan {
    isCurrentPlan: boolean;
    buttonText: string;
    limitsText: string;
}

export class SubscriptionViewModel extends Observable {
    private subscriptionService: ISubscriptionService;
    private authSession: AuthSessionService;
    private navigationService: NavigationService;
    private unsubscribe: (() => void) | null = null;
    private currentSnapshot: SubscriptionSnapshot | null = null;

    // R6: Idempotence guard - prevents double-tap on subscription buttons
    private _isProcessingSubscription: boolean = false;

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
        this.subscriptionService = getSubscriptionService();
        this.authSession = getAuthSessionService();
        this.navigationService = NavigationService.getInstance();
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

    // R6: Expose processing state to disable buttons during subscription operations
    get isProcessingSubscription(): boolean { return this._isProcessingSubscription; }
    set isProcessingSubscription(value: boolean) {
        if (this._isProcessingSubscription !== value) {
            this._isProcessingSubscription = value;
            this.notifyPropertyChange('isProcessingSubscription', value);
        }
    }

    /**
     * Load subscription and plans data via getSubscriptionSnapshot()
     * R5: Also sets up realtime listener for subscription updates
     */
    private async loadData(): Promise<void> {
        try {
            this.isLoading = true;
            const currentUser = this.authSession.currentUser;
            if (!currentUser) {
                console.error('No user logged in');
                return;
            }

            // Load current subscription snapshot (reconciled from record + profile)
            this.currentSnapshot = await this.subscriptionService.getSubscriptionSnapshot(currentUser.id);
            this.updateUIFromSnapshot(this.currentSnapshot);

            // Load available plans (filtered by user location if available)
            const location = (currentUser as any).location;
            const allPlans = await this.subscriptionService.getPlans(
                location?.countryCode,
                location?.cityId
            );
            this.plans = allPlans.map(plan => this.formatPlanForDisplay(plan));

            // R5: Set up realtime listener (if available)
            this.setupRealtimeListener(currentUser.id);

        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update UI properties from snapshot
     */
    private updateUIFromSnapshot(snapshot: SubscriptionSnapshot): void {
        this.hasSubscription = snapshot.hasSubscription;
        this.currentPlanName = snapshot.planName;
        this.subscriptionStatus = snapshot.status;
        this.daysRemaining = snapshot.daysRemaining;
        this.usageExchanges = snapshot.usageStats.exchangesThisMonth;
        this.usageMedicines = snapshot.usageStats.medicinesInInventory;
        this.usageActive = snapshot.usageStats.activeExchanges;
    }

    /**
     * R5: Set up realtime listener for subscription updates
     */
    private setupRealtimeListener(userId: string): void {
        // Clean up any existing listener
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // Check if service supports realtime updates
        if (this.subscriptionService.subscribeToSubscriptionUpdates) {
            this.unsubscribe = this.subscriptionService.subscribeToSubscriptionUpdates(
                userId,
                (snapshot: SubscriptionSnapshot) => {
                    this.currentSnapshot = snapshot;
                    this.updateUIFromSnapshot(snapshot);
                    // Re-format plans to update isCurrentPlan flags
                    this.plans = this._plans.map(plan => this.formatPlanForDisplay(plan));
                }
            );
        }
    }

    /**
     * Format plan for display
     * R7: Use planId for current plan detection (not planType)
     */
    private formatPlanForDisplay(plan: SubscriptionPlan): PlanDisplay {
        // R7: Match by planId first, fall back to planType for legacy data
        const isCurrentPlan = this.currentSnapshot?.planId === plan.id ||
            (this.currentSnapshot?.planId && this.currentSnapshot.planId === `plan_${plan.type}`);

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
     * R6: Idempotence guard prevents double-tap
     */
    async onSelectPlan(args: any): Promise<void> {
        // R6: Prevent double-tap during processing
        if (this._isProcessingSubscription) return;

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
     * For demo: Mobile Money and Wallet payments are auto-approved
     * R6: Uses idempotence guard to prevent duplicate requests
     * R8: Free plan is profile-only (no Firestore records)
     */
    private async processSubscription(planId: string, plan: SubscriptionPlan): Promise<void> {
        // R6: Set processing flag
        this.isProcessingSubscription = true;

        try {
            const currentUser = this.authSession.currentUser;
            if (!currentUser) return;

            // R8: Free plan is profile-only - skip Firestore writes
            if (plan.price === 0) {
                await this.authSession.updateUserProfile({
                    subscriptionPlanId: planId,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'active',
                    hasActiveSubscription: true,
                });

                await Dialogs.alert({
                    title: 'Plan Updated',
                    message: 'Your plan has been updated to the free tier.',
                    okButtonText: 'OK',
                });

                await this.loadData();
                return;
            }

            // For paid plans, ask for payment method
            let paymentMethod = 'wallet';
            const result = await Dialogs.action({
                title: 'Payment Method',
                message: `Total: ${plan.price} ${plan.currency}`,
                cancelButtonText: 'Cancel',
                actions: ['Mobile Money', 'Wallet Balance', 'Pay Later (Invoice)'],
            });

            if (!result || result === 'Cancel') return;

            if (result === 'Mobile Money') {
                paymentMethod = 'mobile_money';
            } else if (result === 'Pay Later (Invoice)') {
                paymentMethod = 'invoice';
            }

            // Create subscription request record (paid plans only)
            await this.subscriptionService.requestSubscription(currentUser.id, planId, paymentMethod);

            if (paymentMethod === 'invoice') {
                // For invoice, set status to pending - requires admin approval
                await this.authSession.updateUserProfile({
                    subscriptionPlanId: planId,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'pending',
                    hasActiveSubscription: false,
                });

                await Dialogs.alert({
                    title: 'Invoice Requested',
                    message: 'Your subscription request has been submitted. You will receive an invoice via email. Your subscription will be activated once payment is confirmed.',
                    okButtonText: 'OK',
                });
            } else {
                // For mobile money or wallet - auto-approve for demo
                // Create subscription document
                await this.subscriptionService.activateSubscription(
                    currentUser.id,
                    planId,
                    plan.type,
                    paymentMethod
                );

                // Also update user profile
                await this.authSession.updateUserProfile({
                    subscriptionPlanId: planId,
                    subscriptionPlanType: plan.type,
                    subscriptionStatus: 'active',
                    hasActiveSubscription: true,
                });

                await Dialogs.alert({
                    title: 'Subscription Activated',
                    message: plan.price === 0
                        ? 'Your plan has been updated.'
                        : `Your ${plan.name} subscription is now active!`,
                    okButtonText: 'OK',
                });
            }

            // Reload data
            await this.loadData();

        } catch (error) {
            console.error('Error processing subscription:', error);
            await Dialogs.alert({
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
            this.navigationService.navigate({
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
        // Check if we have a subscription record (required for cancellation)
        if (!this.currentSnapshot?.hasSubscription) {
            return;
        }

        // Check if subscriptionId exists (required for Firebase cancellation)
        if (!this.currentSnapshot.subscriptionId) {
            await Dialogs.alert({
                title: 'Cannot Cancel',
                message: 'Subscription cancellation is not available in demo mode.',
                okButtonText: 'OK',
            });
            return;
        }

        const confirmed = await Dialogs.confirm({
            title: 'Cancel Subscription',
            message: 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
            okButtonText: 'Yes, Cancel',
            cancelButtonText: 'Keep Subscription',
        });

        if (confirmed) {
            try {
                const currentUser = this.authSession.currentUser;
                if (!currentUser) return;

                // Ask for reason
                const reasonResult = await Dialogs.prompt({
                    title: 'Feedback',
                    message: 'Please tell us why you\'re cancelling (optional):',
                    okButtonText: 'Submit',
                    cancelButtonText: 'Skip',
                });

                // Request cancellation with correct subscriptionId
                await this.subscriptionService.requestCancellation(
                    currentUser.id,
                    this.currentSnapshot.subscriptionId,
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
