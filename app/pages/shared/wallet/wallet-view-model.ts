import { Observable, Frame, Dialogs } from '@nativescript/core';
import { WalletFirebaseService } from '../../../services/firebase/wallet-firebase.service';
import {
    Wallet,
    WalletTransaction,
    TopUpRequest,
    WithdrawRequest,
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

    // User's preferred mobile money provider
    private _userProviderId: string | null = null;
    private _userProviderName: string | null = null;

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

            // Load user's preferred mobile money provider
            this._userProviderId = (currentUser as any).mobileMoneyProvider || null;
            this._userProviderName = (currentUser as any).mobileMoneyProviderName || null;

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

        // Check if user has no mobile money provider configured
        if (!this._userProviderId) {
            const configureResult = await Dialogs.confirm({
                title: 'Mobile Money Not Configured',
                message: 'You need to configure a mobile money provider in your Account settings before you can top up your wallet.',
                okButtonText: 'Go to Account',
                cancelButtonText: 'Cancel',
            });

            if (configureResult) {
                Frame.topmost().navigate({
                    moduleName: 'pages/shared/account/account-page',
                });
            }
            return;
        }

        // Find user's preferred provider
        const userProvider = providers.find(p => p.id === this._userProviderId);

        // Build payment method options - user's preferred provider first
        const paymentOptions: string[] = [];
        if (userProvider) {
            paymentOptions.push(`${userProvider.name} (Your provider)`);
        }
        // Add other providers
        providers.forEach(p => {
            if (p.id !== this._userProviderId) {
                paymentOptions.push(p.name);
            }
        });
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
                    // Handle "(Your provider)" suffix
                    const providerName = result.replace(' (Your provider)', '');
                    selectedProvider = providers.find(p => p.name === providerName);
                }

                // Get phone number for mobile money
                let phoneNumber: string | undefined;
                if (paymentMethod === 'mobile_money' && selectedProvider) {
                    // Pre-fill with user's phone number if available
                    const defaultPhone = currentUser.phoneNumber || selectedProvider.phonePrefix?.[0] || '';
                    const phoneResult = await Dialogs.prompt({
                        title: 'Phone Number',
                        message: `Enter your ${selectedProvider.shortName} number:`,
                        inputType: 'phone',
                        defaultText: defaultPhone,
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

                // For demo: process immediately instead of creating pending request
                await this.walletService.processTopUpDemo(currentUser.id, request);

                Dialogs.alert({
                    title: 'Top-Up Successful',
                    message: `${amount} ${currency} has been added to your wallet via ${selectedProvider?.shortName || paymentMethod}.`,
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
     * Navigate to withdraw flow
     */
    async onWithdraw(): Promise<void> {
        // Check if user has sufficient balance
        if (this._balance <= 0) {
            Dialogs.alert({
                title: 'Insufficient Balance',
                message: 'You do not have any funds to withdraw.',
                okButtonText: 'OK',
            });
            return;
        }

        const result = await Dialogs.prompt({
            title: 'Withdraw Funds',
            message: `Enter amount to withdraw (${this._currency}):\nAvailable: ${this._balance} ${this._currency}`,
            inputType: 'number',
            okButtonText: 'Continue',
            cancelButtonText: 'Cancel',
        });

        if (result.result && result.text) {
            const amount = parseInt(result.text, 10);
            if (amount > 0 && amount <= this._balance) {
                await this.processWithdraw(amount);
            } else if (amount > this._balance) {
                Dialogs.alert({
                    title: 'Insufficient Balance',
                    message: `You can only withdraw up to ${this._balance} ${this._currency}`,
                    okButtonText: 'OK',
                });
            } else {
                Dialogs.alert({
                    title: 'Invalid Amount',
                    message: 'Please enter a valid amount',
                    okButtonText: 'OK',
                });
            }
        }
    }

    /**
     * Process withdrawal request
     */
    private async processWithdraw(amount: number): Promise<void> {
        const currency = this._currency || 'XOF';
        const providers = getProvidersByCurrency(currency);

        // Check if user has mobile money provider configured
        if (!this._userProviderId) {
            const configureResult = await Dialogs.confirm({
                title: 'Mobile Money Not Configured',
                message: 'You need to configure a mobile money provider in your Account settings before you can withdraw funds.',
                okButtonText: 'Go to Account',
                cancelButtonText: 'Cancel',
            });

            if (configureResult) {
                Frame.topmost().navigate({
                    moduleName: 'pages/shared/account/account-page',
                });
            }
            return;
        }

        // Find user's preferred provider
        const userProvider = providers.find(p => p.id === this._userProviderId);

        // Build withdrawal method options
        const withdrawOptions: string[] = [];
        if (userProvider) {
            withdrawOptions.push(`${userProvider.name} (Your provider)`);
        }
        // Add other providers
        providers.forEach(p => {
            if (p.id !== this._userProviderId) {
                withdrawOptions.push(p.name);
            }
        });
        withdrawOptions.push('Bank Transfer');

        const result = await Dialogs.action({
            title: 'Select Withdrawal Method',
            message: `Withdraw ${amount} ${currency}`,
            cancelButtonText: 'Cancel',
            actions: withdrawOptions,
        });

        if (result && result !== 'Cancel') {
            try {
                const currentUser = this.authService.getCurrentUser();
                if (!currentUser) return;

                let paymentMethod: 'mobile_money' | 'bank_transfer';
                let selectedProvider: MobileMoneyProvider | undefined;
                let phoneNumber: string | undefined;
                let bankAccountNumber: string | undefined;
                let bankName: string | undefined;

                if (result === 'Bank Transfer') {
                    paymentMethod = 'bank_transfer';

                    // Get bank details
                    const bankNameResult = await Dialogs.prompt({
                        title: 'Bank Name',
                        message: 'Enter your bank name:',
                        inputType: 'text',
                        okButtonText: 'Next',
                        cancelButtonText: 'Cancel',
                    });

                    if (!bankNameResult.result || !bankNameResult.text) {
                        return;
                    }
                    bankName = bankNameResult.text;

                    const accountResult = await Dialogs.prompt({
                        title: 'Account Number',
                        message: 'Enter your bank account number:',
                        inputType: 'text',
                        okButtonText: 'Submit',
                        cancelButtonText: 'Cancel',
                    });

                    if (!accountResult.result || !accountResult.text) {
                        return;
                    }
                    bankAccountNumber = accountResult.text;
                } else {
                    paymentMethod = 'mobile_money';
                    const providerName = result.replace(' (Your provider)', '');
                    selectedProvider = providers.find(p => p.name === providerName);

                    // Get phone number for mobile money
                    if (selectedProvider) {
                        const defaultPhone = currentUser.phoneNumber || selectedProvider.phonePrefix?.[0] || '';
                        const phoneResult = await Dialogs.prompt({
                            title: 'Phone Number',
                            message: `Enter your ${selectedProvider.shortName} number to receive funds:`,
                            inputType: 'phone',
                            defaultText: defaultPhone,
                            okButtonText: 'Submit',
                            cancelButtonText: 'Cancel',
                        });

                        if (!phoneResult.result || !phoneResult.text) {
                            return;
                        }
                        phoneNumber = phoneResult.text;
                    }
                }

                const request: WithdrawRequest = {
                    amount,
                    currency,
                    paymentMethod,
                    phoneNumber,
                    providerId: selectedProvider?.id,
                    provider: selectedProvider?.name,
                    bankAccountNumber,
                    bankName,
                };

                // For demo: process immediately instead of creating pending request
                await this.walletService.processWithdrawDemo(currentUser.id, request);

                Dialogs.alert({
                    title: 'Withdrawal Successful',
                    message: selectedProvider
                        ? `${amount} ${currency} has been sent to your ${selectedProvider.shortName} account.`
                        : `${amount} ${currency} has been transferred to your bank account.`,
                    okButtonText: 'OK',
                });
            } catch (error) {
                console.error('Error processing withdrawal:', error);
                Dialogs.alert({
                    title: 'Error',
                    message: 'Failed to process withdrawal request. Please try again.',
                    okButtonText: 'OK',
                });
            }
        }
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
