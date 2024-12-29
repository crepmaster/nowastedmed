import { Observable } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { AdminStats } from '../../../models/admin.model';

export class AdminDashboardViewModel extends Observable {
    private adminService: AdminService;
    private navigationService: NavigationService;
    private authService: AuthService;

    public stats: AdminStats = {
        totalPharmacies: 0,
        totalCouriers: 0,
        totalExchanges: 0,
        activeExchanges: 0,
        totalMedicines: 0,
        savingsAmount: 0
    };
    public selectedTabIndex: number = 0;

    constructor() {
        super();
        this.adminService = AdminService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.loadDashboardData();

        // Bind methods
        this.onViewPharmacies = this.onViewPharmacies.bind(this);
        this.onViewCouriers = this.onViewCouriers.bind(this);
        this.onAddCourier = this.onAddCourier.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.refreshData = this.refreshData.bind(this);
    }

    async loadDashboardData() {
        try {
            const users = this.authService.getRegisteredUsers();
            const pharmacies = users.filter(user => user.role === 'pharmacist');
            const couriers = users.filter(user => user.role === 'courier');
            
            this.set('stats', {
                ...this.stats,
                totalPharmacies: pharmacies.length,
                totalCouriers: couriers.length
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async refreshData() {
        await this.loadDashboardData();
    }

    get showAddPharmacy(): boolean {
        return this.stats.totalPharmacies === 0;
    }

    get showAddCourier(): boolean {
        return this.stats.totalCouriers === 0;
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
            clearHistory: true
        });
    }
}