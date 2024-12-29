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
    public availableExchanges: any[] = [];
    public selectedTabIndex: number = 0;
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
        
        // Bind methods
        this.onExchangeMedicine = this.onExchangeMedicine.bind(this);
        this.onRequestExchange = this.onRequestExchange.bind(this);
        this.onAddMedicine = this.onAddMedicine.bind(this);
        
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            console.log('Loading data for user:', user.id);

            // Load medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            console.log('Loaded medicines:', medicines);
            this.set('medicines', medicines);

            // Load available exchanges
            const exchanges = await this.medicineService.getAvailableExchanges(user.id);
            console.log('Loaded exchanges:', exchanges);
            this.set('availableExchanges', exchanges);

            // Update stats
            this.updateStats(medicines);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
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
        try {
            const medicine = args.object.bindingContext;
            console.log('Creating exchange for medicine:', medicine);
            
            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/exchange/create-exchange-page',
                context: { medicine }
            });
        } catch (error) {
            console.error('Error navigating to create exchange:', error);
        }
    }

    async onRequestExchange(args: any) {
        try {
            const exchange = args.object.bindingContext;
            const user = this.authService.getCurrentUser();
            
            if (!user) return;

            await this.medicineService.requestExchange(exchange.id, user.id);
            await this.loadData(); // Refresh data
        } catch (error) {
            console.error('Error requesting exchange:', error);
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