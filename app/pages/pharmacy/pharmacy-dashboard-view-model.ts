import { Observable } from '@nativescript/core';
import { Medicine } from '../../models/medicine.model';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { MedicineService } from '../../services/medicine.service';

export class PharmacyDashboardViewModel extends Observable {
    public availableMedicines: Medicine[] = [];
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                console.error('No user found');
                return;
            }

            // Load my medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);
            this.updateStats(medicines);

            // Load available medicines from other pharmacies
            const availableMedicines = await this.medicineService.getAvailableMedicinesForExchange(user.id);
            this.set('availableMedicines', availableMedicines);
        } catch (error) {
            console.error('Error loading pharmacy data:', error);
        }
    }

    updateStats(medicines: Medicine[]) {
        const totalMedicines = medicines.length;
        const expiringSoon = medicines.filter(m => {
            const expiryDate = new Date(m.expiryDate);
            const now = new Date();
            const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays > 0;
        }).length;

        this.set('totalMedicines', totalMedicines);
        this.set('expiringSoon', expiringSoon);
    }

    async onRequestExchange(args: any) {
        const medicine = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/create-exchange-page',
            context: { medicine, isRequest: true }
        });
    }
}
