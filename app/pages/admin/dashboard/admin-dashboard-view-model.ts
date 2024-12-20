import { Observable } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { NavigationService } from '../../../services/navigation.service';
import { AdminStats } from '../../../models/admin.model';

export class AdminDashboardViewModel extends Observable {
    private adminService: AdminService;
    private navigationService: NavigationService;

    public stats: AdminStats = {
        totalPharmacies: 0,
        totalCouriers: 0,
        totalExchanges: 0,
        totalMedicines: 0,
        savingsAmount: 0
    };
    public selectedTabIndex: number = 0;

    constructor() {
        super();
        this.adminService = AdminService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.loadDashboardData();
    }

    get showAddPharmacy(): boolean {
        return this.stats.totalPharmacies === 0;
    }

    get showAddCourier(): boolean {
        return this.stats.totalCouriers === 0;
    }

    async loadDashboardData() {
        try {
            this.stats = await this.adminService.getStats();
            this.notifyPropertyChange('stats', this.stats);
            this.notifyPropertyChange('showAddPharmacy', this.showAddPharmacy);
            this.notifyPropertyChange('showAddCourier', this.showAddCourier);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    onAddPharmacy() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/pharmacies/pharmacy-form-page',
            context: { mode: 'create' }
        });
    }

    onAddCourier() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/couriers/courier-form-page',
            context: { mode: 'create' }
        });
    }

    onViewPharmacies() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/pharmacies/pharmacy-list-page'
        });
    }

    onViewCouriers() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/couriers/courier-list-page'
        });
    }

    onLogout() {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true,
            transition: {
                name: 'fade'
            }
        });
    }
}