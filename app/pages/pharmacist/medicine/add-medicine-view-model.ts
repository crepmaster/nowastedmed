import { Observable } from '@nativescript/core';
import { MedicineService } from '../../../services/medicine.service';
import { AuthService } from '../../../services/auth.service';
import { Frame } from '@nativescript/core';

export class AddMedicineViewModel extends Observable {
    private medicineService: MedicineService;
    private authService: AuthService;

    public name: string = '';
    public batchNumber: string = '';
    public quantity: number = 0;
    public expiryDate: Date = new Date();
    public errorMessage: string = '';

    constructor() {
        super();
        this.medicineService = MedicineService.getInstance();
        this.authService = AuthService.getInstance();
    }

    async onAddMedicine() {
        try {
            if (!this.validateInput()) {
                return;
            }

            const user = this.authService.getCurrentUser();
            const medicine = await this.medicineService.addMedicine({
                name: this.name,
                batchNumber: this.batchNumber,
                quantity: this.quantity,
                expiryDate: this.expiryDate,
                pharmacyId: user.id
            });

            if (medicine) {
                Frame.topmost().goBack();
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            this.set('errorMessage', 'Failed to add medicine');
        }
    }

    private validateInput(): boolean {
        if (!this.name || !this.batchNumber || !this.quantity || !this.expiryDate) {
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