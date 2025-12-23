import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';

export class ExchangeProposalViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private authService: AuthService;
    private medicineService: MedicineService;

    public availableMedicine: any;
    public exchangeId: string;
    public myMedicines: any[] = [];
    public notes: string = '';
    public errorMessage: string = '';

    constructor(availableMedicine: any, exchangeId?: string) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();

        this.availableMedicine = availableMedicine;
        this.exchangeId = exchangeId || availableMedicine?.id;
        this.loadMyMedicines();
    }

    async loadMyMedicines() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('myMedicines', medicines.map(m => ({
                ...m,
                selected: false,
                offerQuantity: 0
            })));
        } catch (error) {
            console.error('Error loading medicines:', error);
            this.set('errorMessage', 'Failed to load medicines');
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
                    quantity: m.offerQuantity
                }));

            const user = this.authService.getCurrentUser();
            if (!user) return;

            await this.exchangeService.createProposal(
                this.availableMedicine.id,
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