import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { Medicine } from '../../../models/medicine.model';

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private refreshInterval: number;

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
        
        // Bind all methods to maintain correct 'this' context
        this.onMakeAvailable = this.onMakeAvailable.bind(this);
        this.onCreateProposal = this.onCreateProposal.bind(this);
        this.onAddMedicine = this.onAddMedicine.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.refreshData = this.refreshData.bind(this);
        
        // Initial data load
        this.loadData();
        
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
        await this.loadData();
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
            this.set('availableExchanges', availableMedicines);

            // Notify all changes
            this.notifyPropertyChange('medicines', this.medicines);
            this.notifyPropertyChange('availableExchanges', this.availableExchanges);
            this.notifyPropertyChange('stats', this.stats);
        } catch (error) {
            console.error('Error loading pharmacy data:', error);
        }
    }

    private updateStats(medicines: Medicine[]) {
        const newStats = {
            available: medicines.filter(m => m.status === 'available').length,
            pending: medicines.filter(m => m.status === 'pending').length,
            exchanged: medicines.filter(m => m.status === 'exchanged').length
        };
        
        this.stats = newStats;
        this.notifyPropertyChange('stats', this.stats);
    }

    onMakeAvailable(args: any) {
        console.log('Make Available clicked');
        const medicine = args.object.bindingContext;
        console.log('Medicine:', medicine);
        
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/create-exchange-page',
            context: { medicine }
        });
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
        });
    }

    onCreateProposal(args: any) {
        console.log('Create Proposal clicked');
        const exchange = args.object.bindingContext;
        console.log('Exchange:', exchange);
        
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-proposal-page',
            context: { exchange }
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