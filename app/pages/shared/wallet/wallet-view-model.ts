import { Observable, Frame, Dialogs } from '@nativescript/core';
import { WalletFirebaseService } from '../../../services/firebase/wallet-firebase.service';
import {
    Wallet,
    WalletTransaction,
    TopUpRequest,
    MobileMoneyProvider,
    getProvidersByCurrency,
    getCurrencyConfig,
    SUPPORTED_CURRENCIES,
} from '../../../models/wallet.model';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';

export class WalletViewModel extends Observable {
    private walletService: WalletFirebaseService;
    private authService: AuthFirebaseService;
    private unsubscribeWallet: (() => void) | null = null;
    private unsubscribeTransactions: (() => void) | null = null;

    // Wallet data
    private _balance: number = 0;
    private _currency: string = 'XOF';
    private _pendingCredits: number = 0;
    private _pendingDebits: number = 0;
    private _transactions: any[] = [];
    private _isLoading: boolean = true;

    constructor() {
        super();
        this.walletService = WalletFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();
        this.loadWalletData();
    }

    // Getters
    get balance(): number { return this._balance; }
    set balance(value: number) {
        if (this._balance !== value) {
            this._balance = value;
            this.notifyPropertyChange('balance', value);
        }
    }

    get currency(): string { return this._currency; }
    set currency(value: string) {
        if (this._currency !== value) {
            this._currency = value;
            this.notifyPropertyChange('currency', value);
        }
    }

    get pendingCredits(): number { return this._pendingCredits; }
    set pendingCredits(value: number) {
        if (this._pendingCredits !== value) {
            this._pendingCredits = value;
            this.notifyPropertyChange('pendingCredits', value);
        }
    }

    get pendingDebits(): number { return this._pendingDebits; }
    set pendingDebits(value: number) {
        if (this._pendingDebits !== value) {
            this._pendingDebits = value;
            this.notifyPropertyChange('pendingDebits', value);
        }
    }

    get transactions(): any[] { return this._transactions; }
    set transactions(value: any[]) {
        if (this._transactions !== value) {
            this._transactions = value;
            this.notifyPropertyChange('transactions', value);
            this.notifyPropertyChange('hasTransactions', value.length > 0);
        }
    }

    get hasTransactions(): boolean { return this._transactions.length > 0; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    /**
     * Load wallet data with real-time updates
     */
    private async loadWalletData(): Promise<void> {
        try {
            this.isLoading = true;
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                console.error('No user logged in');
                return;
            }

            const userId = currentUser.id;

            // Subscribe to wallet updates
            this.unsubscribeWallet = this.walletService.subscribeToWallet(userId, (wallet) => {
                if (wallet) {
                    this.balance = wallet.balance;
                    this.currency = wallet.currency;
                }
            });

            // Get wallet summary for pending amounts
            const summary = await this.walletService.getWalletSummary(userId);
            if (summary) {
                this.pendingCredits = summary.pendingCredits;
                this.pendingDebits = summary.pendingDebits;
            }

            // Subscribe to transactions
            this.unsubscribeTransactions = this.walletService.subscribeToTransactions(userId, (transactions) => {
                this.transactions = transactions.map(tx => this.formatTransaction(tx));
            });

        } catch (error) {
            console.error('Error loading wallet data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Format transaction for display
     */
    private formatTransaction(tx: WalletTransaction): any {
        const date = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt);
        return {
            ...tx,
            formattedDate: this.formatDate(date),
        };
    }

    /**
     * Format date for display
     */
    private formatDate(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    }

    /**
     * Navigate to top-up page
     */
    async onTopUp(): Promise<void> {
        const result = await Dialogs.prompt({
            title: 'Top Up Wallet',
            message: 'Enter amount to add (XOF):',
            inputType: 'number',
            okButtonText: 'Continue',
            cancelButtonText: 'Cancel',
        });

        if (result.result && result.text) {
            const amount = parseInt(result.text, 10);
            if (amount > 0) {
                await this.processTopUp(amount);
            } else {
                Dialogs.alert('Please enter a valid amount');
            }
        }
    }

    /**
     * Process top-up request
     */
    private async processTopUp(amount: number): Promise<void> {
        // First, select currency if not already set
        const currency = this._currency || 'XOF';
        const currencyConfig = getCurrencyConfig(currency);

        // Get available providers for this currency
        const providers = getProvidersByCurrency(currency);

        if (providers.length === 0) {
            // Fallback: let user select currency first
            await this.selectCurrencyAndProvider(amount);
            return;
        }

        // Build payment method options
        const paymentOptions: string[] = providers.map(p => p.name);
        paymentOptions.push('Bank Transfer');

        const result = await Dialogs.action({
            title: 'Select Payment Method',
            message: `Top up ${amount} ${currency}`,
            cancelButtonText: 'Cancel',
            actions: paymentOptions,
        });

        if (result && result !== 'Cancel') {
            try {
                const currentUser = this.authService.getCurrentUser();
                if (!currentUser) return;

                let paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
                let selectedProvider: MobileMoneyProvider | undefined;

                if (result === 'Bank Transfer') {
                    paymentMethod = 'bank_transfer';
                } else {
                    paymentMethod = 'mobile_money';
                    selectedProvider = providers.find(p => p.name === result);
                }

                // Get phone number for mobile money
                let phoneNumber: string | undefined;
                if (paymentMethod === 'mobile_money' && selectedProvider) {
                    const prefix = selectedProvider.phonePrefix?.[0] || '';
                    const phoneResult = await Dialogs.prompt({
                        title: 'Phone Number',
                        message: `Enter your ${selectedProvider.shortName} number:`,
                        inputType: 'phone',
                        defaultText: prefix,
                        okButtonText: 'Submit',
                        cancelButtonText: 'Cancel',
                    });

                    if (!phoneResult.result || !phoneResult.text) {
                        return;
                    }
                    phoneNumber = phoneResult.text;
                }

                const request: TopUpRequest = {
                    amount,
                    currency,
                    paymentMethod,
                    phoneNumber,
                    providerId: selectedProvider?.id,
                    provider: selectedProvider?.name,
                };

                await this.walletService.requestTopUp(currentUser.id, request);

                Dialogs.alert({
                    title: 'Request Submitted',
                    message: selectedProvider
                        ? `Your ${selectedProvider.shortName} top-up request has been submitted. You will receive a payment prompt shortly.`
                        : 'Your top-up request has been submitted.',
                    okButtonText: 'OK',
                });
            } catch (error) {
                console.error('Error processing top-up:', error);
                Dialogs.alert({
                    title: 'Error',
                    message: 'Failed to process top-up request. Please try again.',
                    okButtonText: 'OK',
                });
            }
        }
    }

    /**
     * Select currency and provider (for new wallets or currency change)
     */
    private async selectCurrencyAndProvider(amount: number): Promise<void> {
        // Group currencies by region for better UX
        const currencyOptions = SUPPORTED_CURRENCIES.map(c => `${c.code} - ${c.name}`);

        const currencyResult = await Dialogs.action({
            title: 'Select Currency',
            message: 'Choose your currency',
            cancelButtonText: 'Cancel',
            actions: currencyOptions,
        });

        if (currencyResult && currencyResult !== 'Cancel') {
            const selectedCurrency = currencyResult.split(' - ')[0];
            this.currency = selectedCurrency;

            // Now process with selected currency
            await this.processTopUp(amount);
        }
    }

    /**
     * View full transaction history
     */
    onViewHistory(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/wallet/transaction-history-page',
            context: {},
        });
    }

    /**
     * Cleanup subscriptions
     */
    onUnloaded(): void {
        if (this.unsubscribeWallet) {
            this.unsubscribeWallet();
            this.unsubscribeWallet = null;
        }
        if (this.unsubscribeTransactions) {
            this.unsubscribeTransactions();
            this.unsubscribeTransactions = null;
        }
    }
}
