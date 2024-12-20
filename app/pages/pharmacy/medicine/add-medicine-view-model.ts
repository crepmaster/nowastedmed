import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';

export class AddMedicineViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;

    public name: string = '';
    public expiryDate: Date = new Date();
    public quantity: number = 0;
    public errorMessage: string = '';

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            await this.medicineService.addMedicine({
                name: this.name,
                expiryDate: this.expiryDate,
                quantity: this.quantity,
                pharmacyId: user.id,
                status: 'available'
            });

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error adding medicine:', error);
            this.set('errorMessage', 'Failed to add medicine');
        }
    }

    private validateForm(): boolean {
        if (!this.name || !this.quantity) {
            this.set('errorMessage', 'Please fill in all fields');
            return false;
        }

        if (this.quantity <= 0) {
            this.set('errorMessage', 'Quantity must be greater than 0');
            return false;
        }

        if (this.expiryDate < new Date()) {
            this.set('errorMessage', 'Expiry date must be in the future');
            return false;
        }

        return true;
    }
}