import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';

export class ExchangeListViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private authService: AuthService;

    public exchanges: any[] = [];
    public filterIndex: number = 0;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();

        this.loadExchanges();
    }

    async loadExchanges() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            const exchanges = await this.exchangeService.getExchangesByPharmacy(user.id);
            this.processExchanges(exchanges);
        } catch (error) {
            console.error('Error loading exchanges:', error);
        }
    }

    private processExchanges(exchanges: MedicineExchange[]) {
        const currentUser = this.authService.getCurrentUser();
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
        const currentUser = this.authService.getCurrentUser();
        switch (this.filterIndex) {
            case 0: // Available
                return exchanges.filter(e => 
                    e.status === 'pending' && e.proposedBy !== currentUser?.id
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