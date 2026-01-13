import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeFirebaseService } from '../../../services/firebase/exchange-firebase.service';
import { ExchangeVerificationService } from '../../../services/exchange/exchange-verification.service';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { MedicineFirebaseService } from '../../../services/firebase/medicine-firebase.service';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';
import { action, alert, confirm } from '@nativescript/core/ui/dialogs';

export class ExchangeDetailsViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeFirebaseService;
    private verificationService: ExchangeVerificationService;
    private authSession: AuthSessionService;
    private medicineService: MedicineFirebaseService;

    public exchange: MedicineExchange;
    public availableMedicines: any[] = [];
    public isResponding: boolean = false;
    public isOwner: boolean = false;
    public canRespond: boolean = false;
    public hasProposal: boolean = false;
    public canDecide: boolean = false; // Requester can accept/reject when proposal received
    public canGenerateQR: boolean = false;
    public pickupQRCode: string = '';
    public deliveryQRCode: string = '';
    public isLoading: boolean = false;

    constructor(exchangeId: string) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeFirebaseService.getInstance();
        this.verificationService = ExchangeVerificationService.getInstance();
        this.authSession = getAuthSessionService();
        this.medicineService = MedicineFirebaseService.getInstance();

        this.loadExchange(exchangeId);
    }

    async loadExchange(exchangeId: string) {
        try {
            this.set('isLoading', true);
            const user = this.authSession.currentUser;
            if (!user) return;

            const exchange = await this.exchangeService.getExchangeById(exchangeId);

            if (exchange) {
                this.exchange = exchange;
                this.isOwner = exchange.proposedBy === user.id;

                // Check if user can respond to this exchange
                // For broadcast exchanges: proposedTo is empty and status is pending
                // For direct proposals: proposedTo matches user
                this.canRespond = this.shouldShowResponse(exchange, user.id);

                // Check if a proposal has already been submitted (proposedTo is set)
                this.hasProposal = !!exchange.proposedTo && exchange.proposedTo.length > 0;

                // isResponding: user is the recipient of a proposal (responder sees this)
                this.isResponding = exchange.proposedTo === user.id && exchange.status === 'pending';

                // canDecide: REQUESTER can accept/reject when a proposal has been received
                // Flow: Requester creates exchange → Responder submits proposal → Requester accepts/rejects
                this.canDecide = this.isOwner && this.hasProposal && exchange.status === 'pending';

                this.canGenerateQR = exchange.status === 'accepted';

                if (this.canRespond) {
                    await this.loadAvailableMedicines();
                }

                // Generate QR codes if exchange is accepted
                if (this.canGenerateQR) {
                    await this.generateQRCodes();
                }

                this.notifyPropertyChange('exchange', this.exchange);
                this.notifyPropertyChange('isResponding', this.isResponding);
                this.notifyPropertyChange('isOwner', this.isOwner);
                this.notifyPropertyChange('canRespond', this.canRespond);
                this.notifyPropertyChange('hasProposal', this.hasProposal);
                this.notifyPropertyChange('canDecide', this.canDecide);
                this.notifyPropertyChange('canGenerateQR', this.canGenerateQR);
            }
        } catch (error) {
            console.error('Error loading exchange:', error);
        } finally {
            this.set('isLoading', false);
        }
    }

    /**
     * Determine if user should see the response UI
     * - For broadcast exchanges (proposedTo empty): any pharmacy in same city can respond
     * - For direct proposals: only the proposedTo user can respond
     */
    private shouldShowResponse(exchange: MedicineExchange, userId: string): boolean {
        // Owner cannot respond to their own exchange
        if (exchange.proposedBy === userId) {
            return false;
        }

        // Only pending exchanges can receive responses
        if (exchange.status !== 'pending') {
            return false;
        }

        // Broadcast exchange: proposedTo is empty, anyone can respond
        if (!exchange.proposedTo || exchange.proposedTo === '') {
            return true;
        }

        // Direct proposal: only the recipient can respond
        return exchange.proposedTo === userId;
    }

    /**
     * Generate QR codes for pickup and delivery
     */
    private async generateQRCodes() {
        try {
            const user = this.authSession.currentUser;
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
        const user = this.authSession.currentUser;
        if (!user) return;

        const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
        this.availableMedicines = medicines.map(m => ({
            ...m,
            selected: false,
            offerQuantity: 0
        }));
        this.notifyPropertyChange('availableMedicines', this.availableMedicines);
    }

    get primaryActionText(): string {
        // Requester sees Accept/Reject when proposal received (check first)
        if (this.canDecide) {
            return 'Accept / Reject';
        }
        if (this.canRespond && !this.hasProposal) {
            return 'Submit Proposal';
        }
        if (this.isResponding) {
            return 'Accept / Reject';
        }
        return this.exchange?.status === 'draft' ? 'Submit' : 'Close';
    }

    get primaryActionClass(): string {
        if (this.canDecide || this.canRespond) {
            return 'bg-green-500';
        }
        return 'bg-blue-500';
    }

    async onPrimaryAction() {
        if (this.canDecide) {
            await this.promptDecision();
        } else if (this.canRespond && !this.hasProposal) {
            await this.submitProposal();
        } else {
            this.navigationService.goBack();
        }
    }

    /**
     * Prompt requester to accept or reject the proposal
     */
    private async promptDecision(): Promise<void> {
        const result = await action({
            title: 'Decision',
            message: 'Accept or reject this proposal?',
            cancelButtonText: 'Cancel',
            actions: ['Accept', 'Reject']
        });

        if (result === 'Accept') {
            await this.onAccept(true);
        } else if (result === 'Reject') {
            await this.onReject(true);
        }
    }

    /**
     * Submit a proposal for this exchange (responder action)
     * This creates a proposal and updates the exchange with proposedTo
     */
    private async submitProposal() {
        try {
            const selectedMedicines = this.availableMedicines
                .filter(m => m.selected && m.offerQuantity > 0)
                .map(m => ({
                    medicineId: m.id,
                    quantity: m.offerQuantity,
                    medicine: m
                }));

            if (selectedMedicines.length === 0) {
                await alert({
                    title: 'No Medicines Selected',
                    message: 'Please select at least one medicine to offer.',
                    okButtonText: 'OK'
                });
                return;
            }

            const user = this.authSession.currentUser;
            if (!user) return;

            // Create the proposal - this sets proposedTo and offeredMedicines
            await this.exchangeService.createProposal(
                this.exchange.id,
                user.id,
                selectedMedicines
            );

            await alert({
                title: 'Proposal Submitted',
                message: 'Your proposal has been sent to the requester.',
                okButtonText: 'OK'
            });

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error submitting proposal:', error);
            await alert({
                title: 'Error',
                message: 'Failed to submit proposal. Please try again.',
                okButtonText: 'OK'
            });
        }
    }

    onCancel() {
        this.navigationService.goBack();
    }

    /**
     * Accept the exchange proposal (requester action)
     * Uses acceptProposal to properly update both exchange and proposal
     * @param skipConfirm - Skip confirmation dialog (used when called from promptDecision)
     */
    async onAccept(skipConfirm: boolean = false) {
        try {
            if (!skipConfirm) {
                const shouldAccept = await confirm({
                    title: 'Accept Exchange',
                    message: 'Are you sure you want to accept this exchange proposal?',
                    okButtonText: 'Accept',
                    cancelButtonText: 'Cancel'
                });
                if (!shouldAccept) return;
            }

            // Use lastProposalId to accept the proposal and update exchange atomically
            const proposalId = this.exchange.lastProposalId;
            if (!proposalId) {
                await alert({
                    title: 'Error',
                    message: 'No proposal found to accept.',
                    okButtonText: 'OK'
                });
                return;
            }

            const success = await this.exchangeService.acceptProposal(
                this.exchange.id,
                proposalId
            );

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
     * Reject the exchange proposal (requester action)
     * Uses rejectProposal to properly update both exchange and proposal
     * @param skipConfirm - Skip confirmation dialog (used when called from promptDecision)
     */
    async onReject(skipConfirm: boolean = false) {
        try {
            if (!skipConfirm) {
                const shouldReject = await confirm({
                    title: 'Reject Exchange',
                    message: 'Are you sure you want to reject this proposal?',
                    okButtonText: 'Reject',
                    cancelButtonText: 'Cancel'
                });
                if (!shouldReject) return;
            }

            // Use lastProposalId to reject the proposal and update exchange atomically
            const proposalId = this.exchange.lastProposalId;
            if (!proposalId) {
                await alert({
                    title: 'Error',
                    message: 'No proposal found to reject.',
                    okButtonText: 'OK'
                });
                return;
            }

            const success = await this.exchangeService.rejectProposal(
                this.exchange.id,
                proposalId
            );

            if (success) {
                await alert({
                    title: 'Rejected',
                    message: 'Exchange proposal has been rejected.',
                    okButtonText: 'OK'
                });
                this.navigationService.goBack();
            } else {
                await alert({
                    title: 'Error',
                    message: 'Failed to reject exchange. Please try again.',
                    okButtonText: 'OK'
                });
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
