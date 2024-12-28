import { Observable } from '@nativescript/core';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { Medicine } from '../../models/medicine.model';
import { MedicineService } from '../../services/medicine.service';

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;

    public medicines: Medicine[] = [];
    public stats = {
        available: 0,
        pending: 0,
        exchanged: 0
    };

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

            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);
            this.updateStats(medicines);
        } catch (error) {
            console.error('Error loading pharmacy data:', error);
        }
    }

    private updateStats(medicines: Medicine[]) {
        this.stats.available = medicines.filter(m => m.status === 'available').length;
        this.stats.pending = medicines.filter(m => m.status === 'pending').length;
        this.stats.exchanged = medicines.filter(m => m.status === 'exchanged').length;
        this.notifyPropertyChange('stats', this.stats);
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
        });
    }

    onExchangeMedicine(args: any) {
        const medicine = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/create-exchange-page',
            context: { medicine }
        });
    }

    onLogout() {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}