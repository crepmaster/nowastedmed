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

        // Set medicine as observable property
        this.set('medicine', medicine);
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            // First make the medicine available for exchange
            const success = await this.medicineService.makeAvailableForExchange(
                this.medicine.id,
                this.exchangeQuantity
            );

            if (!success) {
                this.set('errorMessage', 'Failed to make medicine available for exchange');
                return;
            }

            // Create the exchange record
            await this.exchangeService.createExchange({
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

            // Navigate back to dashboard
            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Error making medicine available:', error);
            this.set('errorMessage', 'Failed to make medicine available');
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