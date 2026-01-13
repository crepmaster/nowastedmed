import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeFirebaseService } from '../../../services/firebase/exchange-firebase.service';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { MedicineFirebaseService } from '../../../services/firebase/medicine-firebase.service';

export class ExchangeProposalViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeFirebaseService;
    private authSession: AuthSessionService;
    private medicineService: MedicineFirebaseService;

    public exchange: any;
    public exchangeId: string;
    public myMedicines: any[] = [];
    public notes: string = '';
    public errorMessage: string = '';
    public isLoading: boolean = false;

    constructor(exchange: any, exchangeId?: string) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeFirebaseService.getInstance();
        this.authSession = getAuthSessionService();
        this.medicineService = MedicineFirebaseService.getInstance();

        this.exchange = exchange;
        // Use explicit exchangeId, fallback to exchange.id (the exchange document ID)
        this.exchangeId = exchangeId || exchange?.id;

        if (!this.exchangeId) {
            console.error('ExchangeProposalViewModel: No exchangeId provided');
            this.set('errorMessage', 'Invalid exchange reference');
            return;
        }

        this.loadMyMedicines();
    }

    async loadMyMedicines() {
        try {
            this.set('isLoading', true);
            const user = this.authSession.currentUser;
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('myMedicines', medicines.map(m => ({
                ...m,
                selected: false,
                offerQuantity: 0
            })));
        } catch (error) {
            console.error('Error loading medicines:', error);
            this.set('errorMessage', 'Failed to load medicines');
        } finally {
            this.set('isLoading', false);
        }
    }

    async onSubmitProposal() {
        try {
            if (!this.validateProposal()) {
                return;
            }

            const selectedMedicines = this.myMedicines
                .filter(m => m.selected && m.offerQuantity > 0)
                .map(m => ({
                    medicineId: m.id,
                    quantity: m.offerQuantity,
                    medicine: m
                }));

            const user = this.authSession.currentUser;
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            // Use the correct exchangeId (document ID), not medicine ID
            await this.exchangeService.createProposal(
                this.exchangeId,
                user.id,
                selectedMedicines
            );

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error submitting proposal:', error);
            this.set('errorMessage', 'Failed to submit proposal');
        }
    }

    private validateProposal(): boolean {
        const selectedMedicines = this.myMedicines.filter(m => m.selected);
        
        if (selectedMedicines.length === 0) {
            this.set('errorMessage', 'Please select at least one medicine to offer');
            return false;
        }

        for (const medicine of selectedMedicines) {
            if (!medicine.offerQuantity || medicine.offerQuantity <= 0) {
                this.set('errorMessage', 'Please enter valid quantities for selected medicines');
                return false;
            }
            if (medicine.offerQuantity > medicine.quantity) {
                this.set('errorMessage', `Cannot offer more than available quantity for ${medicine.name}`);
                return false;
            }
        }

        return true;
    }
}