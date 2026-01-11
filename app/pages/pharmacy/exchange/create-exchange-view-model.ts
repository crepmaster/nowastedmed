import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeFirebaseService } from '../../../services/firebase/exchange-firebase.service';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { MedicineFirebaseService } from '../../../services/firebase/medicine-firebase.service';
import { Medicine } from '../../../models/medicine.model';

export class CreateExchangeViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeFirebaseService;
    private authService: AuthFirebaseService;
    private medicineService: MedicineFirebaseService;
    private medicine: Medicine;

    public exchangeQuantity: number = 0;
    public notes: string = '';
    public priorityLevels: string[] = ['Low', 'Medium', 'High'];
    public selectedPriorityIndex: number = 1;
    public errorMessage: string = '';

    constructor(medicine: Medicine) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();
        this.medicineService = MedicineFirebaseService.getInstance();
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

            // Validate user has location data BEFORE any mutations (required for exchanges)
            if (!user.location?.cityId) {
                this.set('errorMessage', 'Your pharmacy location is not set. Please update your profile.');
                return;
            }

            // Make the medicine available for exchange
            const success = await this.medicineService.makeAvailableForExchange(
                this.medicine.id,
                this.exchangeQuantity
            );

            if (!success) {
                this.set('errorMessage', 'Failed to make medicine available for exchange');
                return;
            }

            // Create the exchange record with location data
            await this.exchangeService.createExchange({
                proposedBy: user.id,
                proposedByName: user.pharmacyName || user.name,
                status: 'pending',
                priority: this.priorityLevels[this.selectedPriorityIndex].toLowerCase() as 'low' | 'medium' | 'high',
                proposedMedicines: [{
                    medicineId: this.medicine.id,
                    quantity: this.exchangeQuantity,
                    medicine: this.medicine
                }],
                offeredMedicines: [],
                notes: this.notes,
                location: {
                    countryCode: user.location.countryCode,
                    cityId: user.location.cityId,
                    cityName: user.location.cityName
                }
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