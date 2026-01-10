import { Observable, Frame, Dialogs } from '@nativescript/core';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { FirestoreService } from '../../../services/firebase/firestore.service';

export class DeliveryPaymentViewModel extends Observable {
    private authService: AuthFirebaseService;
    private firestoreService: FirestoreService;
    private deliveryId: string;
    private exchangeId: string;

    constructor(context?: any) {
        super();
        this.authService = AuthFirebaseService.getInstance();
        this.firestoreService = FirestoreService.getInstance();

        // Initialize with context data
        if (context) {
            this.deliveryId = context.deliveryId || '';
            this.exchangeId = context.exchangeId || '';
            this.set('medicineName', context.medicineName || 'Medicine');
            this.set('quantity', context.quantity || 1);
            this.set('fromPharmacy', context.fromPharmacy || 'Origin');
            this.set('toPharmacy', context.toPharmacy || 'Destination');
            this.set('distance', context.distance || '5 km');
        }

        this.set('currency', 'FCFA');
        this.set('paymentMethod', 'wallet');

        this.loadPaymentDetails();
    }

    private async loadPaymentDetails(): Promise<void> {
        try {
            // Calculate fees
            const deliveryFee = 500; // Base delivery fee
            const platformFee = 50;  // Platform commission
            const tax = 0;           // No tax for now

            this.set('deliveryFee', deliveryFee);
            this.set('platformFee', platformFee);
            this.set('tax', tax);
            this.set('totalAmount', deliveryFee + platformFee + tax);

            // Get wallet balance
            const user = this.authService.getCurrentUser();
            if (user) {
                const walletDoc = await this.firestoreService.getDocument('wallets', user.id);
                const walletBalance = walletDoc?.balance || 0;
                this.set('walletBalance', walletBalance);

                const hasSufficientBalance = walletBalance >= this.get('totalAmount');
                this.set('hasSufficientBalance', hasSufficientBalance);
                this.set('canPay', hasSufficientBalance);
                this.set('payButtonText', hasSufficientBalance ? 'Pay Now' : 'Insufficient Balance');
            }
        } catch (error) {
            console.error('Error loading payment details:', error);
            this.set('statusMessage', 'Error loading payment details');
            this.set('statusType', 'error');
        }
    }

    onSelectWallet(): void {
        this.set('paymentMethod', 'wallet');
    }

    onSelectTopUp(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/wallet/wallet-page'
        });
    }

    async onPayDelivery(): Promise<void> {
        if (!this.get('canPay')) {
            return;
        }

        const confirmed = await Dialogs.confirm({
            title: 'Confirm Payment',
            message: `Pay ${this.get('totalAmount')} ${this.get('currency')} for delivery?`,
            okButtonText: 'Pay',
            cancelButtonText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            this.set('canPay', false);
            this.set('payButtonText', 'Processing...');

            const user = this.authService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const totalAmount = this.get('totalAmount');
            const walletBalance = this.get('walletBalance');

            // Create payment transaction
            const paymentData = {
                userId: user.id,
                deliveryId: this.deliveryId,
                exchangeId: this.exchangeId,
                amount: totalAmount,
                type: 'delivery_payment',
                status: 'completed',
                createdAt: new Date(),
                description: `Delivery payment for ${this.get('medicineName')}`
            };

            await this.firestoreService.addDocument('transactions', paymentData);

            // Update wallet balance
            await this.firestoreService.updateDocument('wallets', user.id, {
                balance: walletBalance - totalAmount,
                updatedAt: new Date()
            });

            // Update delivery status to partial_payment or paid
            if (this.deliveryId) {
                await this.firestoreService.updateDocument('deliveries', this.deliveryId, {
                    paymentStatus: 'paid',
                    paidAt: new Date(),
                    paidBy: user.id
                });
            }

            this.set('statusMessage', 'Payment successful!');
            this.set('statusType', 'success');

            // Navigate back after delay
            setTimeout(() => {
                Frame.topmost().goBack();
            }, 1500);

        } catch (error: any) {
            console.error('Payment error:', error);
            this.set('statusMessage', error.message || 'Payment failed');
            this.set('statusType', 'error');
            this.set('canPay', true);
            this.set('payButtonText', 'Retry Payment');
        }
    }
}
