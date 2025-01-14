import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { Medicine } from '../../../models/medicine.model';

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private exchangeService: ExchangeService;

    public medicines: Medicine[] = [];
    public availableExchanges: any[] = [];
    public myOffers: any[] = [];
    public myProposals: any[] = [];
    public selectedTabIndex: number = 0;
    public exchangeViewIndex: number = 0;
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
        
        // Bind methods
        this.onMakeAvailable = this.onMakeAvailable.bind(this);
        this.onCreateProposal = this.onCreateProposal.bind(this);
        this.onExchangeAction = this.onExchangeAction.bind(this);
        this.onAddMedicine = this.onAddMedicine.bind(this);
        
        this.loadData();
    }

    get currentExchangeView() {
        return this.exchangeViewIndex === 0 ? this.myOffers : this.myProposals;
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            // Load medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);

            // Load available exchanges
            const availableExchanges = await this.medicineService.getAvailableMedicinesForExchange(user.id);
            this.set('availableExchanges', availableExchanges);

            // Load my exchanges
            const myExchanges = await this.exchangeService.getExchangesByPharmacy(user.id);
            
            // Process offers (exchanges I created)
            this.set('myOffers', myExchanges
                .filter(e => e.proposedBy === user.id)
                .map(e => ({
                    ...e,
                    isOffer: true,
                    actionButtonText: e.status === 'pending' ? 'View Proposals' : 'View Details',
                    actionButtonClass: 'bg-blue-500 text-white p-2 rounded'
                }))
            );
            
            // Process proposals (exchanges sent to me)
            this.set('myProposals', myExchanges
                .filter(e => e.proposedTo === user.id)
                .map(e => ({
                    ...e,
                    isOffer: false,
                    actionButtonText: e.status === 'pending' ? 'View Details' : 'View',
                    actionButtonClass: 'bg-blue-500 text-white p-2 rounded'
                }))
            );

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

    onExchangeAction(args: any) {
        try {
            const exchange = args.object.bindingContext;
            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/exchange/exchange-details-page',
                context: { exchangeId: exchange.id }
            });
        } catch (error) {
            console.error('Error navigating to exchange details:', error);
        }
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
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