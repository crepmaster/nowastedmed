import { Observable, Dialogs } from '@nativescript/core';
import {
    AdminSubscriptionFirebaseService,
    PlanStatistics,
} from '../../../services/firebase/admin-subscription-firebase.service';
import { AdminLocationFirebaseService, CountryDocument } from '../../../services/firebase/admin-location-firebase.service';
import { SubscriptionPlan, PlanType, BillingCycle, DEFAULT_PLANS } from '../../../models/subscription.model';

interface Stats {
    totalPlans: number;
    activePlans: number;
    countriesWithPlans: number;
}

export class SubscriptionManagementViewModel extends Observable {
    private subscriptionService: AdminSubscriptionFirebaseService;
    private locationService: AdminLocationFirebaseService;

    private _selectedTabIndex: number = 0;
    private _isLoading: boolean = true;
    private _allPlans: SubscriptionPlan[] = [];
    private _filteredPlans: SubscriptionPlan[] = [];
    private _countryStats: PlanStatistics[] = [];
    private _countries: CountryDocument[] = [];
    private _selectedCountryFilterIndex: number = 0;
    private _stats: Stats = {
        totalPlans: 0,
        activePlans: 0,
        countriesWithPlans: 0,
    };

    constructor() {
        super();
        this.subscriptionService = AdminSubscriptionFirebaseService.getInstance();
        this.locationService = AdminLocationFirebaseService.getInstance();

        this.loadData();
    }

    // Getters and Setters
    get selectedTabIndex(): number { return this._selectedTabIndex; }
    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get allPlans(): SubscriptionPlan[] { return this._allPlans; }
    set allPlans(value: SubscriptionPlan[]) {
        this._allPlans = value;
        this.notifyPropertyChange('allPlans', value);
        this.filterPlans();
    }

    get filteredPlans(): SubscriptionPlan[] { return this._filteredPlans; }
    set filteredPlans(value: SubscriptionPlan[]) {
        this._filteredPlans = value;
        this.notifyPropertyChange('filteredPlans', value);
    }

    get countryStats(): PlanStatistics[] { return this._countryStats; }
    set countryStats(value: PlanStatistics[]) {
        this._countryStats = value;
        this.notifyPropertyChange('countryStats', value);
    }

    get stats(): Stats { return this._stats; }
    set stats(value: Stats) {
        this._stats = value;
        this.notifyPropertyChange('stats', value);
    }

    get countryFilterOptions(): string[] {
        return ['All Countries', ...this._countries.map(c => `${c.name} (${c.code})`)];
    }

    get selectedCountryFilterIndex(): number { return this._selectedCountryFilterIndex; }
    set selectedCountryFilterIndex(value: number) {
        if (this._selectedCountryFilterIndex !== value) {
            this._selectedCountryFilterIndex = value;
            this.notifyPropertyChange('selectedCountryFilterIndex', value);
            this.filterPlans();
        }
    }

    /**
     * Load all data
     */
    private async loadData(): Promise<void> {
        try {
            this.isLoading = true;

            const [plans, statistics, countries] = await Promise.all([
                this.subscriptionService.getAllPlans(false),
                this.subscriptionService.getPlanStatistics(),
                this.locationService.getAllCountries(false),
            ]);

            this._allPlans = plans;
            this._countries = countries;
            this.countryStats = statistics.byCountry;

            this.stats = {
                totalPlans: statistics.totalPlans,
                activePlans: statistics.activePlans,
                countriesWithPlans: statistics.byCountry.length,
            };

            this.filterPlans();
            this.notifyPropertyChange('countryFilterOptions', this.countryFilterOptions);

        } catch (error) {
            console.error('Error loading subscription data:', error);
            await Dialogs.alert({
                title: 'Error',
                message: 'Failed to load subscription plans',
                okButtonText: 'OK',
            });
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Filter plans based on selected country
     */
    private filterPlans(): void {
        if (this._selectedCountryFilterIndex === 0) {
            this.filteredPlans = this._allPlans;
        } else {
            const selectedCountry = this._countries[this._selectedCountryFilterIndex - 1];
            if (selectedCountry) {
                this.filteredPlans = this._allPlans.filter(
                    p => p.countryCode === selectedCountry.code || !p.countryCode
                );
            }
        }
    }

    /**
     * Tab selection handler
     */
    onTabSelect(args: any): void {
        const tag = parseInt(args.object.tag, 10);
        this.selectedTabIndex = tag;
    }

    /**
     * Add new subscription plan
     */
    async onAddPlan(): Promise<void> {
        try {
            // Step 1: Select country
            const countryOptions = ['Global (All Countries)', ...this._countries.map(c => `${c.name} (${c.code})`)];
            const countryResult = await Dialogs.action({
                title: 'Select Country',
                message: 'Which country is this plan for?',
                cancelButtonText: 'Cancel',
                actions: countryOptions,
            });

            if (!countryResult || countryResult === 'Cancel') return;

            let selectedCountry: CountryDocument | null = null;
            let currency = 'XOF'; // Default currency

            if (countryResult !== 'Global (All Countries)') {
                const countryIndex = countryOptions.indexOf(countryResult) - 1;
                selectedCountry = this._countries[countryIndex];
                currency = selectedCountry.currency;
            }

            // Step 2: Select plan type
            const typeResult = await Dialogs.action({
                title: 'Select Plan Type',
                message: 'What type of plan?',
                cancelButtonText: 'Cancel',
                actions: ['Free', 'Basic', 'Premium', 'Enterprise'],
            });

            if (!typeResult || typeResult === 'Cancel') return;
            const planType = typeResult.toLowerCase() as PlanType;

            // Step 3: Enter plan name
            const nameResult = await Dialogs.prompt({
                title: 'Plan Name',
                message: 'Enter a name for this plan:',
                defaultText: `${typeResult} Plan`,
                okButtonText: 'Next',
                cancelButtonText: 'Cancel',
            });

            if (!nameResult.result || !nameResult.text) return;
            const planName = nameResult.text;

            // Step 4: Enter price
            const priceResult = await Dialogs.prompt({
                title: 'Plan Price',
                message: `Enter the price in ${currency}:`,
                defaultText: this.getDefaultPrice(planType).toString(),
                okButtonText: 'Next',
                cancelButtonText: 'Cancel',
                inputType: 'number',
            });

            if (!priceResult.result) return;
            const price = parseFloat(priceResult.text) || 0;

            // Step 5: Select billing cycle
            const cycleResult = await Dialogs.action({
                title: 'Billing Cycle',
                message: 'How often is this plan billed?',
                cancelButtonText: 'Cancel',
                actions: ['Monthly', 'Quarterly', 'Yearly'],
            });

            if (!cycleResult || cycleResult === 'Cancel') return;
            const billingCycle = cycleResult.toLowerCase() as BillingCycle;

            // Step 6: Enter description
            const descResult = await Dialogs.prompt({
                title: 'Plan Description',
                message: 'Enter a short description:',
                defaultText: this.getDefaultDescription(planType),
                okButtonText: 'Create Plan',
                cancelButtonText: 'Cancel',
            });

            if (!descResult.result) return;

            // Create the plan
            const defaultPlan = DEFAULT_PLANS.find(p => p.type === planType);

            await this.subscriptionService.createPlan({
                name: planName,
                type: planType,
                description: descResult.text || '',
                price,
                currency,
                billingCycle,
                features: defaultPlan?.features || [],
                limits: defaultPlan?.limits || this.getDefaultLimits(planType),
                countryCode: selectedCountry?.code,
                countryName: selectedCountry?.name,
                region: selectedCountry?.region,
            });

            await Dialogs.alert({
                title: 'Success',
                message: `${planName} has been created.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error creating plan:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to create plan',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Edit subscription plan
     */
    async onEditPlan(args: any): Promise<void> {
        const plan: SubscriptionPlan = args.object.bindingContext;

        try {
            // Edit price
            const priceResult = await Dialogs.prompt({
                title: 'Edit Price',
                message: `Current price: ${plan.price} ${plan.currency}`,
                defaultText: plan.price.toString(),
                okButtonText: 'Update',
                cancelButtonText: 'Cancel',
                inputType: 'number',
            });

            if (!priceResult.result) return;

            const newPrice = parseFloat(priceResult.text);
            if (isNaN(newPrice)) {
                await Dialogs.alert({
                    title: 'Error',
                    message: 'Please enter a valid price',
                    okButtonText: 'OK',
                });
                return;
            }

            await this.subscriptionService.updatePlan(plan.id, { price: newPrice });

            await Dialogs.alert({
                title: 'Success',
                message: `${plan.name} has been updated.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error editing plan:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to update plan',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Toggle plan active status
     */
    async onTogglePlanStatus(args: any): Promise<void> {
        const plan: SubscriptionPlan = args.object.bindingContext;
        const action = plan.isActive ? 'deactivate' : 'activate';

        const confirmed = await Dialogs.confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Plan`,
            message: `Are you sure you want to ${action} ${plan.name}?`,
            okButtonText: 'Yes',
            cancelButtonText: 'No',
        });

        if (!confirmed) return;

        try {
            await this.subscriptionService.togglePlanStatus(plan.id, !plan.isActive);

            await Dialogs.alert({
                title: 'Success',
                message: `${plan.name} has been ${action}d.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error toggling plan status:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || `Failed to ${action} plan`,
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Delete subscription plan
     */
    async onDeletePlan(args: any): Promise<void> {
        const plan: SubscriptionPlan = args.object.bindingContext;

        const confirmed = await Dialogs.confirm({
            title: 'Delete Plan',
            message: `Are you sure you want to delete ${plan.name}? This cannot be undone.`,
            okButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });

        if (!confirmed) return;

        try {
            await this.subscriptionService.deletePlan(plan.id);

            await Dialogs.alert({
                title: 'Success',
                message: `${plan.name} has been deleted.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error deleting plan:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to delete plan',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Initialize default plans for a country
     */
    async onInitializeCountryPlans(args: any): Promise<void> {
        const countryStat: PlanStatistics = args.object.bindingContext;

        // Find the country document
        const country = this._countries.find(c => c.code === countryStat.countryCode);
        if (!country) {
            await Dialogs.alert({
                title: 'Error',
                message: 'Country not found',
                okButtonText: 'OK',
            });
            return;
        }

        const confirmed = await Dialogs.confirm({
            title: 'Initialize Plans',
            message: `Create default subscription plans for ${country.name}?\n\nThis will create Free, Basic, Premium, and Enterprise plans with ${country.currency} pricing.`,
            okButtonText: 'Create',
            cancelButtonText: 'Cancel',
        });

        if (!confirmed) return;

        try {
            this.isLoading = true;

            await this.subscriptionService.initializeDefaultPlansForCountry(
                country.code,
                country.name,
                country.currency,
                country.region
            );

            await Dialogs.alert({
                title: 'Success',
                message: `Default plans created for ${country.name}.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error initializing plans:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to create plans',
                okButtonText: 'OK',
            });
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Navigate to country plans
     */
    onCountryTap(args: any): void {
        const countryStat: PlanStatistics = args.object.bindingContext;

        // Filter to show only this country's plans
        const countryIndex = this._countries.findIndex(c => c.code === countryStat.countryCode);
        if (countryIndex >= 0) {
            this.selectedCountryFilterIndex = countryIndex + 1;
            this.selectedTabIndex = 0;
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private getDefaultPrice(type: PlanType): number {
        switch (type) {
            case 'free': return 0;
            case 'basic': return 5000;
            case 'premium': return 15000;
            case 'enterprise': return 50000;
            default: return 0;
        }
    }

    private getDefaultDescription(type: PlanType): string {
        switch (type) {
            case 'free': return 'Basic access to the platform';
            case 'basic': return 'For small pharmacies';
            case 'premium': return 'For medium pharmacies';
            case 'enterprise': return 'For pharmacy chains';
            default: return '';
        }
    }

    private getDefaultLimits(type: PlanType): any {
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
                    maxExchangesPerMonth: -1,
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
}
