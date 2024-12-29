import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { Medicine } from '../../../models/medicine.model';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private exchangeService: ExchangeService;

    public medicines: Medicine[] = [];
    public activeExchanges: any[] = [];
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
        this.exchangeService = ExchangeService.getInstance();
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            // Load medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);

            // Load exchanges
            const exchanges = await this.exchangeService.getExchangesByPharmacy(user.id);
            const processedExchanges = exchanges.map(exchange => ({
                ...exchange,
                title: `Exchange #${exchange.id.slice(-4)}`,
                statusColor: this.getStatusColor(exchange.status)
            }));
            this.set('activeExchanges', processedExchanges);

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

    private getStatusColor(status: string): string {
        switch (status) {
            case 'pending': return '#f97316';
            case 'accepted': return '#22c55e';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
        });
    }

    onExchangeMedicine(args: any) {
        const medicine = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-details-page',
            context: { 
                mode: 'create',
                medicineId: medicine.id
            }
        });
    }

    onViewExchanges() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-list-page'
        });
    }

    onViewExchange(args: any) {
        const exchange = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-details-page',
            context: { exchangeId: exchange.id }
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