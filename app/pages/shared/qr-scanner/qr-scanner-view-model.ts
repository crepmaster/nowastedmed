import { Observable } from '@nativescript/core';
import { ExchangeVerificationService, VerificationResult } from '../../../services/exchange/exchange-verification.service';
import { AuthService } from '../../../services/auth.service';
import { alert, confirm } from '@nativescript/core/ui/dialogs';
import { NavigationService } from '../../../services/navigation.service';

export class QRScannerViewModel extends Observable {
    private verificationService: ExchangeVerificationService;
    private authService: AuthService;
    private navigationService: NavigationService;

    public isScanning: boolean = false;
    public lastResult: string = '';
    public statusMessage: string = 'Ready to scan';

    constructor() {
        super();
        this.verificationService = ExchangeVerificationService.getInstance();
        this.authService = AuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
    }

    async onScanQR() {
        try {
            this.set('isScanning', true);
            this.set('statusMessage', 'Scanning...');

            const result = await this.verificationService.scanAndVerify();

            await this.handleVerificationResult(result);
        } catch (error) {
            console.error('Error during scan:', error);
            this.set('statusMessage', 'Scan failed');
            await alert({
                title: 'Scan Error',
                message: 'Failed to scan QR code. Please try again.',
                okButtonText: 'OK'
            });
        } finally {
            this.set('isScanning', false);
        }
    }

    private async handleVerificationResult(result: VerificationResult) {
        if (!result.success) {
            this.set('statusMessage', result.message);
            await alert({
                title: 'Verification Failed',
                message: result.message,
                okButtonText: 'OK'
            });
            return;
        }

        this.set('statusMessage', result.message);
        const user = this.authService.getCurrentUser();

        if (!user) {
            await alert({
                title: 'Error',
                message: 'User not logged in',
                okButtonText: 'OK'
            });
            return;
        }

        // Handle based on user role and action
        if (user.role === 'courier') {
            await this.handleCourierAction(result);
        } else if (user.role === 'pharmacist') {
            await this.handlePharmacistAction(result);
        }
    }

    private async handleCourierAction(result: VerificationResult) {
        if (result.action === 'pickup') {
            const shouldConfirm = await confirm({
                title: 'Confirm Pickup',
                message: `Confirm pickup for exchange ${result.exchange?.id}?\n\nMedicines: ${this.formatMedicineList(result.exchange)}`,
                okButtonText: 'Confirm Pickup',
                cancelButtonText: 'Cancel'
            });

            if (shouldConfirm) {
                const success = await this.verificationService.confirmPickup(result.exchange!.id);
                if (success) {
                    this.set('statusMessage', 'Pickup confirmed!');
                    await alert({
                        title: 'Success',
                        message: 'Pickup confirmed. Exchange is now in transit.',
                        okButtonText: 'OK'
                    });
                    this.navigateBack();
                } else {
                    await alert({
                        title: 'Error',
                        message: 'Failed to confirm pickup. Please try again.',
                        okButtonText: 'OK'
                    });
                }
            }
        } else if (result.action === 'delivery') {
            await alert({
                title: 'Delivery QR',
                message: 'This is a delivery confirmation QR. The receiving pharmacy should scan this.',
                okButtonText: 'OK'
            });
        }
    }

    private async handlePharmacistAction(result: VerificationResult) {
        if (result.action === 'delivery') {
            const shouldConfirm = await confirm({
                title: 'Confirm Delivery',
                message: `Confirm delivery for exchange ${result.exchange?.id}?\n\nMedicines: ${this.formatMedicineList(result.exchange)}`,
                okButtonText: 'Confirm Delivery',
                cancelButtonText: 'Cancel'
            });

            if (shouldConfirm) {
                const success = await this.verificationService.confirmDelivery(result.exchange!.id);
                if (success) {
                    this.set('statusMessage', 'Delivery confirmed!');
                    await alert({
                        title: 'Success',
                        message: 'Delivery confirmed. Exchange is now complete.',
                        okButtonText: 'OK'
                    });
                    this.navigateBack();
                } else {
                    await alert({
                        title: 'Error',
                        message: 'Failed to confirm delivery. Please try again.',
                        okButtonText: 'OK'
                    });
                }
            }
        } else if (result.action === 'pickup') {
            await alert({
                title: 'Pickup QR',
                message: 'This is a pickup confirmation QR for the courier.',
                okButtonText: 'OK'
            });
        }
    }

    private formatMedicineList(exchange: any): string {
        if (!exchange || !exchange.proposedMedicines) return 'N/A';

        return exchange.proposedMedicines
            .map((m: any) => `${m.medicine?.name || 'Medicine'} x${m.quantity}`)
            .join(', ');
    }

    onBack() {
        this.navigateBack();
    }

    private navigateBack() {
        this.navigationService.goBack();
    }
}
