import { Observable, Frame } from '@nativescript/core';
import { Medicine } from '../../../models/medicine.model';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';

export class DashboardViewModel extends Observable {
    private authService: AuthService;
    private medicineService: MedicineService;

    public medicines: Medicine[] = [];
    public availableExchanges: MedicineExchange[] = [];
    public selectedTabIndex: number = 0;

    public availableCount: number = 0;
    public pendingCount: number = 0;
    public exchangedCount: number = 0;

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            this.medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.availableExchanges = await this.medicineService.getAvailableExchanges();

            this.updateCounts();
            this.notifyPropertyChange('medicines', this.medicines);
            this.notifyPropertyChange('availableExchanges', this.availableExchanges);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    private updateCounts() {
        this.availableCount = this.medicines.filter(m => m.status === 'available').length;
        this.pendingCount = this.medicines.filter(m => m.status === 'pending').length;
        this.exchangedCount = this.medicines.filter(m => m.status === 'exchanged').length;

        this.notifyPropertyChange('availableCount', this.availableCount);
        this.notifyPropertyChange('pendingCount', this.pendingCount);
        this.notifyPropertyChange('exchangedCount', this.exchangedCount);
    }

    onAddMedicine() {
        Frame.topmost().navigate({
            moduleName: 'pages/pharmacist/medicine/add-medicine-page'
        });
    }

    onExchangeMedicine(args: any) {
        const medicine = args.object.bindingContext;
        Frame.topmost().navigate({
            moduleName: 'pages/pharmacist/exchange/create-exchange-page',
            context: { medicine }
        });
    }

    async onRequestExchange(args: any) {
        const exchange = args.object.bindingContext;
        await this.medicineService.requestExchange(exchange.id);
        await this.loadData();
    }

    onLogout() {
        try {
            this.authService.logout();
            Frame.topmost().navigate({
                moduleName: 'pages/login/login-page',
                clearHistory: true,
                transition: {
                    name: 'fade'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}