import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { ExchangeFirebaseService } from '../../../services/firebase/exchange-firebase.service';
import { ExchangeVerificationService } from '../../../services/exchange/exchange-verification.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { MedicineExchange, ExchangeStatus } from '../../../models/exchange/medicine-exchange.model';
import { alert, confirm } from '@nativescript/core/ui/dialogs';

export class ExchangeDetailsViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private exchangeFirebaseService: ExchangeFirebaseService;
    private verificationService: ExchangeVerificationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private useFirebase: boolean = true;

    public exchange: MedicineExchange;
    public availableMedicines: any[] = [];
    public isResponding: boolean = false;
    public isOwner: boolean = false;
    public canGenerateQR: boolean = false;
    public pickupQRCode: string = '';
    public deliveryQRCode: string = '';

    constructor(exchangeId: string) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.exchangeFirebaseService = ExchangeFirebaseService.getInstance();
        this.verificationService = ExchangeVerificationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();

        this.loadExchange(exchangeId);
    }

    async loadExchange(exchangeId: string) {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            let exchange: MedicineExchange | null = null;

            if (this.useFirebase) {
                exchange = await this.exchangeFirebaseService.getExchangeById(exchangeId);
            } else {
                const exchanges = await this.exchangeService.getExchangesByPharmacy(user.id);
                exchange = exchanges.find(e => e.id === exchangeId) || null;
            }

            if (exchange) {
                this.exchange = exchange;
                this.isOwner = exchange.proposedBy === user.id;
                this.isResponding = this.shouldShowResponse(exchange);
                this.canGenerateQR = exchange.status === 'accepted';

                if (this.isResponding) {
                    await this.loadAvailableMedicines();
                }

                // Generate QR codes if exchange is accepted
                if (this.canGenerateQR) {
                    await this.generateQRCodes();
                }

                this.notifyPropertyChange('exchange', this.exchange);
                this.notifyPropertyChange('isResponding', this.isResponding);
                this.notifyPropertyChange('isOwner', this.isOwner);
                this.notifyPropertyChange('canGenerateQR', this.canGenerateQR);
            }
        } catch (error) {
            console.error('Error loading exchange:', error);
        }
    }

    /**
     * Generate QR codes for pickup and delivery
     */
    private async generateQRCodes() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            this.pickupQRCode = await this.verificationService.generatePickupQR(
                this.exchange.id,
                user.id
            );
            this.deliveryQRCode = await this.verificationService.generateDeliveryQR(
                this.exchange.id,
                user.id
            );

            this.notifyPropertyChange('pickupQRCode', this.pickupQRCode);
            this.notifyPropertyChange('deliveryQRCode', this.deliveryQRCode);
        } catch (error) {
            console.error('Error generating QR codes:', error);
        }
    }

    private async loadAvailableMedicines() {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
        this.availableMedicines = medicines.map(m => ({
            ...m,
            selected: false,
            quantity: 0
        }));
        this.notifyPropertyChange('availableMedicines', this.availableMedicines);
    }

    private shouldShowResponse(exchange: MedicineExchange): boolean {
        const user = this.authService.getCurrentUser();
        return exchange.status === 'pending' && 
               exchange.proposedTo === user?.id;
    }

    get primaryActionText(): string {
        if (this.isResponding) {
            return 'Submit Response';
        }
        return this.exchange?.status === 'draft' ? 'Submit' : 'Close';
    }

    get primaryActionClass(): string {
        return this.isResponding ? 'bg-green-500' : 'bg-blue-500';
    }

    async onPrimaryAction() {
        if (this.isResponding) {
            await this.submitResponse();
        } else {
            this.navigationService.goBack();
        }
    }

    private async submitResponse() {
        try {
            const selectedMedicines = this.availableMedicines
                .filter(m => m.selected && m.quantity > 0)
                .map(m => ({
                    medicineId: m.id,
                    quantity: m.quantity
                }));

            if (selectedMedicines.length === 0) {
                // Show error
                return;
            }

            await this.exchangeService.updateExchangeStatus(
                this.exchange.id,
                'accepted'
            );

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error submitting response:', error);
        }
    }

    onCancel() {
        this.navigationService.goBack();
    }

    /**
     * Accept the exchange proposal
     */
    async onAccept() {
        try {
            const shouldAccept = await confirm({
                title: 'Accept Exchange',
                message: 'Are you sure you want to accept this exchange?',
                okButtonText: 'Accept',
                cancelButtonText: 'Cancel'
            });

            if (!shouldAccept) return;

            let success: boolean;
            if (this.useFirebase) {
                success = await this.exchangeFirebaseService.updateExchangeStatus(
                    this.exchange.id,
                    'accepted'
                );
            } else {
                success = await this.exchangeService.updateExchangeStatus(
                    this.exchange.id,
                    'accepted'
                );
            }

            if (success) {
                await alert({
                    title: 'Success',
                    message: 'Exchange accepted! QR codes are now available for pickup.',
                    okButtonText: 'OK'
                });
                // Reload to show QR codes
                await this.loadExchange(this.exchange.id);
            } else {
                await alert({
                    title: 'Error',
                    message: 'Failed to accept exchange. Please try again.',
                    okButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error accepting exchange:', error);
        }
    }

    /**
     * Reject the exchange proposal
     */
    async onReject() {
        try {
            const shouldReject = await confirm({
                title: 'Reject Exchange',
                message: 'Are you sure you want to reject this exchange?',
                okButtonText: 'Reject',
                cancelButtonText: 'Cancel'
            });

            if (!shouldReject) return;

            let success: boolean;
            if (this.useFirebase) {
                success = await this.exchangeFirebaseService.updateExchangeStatus(
                    this.exchange.id,
                    'rejected'
                );
            } else {
                success = await this.exchangeService.updateExchangeStatus(
                    this.exchange.id,
                    'rejected'
                );
            }

            if (success) {
                await alert({
                    title: 'Rejected',
                    message: 'Exchange has been rejected.',
                    okButtonText: 'OK'
                });
                this.navigationService.goBack();
            }
        } catch (error) {
            console.error('Error rejecting exchange:', error);
        }
    }

    /**
     * Open QR scanner for verification
     */
    onScanQR() {
        this.navigationService.navigate({
            moduleName: 'pages/shared/qr-scanner/qr-scanner-page'
        });
    }

    /**
     * Get status badge color
     */
    get statusColor(): string {
        switch (this.exchange?.status) {
            case 'pending': return '#3B82F6'; // blue
            case 'accepted': return '#10B981'; // green
            case 'rejected': return '#EF4444'; // red
            case 'in_transit': return '#F59E0B'; // amber
            case 'completed': return '#059669'; // emerald
            default: return '#6B7280'; // gray
        }
    }

    /**
     * Get formatted status text
     */
    get statusText(): string {
        const status = this.exchange?.status || 'unknown';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
}