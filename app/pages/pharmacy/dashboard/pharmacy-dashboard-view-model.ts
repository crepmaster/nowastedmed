import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { Medicine } from '../../../models/medicine.model';

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    
    public medicines: Medicine[] = [];

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.loadMedicines();
    }

    async loadMedicines() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;
            
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);
        } catch (error) {
            console.error('Error loading medicines:', error);
        }
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
        });
    }

    async onRemoveMedicine(args: any) {
        try {
            const medicine = args.object.bindingContext;
            // Remove medicine logic here
            await this.loadMedicines(); // Refresh list
        } catch (error) {
            console.error('Error removing medicine:', error);
        }
    }

    onLogout() {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}