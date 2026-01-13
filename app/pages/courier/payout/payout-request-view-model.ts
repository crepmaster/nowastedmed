import { Observable, Dialogs } from '@nativescript/core';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { FirestoreService } from '../../../services/firebase/firestore.service';

export class PayoutRequestViewModel extends Observable {
    private authSession: AuthSessionService;
    private firestoreService: FirestoreService;

    constructor() {
        super();
        this.authSession = getAuthSessionService();
        this.firestoreService = FirestoreService.getInstance();

        this.set('currency', 'FCFA');
        this.set('minimumPayout', 1000);
        this.set('processingFee', 100);
        this.set('payoutMethod', 'mobile_money');
        this.set('payoutAmount', '');
        this.set('requestButtonText', 'Request Payout');

        this.loadPayoutData();
    }

    private async loadPayoutData(): Promise<void> {
        try {
            const user = this.authSession.currentUser;
            if (!user) return;

            // Get wallet balance
            const walletDoc = await this.firestoreService.getDocument('wallets', user.id);
            const availableBalance = walletDoc?.balance || 0;
            this.set('availableBalance', availableBalance);

            // Get payment method info
            this.set('mobileMoneyNumber', (user as any).phoneNumber || '');
            this.set('bankAccountNumber', (user as any).bankAccount || '');

            // Check for pending payouts - query by userId then filter by status
            const userPayouts = await this.firestoreService.queryDocuments('payouts', 'userId', '==', user.id);
            const pendingPayouts = userPayouts.filter((p: any) => p.status === 'pending');

            if (pendingPayouts.length > 0) {
                const pending = pendingPayouts[0];
                this.set('hasPendingPayout', true);
                this.set('pendingPayoutAmount', pending.amount);
                this.set('pendingPayoutStatus', pending.status);
                this.set('pendingPayoutDate', this.formatDate(pending.createdAt));
            } else {
                this.set('hasPendingPayout', false);
            }

            this.validatePayout();
        } catch (error) {
            console.error('Error loading payout data:', error);
        }
    }

    private formatDate(date: any): string {
        if (!date) return '';
        const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    }

    private validatePayout(): void {
        const amount = parseFloat(this.get('payoutAmount')) || 0;
        const availableBalance = this.get('availableBalance') || 0;
        const minimumPayout = this.get('minimumPayout');
        const hasPendingPayout = this.get('hasPendingPayout');

        let canRequest = true;
        let validationMessage = '';

        if (hasPendingPayout) {
            canRequest = false;
            validationMessage = 'You already have a pending payout request';
        } else if (amount <= 0) {
            canRequest = false;
            validationMessage = '';
        } else if (amount < minimumPayout) {
            canRequest = false;
            validationMessage = `Minimum payout is ${minimumPayout} ${this.get('currency')}`;
        } else if (amount > availableBalance) {
            canRequest = false;
            validationMessage = 'Insufficient balance';
        }

        // Calculate net amount
        const processingFee = amount > 0 ? this.get('processingFee') : 0;
        const netAmount = Math.max(0, amount - processingFee);

        this.set('canRequestPayout', canRequest);
        this.set('validationMessage', validationMessage);
        this.set('netAmount', netAmount);
    }

    // Quick amount buttons
    onQuickAmount25(): void {
        const amount = Math.floor(this.get('availableBalance') * 0.25);
        this.set('payoutAmount', amount.toString());
        this.validatePayout();
    }

    onQuickAmount50(): void {
        const amount = Math.floor(this.get('availableBalance') * 0.50);
        this.set('payoutAmount', amount.toString());
        this.validatePayout();
    }

    onQuickAmount75(): void {
        const amount = Math.floor(this.get('availableBalance') * 0.75);
        this.set('payoutAmount', amount.toString());
        this.validatePayout();
    }

    onQuickAmountAll(): void {
        const amount = this.get('availableBalance');
        this.set('payoutAmount', amount.toString());
        this.validatePayout();
    }

    onSelectMobileMoney(): void {
        this.set('payoutMethod', 'mobile_money');
    }

    onSelectBankTransfer(): void {
        this.set('payoutMethod', 'bank');
    }

    async onRequestPayout(): Promise<void> {
        if (!this.get('canRequestPayout')) return;

        const amount = parseFloat(this.get('payoutAmount'));
        const method = this.get('payoutMethod');

        const confirmed = await Dialogs.confirm({
            title: 'Confirm Payout Request',
            message: `Request ${amount} ${this.get('currency')} payout via ${method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}?`,
            okButtonText: 'Request',
            cancelButtonText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            this.set('canRequestPayout', false);
            this.set('requestButtonText', 'Processing...');

            const user = this.authSession.currentUser;
            if (!user) throw new Error('User not authenticated');

            // Create payout request
            const payoutData = {
                userId: user.id,
                amount: amount,
                netAmount: this.get('netAmount'),
                processingFee: this.get('processingFee'),
                method: method,
                status: 'pending',
                createdAt: new Date(),
                destination: method === 'mobile_money' ? this.get('mobileMoneyNumber') : this.get('bankAccountNumber')
            };

            await this.firestoreService.addDocument('payouts', payoutData);

            // Deduct from wallet (hold until processed)
            const currentBalance = this.get('availableBalance');
            await this.firestoreService.updateDocument('wallets', user.id, {
                balance: currentBalance - amount,
                pendingPayout: amount,
                updatedAt: new Date()
            });

            this.set('statusMessage', 'Payout request submitted successfully!');
            this.set('statusType', 'success');

            // Refresh data
            setTimeout(() => {
                this.loadPayoutData();
                this.set('payoutAmount', '');
                this.set('requestButtonText', 'Request Payout');
            }, 2000);

        } catch (error: any) {
            console.error('Payout request error:', error);
            this.set('statusMessage', error.message || 'Failed to submit payout request');
            this.set('statusType', 'error');
            this.set('canRequestPayout', true);
            this.set('requestButtonText', 'Request Payout');
        }
    }

    onViewPayoutHistory(): void {
        // TODO: Navigate to payout history page
        Dialogs.alert({
            title: 'Payout History',
            message: 'Payout history page coming soon.',
            okButtonText: 'OK'
        });
    }
}
