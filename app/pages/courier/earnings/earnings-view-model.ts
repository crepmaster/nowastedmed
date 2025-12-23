import { Observable, Dialogs, Frame } from '@nativescript/core';
import { CourierEarningsFirebaseService, PayoutRequest } from '../../../services/firebase/courier-earnings-firebase.service';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { CourierEarning, CourierPayout, EarningsSummary, CourierWallet } from '../../../models/delivery.model';
import { MOBILE_MONEY_PROVIDERS } from '../../../models/wallet.model';

interface EarningDisplay extends CourierEarning {
    netAmountFormatted: string;
    dateFormatted: string;
    statusLabel: string;
    statusClass: string;
}

interface PayoutDisplay extends CourierPayout {
    amountFormatted: string;
    dateFormatted: string;
    statusLabel: string;
    statusClass: string;
    paymentMethodLabel: string;
}

export class EarningsViewModel extends Observable {
    private earningsService: CourierEarningsFirebaseService;
    private authService: AuthFirebaseService;
    private currentUserId: string = '';
    private wallet: CourierWallet | null = null;

    private _isLoading: boolean = true;
    private _selectedTab: 'earnings' | 'payouts' = 'earnings';
    private _earnings: EarningDisplay[] = [];
    private _payouts: PayoutDisplay[] = [];
    private _summary: EarningsSummary | null = null;

    constructor() {
        super();
        this.earningsService = CourierEarningsFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();

        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            this.currentUserId = currentUser.id;
        }

        this.loadData();
    }

    // Getters
    get isLoading(): boolean {
        return this._isLoading;
    }

    get selectedTab(): string {
        return this._selectedTab;
    }

    get earnings(): EarningDisplay[] {
        return this._earnings;
    }

    get payouts(): PayoutDisplay[] {
        return this._payouts;
    }

    get availableBalanceFormatted(): string {
        if (!this._summary) return '0';
        return `${this._summary.availableBalance.toLocaleString()} ${this._summary.currency}`;
    }

    get pendingBalanceFormatted(): string {
        if (!this._summary) return '0';
        return `${this._summary.pendingBalance.toLocaleString()} ${this._summary.currency}`;
    }

    get monthEarningsFormatted(): string {
        if (!this._summary) return '0';
        return `${this._summary.monthEarnings.toLocaleString()} ${this._summary.currency}`;
    }

    get todayDeliveries(): number {
        return this._summary?.completedDeliveriesToday || 0;
    }

    get weekDeliveries(): number {
        return this._summary?.completedDeliveriesThisWeek || 0;
    }

    get monthDeliveries(): number {
        return this._summary?.completedDeliveriesThisMonth || 0;
    }

    get canWithdraw(): boolean {
        return (this._summary?.availableBalance || 0) > 0;
    }

    // Data loading
    private async loadData(): Promise<void> {
        try {
            this.set('_isLoading', true);

            // Load summary
            this._summary = await this.earningsService.getEarningsSummary(this.currentUserId);
            this.notifyPropertyChange('availableBalanceFormatted', this.availableBalanceFormatted);
            this.notifyPropertyChange('pendingBalanceFormatted', this.pendingBalanceFormatted);
            this.notifyPropertyChange('monthEarningsFormatted', this.monthEarningsFormatted);
            this.notifyPropertyChange('todayDeliveries', this.todayDeliveries);
            this.notifyPropertyChange('weekDeliveries', this.weekDeliveries);
            this.notifyPropertyChange('monthDeliveries', this.monthDeliveries);
            this.notifyPropertyChange('canWithdraw', this.canWithdraw);

            // Load wallet
            this.wallet = await this.earningsService.getCourierWallet(this.currentUserId);

            // Load earnings
            await this.loadEarnings();

            // Load payouts
            await this.loadPayouts();
        } catch (error) {
            console.error('Error loading earnings data:', error);
        } finally {
            this.set('_isLoading', false);
        }
    }

    private async loadEarnings(): Promise<void> {
        try {
            const earnings = await this.earningsService.getCourierEarnings(this.currentUserId);

            this._earnings = earnings.map(e => this.transformEarning(e));
            this.notifyPropertyChange('earnings', this._earnings);
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }

    private async loadPayouts(): Promise<void> {
        try {
            const payouts = await this.earningsService.getCourierPayouts(this.currentUserId);

            this._payouts = payouts.map(p => this.transformPayout(p));
            this.notifyPropertyChange('payouts', this._payouts);
        } catch (error) {
            console.error('Error loading payouts:', error);
        }
    }

    private transformEarning(earning: CourierEarning): EarningDisplay {
        const statusLabels: Record<string, string> = {
            pending: 'Pending',
            available: 'Available',
            processing: 'Processing',
            paid: 'Paid',
            failed: 'Failed',
        };

        const statusClasses: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            available: 'bg-green-100 text-green-700',
            processing: 'bg-blue-100 text-blue-700',
            paid: 'bg-gray-100 text-gray-700',
            failed: 'bg-red-100 text-red-700',
        };

        return {
            ...earning,
            netAmountFormatted: `${earning.netAmount.toLocaleString()} ${earning.currency}`,
            dateFormatted: this.formatDate(earning.deliveryCompletedAt),
            statusLabel: statusLabels[earning.status] || earning.status,
            statusClass: statusClasses[earning.status] || 'bg-gray-100 text-gray-700',
        };
    }

    private transformPayout(payout: CourierPayout): PayoutDisplay {
        const statusLabels: Record<string, string> = {
            pending: 'Pending',
            processing: 'Processing',
            completed: 'Completed',
            failed: 'Failed',
            cancelled: 'Cancelled',
        };

        const statusClasses: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };

        const methodLabels: Record<string, string> = {
            mobile_money: 'Mobile Money',
            bank_transfer: 'Bank Transfer',
        };

        return {
            ...payout,
            amountFormatted: `${payout.amount.toLocaleString()} ${payout.currency}`,
            dateFormatted: this.formatDate(payout.createdAt),
            statusLabel: statusLabels[payout.status] || payout.status,
            statusClass: statusClasses[payout.status] || 'bg-gray-100 text-gray-700',
            paymentMethodLabel: payout.paymentProvider
                ? `${methodLabels[payout.paymentMethod]} (${payout.paymentProvider.toUpperCase()})`
                : methodLabels[payout.paymentMethod],
        };
    }

    private formatDate(date: any): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    // Tab actions
    public onSelectEarningsTab(): void {
        this.set('_selectedTab', 'earnings');
    }

    public onSelectPayoutsTab(): void {
        this.set('_selectedTab', 'payouts');
    }

    // Withdraw action
    public async onWithdraw(): Promise<void> {
        if (!this._summary || this._summary.availableBalance <= 0) {
            await Dialogs.alert({
                title: 'No Funds',
                message: 'You have no available funds to withdraw.',
                okButtonText: 'OK',
            });
            return;
        }

        // Step 1: Get amount
        const amountResult = await Dialogs.prompt({
            title: 'Withdraw Funds',
            message: `Available: ${this.availableBalanceFormatted}\nEnter amount to withdraw:`,
            okButtonText: 'Continue',
            cancelButtonText: 'Cancel',
            defaultText: this._summary.availableBalance.toString(),
            inputType: 'number',
        });

        if (!amountResult.result) return;

        const amount = parseFloat(amountResult.text);
        if (isNaN(amount) || amount <= 0) {
            await Dialogs.alert({
                title: 'Invalid Amount',
                message: 'Please enter a valid amount.',
                okButtonText: 'OK',
            });
            return;
        }

        if (amount > this._summary.availableBalance) {
            await Dialogs.alert({
                title: 'Insufficient Funds',
                message: `You can only withdraw up to ${this.availableBalanceFormatted}`,
                okButtonText: 'OK',
            });
            return;
        }

        // Step 2: Select payment method
        const methodResult = await Dialogs.action({
            title: 'Payment Method',
            message: 'How would you like to receive your funds?',
            actions: ['Mobile Money', 'Bank Transfer'],
            cancelButtonText: 'Cancel',
        });

        if (!methodResult || methodResult === 'Cancel') return;

        const paymentMethod: 'mobile_money' | 'bank_transfer' =
            methodResult === 'Mobile Money' ? 'mobile_money' : 'bank_transfer';

        // Step 3: Get provider (for mobile money)
        let paymentProvider: string | undefined;
        if (paymentMethod === 'mobile_money') {
            const providers = ['MTN Mobile Money', 'Orange Money', 'M-Pesa', 'Airtel Money', 'Other'];
            const providerResult = await Dialogs.action({
                title: 'Select Provider',
                message: 'Choose your mobile money provider:',
                actions: providers,
                cancelButtonText: 'Cancel',
            });

            if (!providerResult || providerResult === 'Cancel') return;

            const providerMap: Record<string, string> = {
                'MTN Mobile Money': 'mtn',
                'Orange Money': 'orange',
                'M-Pesa': 'mpesa',
                'Airtel Money': 'airtel',
                'Other': 'other',
            };
            paymentProvider = providerMap[providerResult];
        }

        // Step 4: Get account details
        const accountLabel = paymentMethod === 'mobile_money' ? 'phone number' : 'account number';
        const accountResult = await Dialogs.prompt({
            title: 'Account Details',
            message: `Enter your ${accountLabel}:`,
            okButtonText: 'Continue',
            cancelButtonText: 'Cancel',
            defaultText: this.wallet?.paymentAccount || '',
        });

        if (!accountResult.result || !accountResult.text) return;

        // Step 5: Get account holder name
        const nameResult = await Dialogs.prompt({
            title: 'Account Holder',
            message: 'Enter the account holder name:',
            okButtonText: 'Submit Request',
            cancelButtonText: 'Cancel',
            defaultText: this.wallet?.accountHolderName || '',
        });

        if (!nameResult.result || !nameResult.text) return;

        // Submit payout request
        try {
            const request: PayoutRequest = {
                amount,
                paymentMethod,
                paymentProvider,
                paymentAccount: accountResult.text,
                accountHolderName: nameResult.text,
            };

            await this.earningsService.requestPayout(this.currentUserId, request);

            await Dialogs.alert({
                title: 'Request Submitted',
                message: `Your withdrawal request for ${amount.toLocaleString()} ${this._summary.currency} has been submitted. It will be processed shortly.`,
                okButtonText: 'OK',
            });

            // Refresh data
            await this.loadData();
        } catch (error: any) {
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to submit payout request',
                okButtonText: 'OK',
            });
        }
    }
}
