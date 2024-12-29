import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';
import { Medicine } from '../../../models/medicine.model';

export class CreateExchangeViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private authService: AuthService;

    public medicine: Medicine;
    public exchangeQuantity: number = 0;
    public priorityLevels = ['Low', 'Medium', 'High'];
    public selectedPriorityIndex: number = 1;
    public notes: string = '';
    public errorMessage: string = '';

    constructor(medicine: Medicine) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicine = medicine;
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) {
                return;
            }

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User not authenticated');
                return;
            }

            const exchange = await this.exchangeService.createExchange({
                proposedBy: user.id,
                proposedTo: '', // Will be set when a pharmacy accepts
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

            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/exchange/exchange-list-page',
                clearHistory: true
            });
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