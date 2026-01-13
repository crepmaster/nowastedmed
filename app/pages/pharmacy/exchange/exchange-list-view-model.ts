import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeFirebaseService } from '../../../services/firebase/exchange-firebase.service';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';

export class ExchangeListViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeFirebaseService;
    private authSession: AuthSessionService;

    public exchanges: any[] = [];
    public filterIndex: number = 0;
    private currentUserCityId: string = '';

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeFirebaseService.getInstance();
        this.authSession = getAuthSessionService();

        this.loadExchanges();
    }

    async loadExchanges() {
        try {
            const user = this.authSession.currentUser;
            if (!user) return;

            // Get user's city for filtering available exchanges
            this.currentUserCityId = user.location?.cityId || '';

            // Load exchanges from Firebase
            const exchanges = await this.exchangeService.getExchangesByPharmacy(user.id);
            this.processExchanges(exchanges);
        } catch (error) {
            console.error('Error loading exchanges:', error);
        }
    }

    /**
     * Load available exchanges (only from same city)
     */
    async loadAvailableExchanges() {
        try {
            const user = this.authSession.currentUser;
            if (!user) return [];

            const cityId = user.location?.cityId;
            if (!cityId) {
                console.warn('User has no city set - cannot filter available exchanges');
                return [];
            }

            // Get only same-city pending exchanges
            return await this.exchangeService.getPendingExchangesByCity(cityId, user.id);
        } catch (error) {
            console.error('Error loading available exchanges:', error);
            return [];
        }
    }

    private processExchanges(exchanges: MedicineExchange[]) {
        const currentUser = this.authSession.currentUser;
        const processed = exchanges.map(exchange => ({
            ...exchange,
            title: this.getExchangeTitle(exchange),
            medicineCount: exchange.proposedMedicines.length,
            actionText: this.getActionText(exchange, currentUser?.id),
            actionClass: this.getActionClass(exchange.status)
        }));

        this.set('exchanges', this.filterExchanges(processed));
    }

    private filterExchanges(exchanges: any[]) {
        const currentUser = this.authSession.currentUser;
        switch (this.filterIndex) {
            case 0: // Available (IMPORTANT: Only show same-city exchanges)
                return exchanges.filter(e =>
                    e.status === 'pending' &&
                    e.proposedBy !== currentUser?.id &&
                    // Same city filter - mandatory for exchange discovery
                    (this.currentUserCityId === '' || e.location?.cityId === this.currentUserCityId)
                );
            case 1: // My Proposals
                return exchanges.filter(e => e.proposedBy === currentUser?.id);
            case 2: // Received
                return exchanges.filter(e => e.proposedTo === currentUser?.id);
            default:
                return exchanges;
        }
    }

    private getExchangeTitle(exchange: MedicineExchange): string {
        return `Exchange Request #${exchange.id.slice(-4)}`;
    }

    private getActionText(exchange: MedicineExchange, userId: string): string {
        if (exchange.proposedBy === userId) {
            return exchange.status === 'draft' ? 'Edit' : 'View';
        }
        return exchange.status === 'pending' ? 'Respond' : 'View';
    }

    private getActionClass(status: string): string {
        switch (status) {
            case 'pending':
                return 'bg-blue-500';
            case 'accepted':
                return 'bg-green-500';
            case 'rejected':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    }

    onExchangeAction(args: any) {
        const exchange = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-details-page',
            context: { exchangeId: exchange.id }
        });
    }
}