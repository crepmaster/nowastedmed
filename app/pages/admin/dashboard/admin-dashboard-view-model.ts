import { Observable } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { AdminStats } from '../../../models/admin.model';

export class AdminDashboardViewModel extends Observable {
    private adminService: AdminService;
    private navigationService: NavigationService;
    private authService: AuthService;
    private refreshInterval: ReturnType<typeof setInterval>;

    public stats: AdminStats;
    public selectedTabIndex: number = 0;

    constructor() {
        super();
        this.adminService = AdminService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        
        // Initialize stats
        this.stats = this.adminService.getStats();
        
        // Bind methods
        this.onViewPharmacies = this.onViewPharmacies.bind(this);
        this.onViewCouriers = this.onViewCouriers.bind(this);
        this.onAddCourier = this.onAddCourier.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.refreshData = this.refreshData.bind(this);

        // Set up auto-refresh
        this.startAutoRefresh();
    }

    private startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    async refreshData() {
        await this.adminService.refreshStats();
        this.stats = this.adminService.getStats();
        this.notifyPropertyChange('stats', this.stats);
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
        // Clear the refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}