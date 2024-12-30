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
        this.onMakeAvailable = this.onMakeAvailable.bind(this);
        this.onCreateProposal = this.onCreateProposal.bind(this);
        this.onAddMedicine = this.onAddMedicine.bind(this);
        
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            // Load medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);

            // Load available exchanges
            const exchanges = await this.medicineService.getAvailableExchanges(user.id);
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

    onMakeAvailable(args: any) {
        try {
            const medicine = args.object.bindingContext;
            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/exchange/create-exchange-page',
                context: { medicine }
            });
        } catch (error) {
            console.error('Error navigating to create exchange:', error);
        }
    }

    onCreateProposal(args: any) {
        try {
            const exchange = args.object.bindingContext;
            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/exchange/exchange-proposal-page',
                context: { exchange }
            });
        } catch (error) {
            console.error('Error navigating to create proposal:', error);
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