import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { Medicine } from '../../../models/medicine.model';

export class CreateExchangeViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private medicine: Medicine;

    public exchangeQuantity: number = 0;
    public notes: string = '';
    public priorityLevels: string[] = ['Low', 'Medium', 'High'];
    public selectedPriorityIndex: number = 1;
    public errorMessage: string = '';

    constructor(medicine: Medicine) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.medicine = medicine;

        // Bind methods
        this.onSubmit = this.onSubmit.bind(this);
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            // First update the medicine status and quantity
            const success = await this.medicineService.makeAvailableForExchange(
                this.medicine.id,
                this.exchangeQuantity
            );

            if (!success) {
                this.set('errorMessage', 'Failed to update medicine status');
                return;
            }

            // Then create the exchange record
            const exchange = await this.exchangeService.createExchange({
                proposedBy: user.id,
                status: 'pending',
                priority: this.priorityLevels[this.selectedPriorityIndex].toLowerCase(),
                proposedMedicines: [{
                    medicineId: this.medicine.id,
                    quantity: this.exchangeQuantity,
                    medicine: this.medicine
                }],
                offeredMedicines: [],
                notes: this.notes
            });

            if (!exchange) {
                this.set('errorMessage', 'Failed to create exchange');
                return;
            }

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error creating exchange:', error);
            this.set('errorMessage', 'Failed to create exchange');
        }
    }

    private validateForm(): boolean {
        if (!this.exchangeQuantity || this.exchangeQuantity <= 0) {
            this.set('errorMessage', 'Please enter a valid quantity');
            return false;
        }

        if (this.exchangeQuantity > this.medicine.quantity) {
            this.set('errorMessage', 'Exchange quantity cannot exceed available quantity');
            return false;
        }

        return true;
    }
}