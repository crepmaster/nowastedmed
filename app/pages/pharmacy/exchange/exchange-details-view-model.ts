import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';

export class ExchangeDetailsViewModel extends Observable {
    private navigationService: NavigationService;
    private exchangeService: ExchangeService;
    private authService: AuthService;
    private medicineService: MedicineService;

    public exchange: MedicineExchange;
    public availableMedicines: any[] = [];
    public isResponding: boolean = false;

    constructor(exchangeId: string) {
        super();
        this.navigationService = NavigationService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();

        this.loadExchange(exchangeId);
    }

    async loadExchange(exchangeId: string) {
        try {
            const exchanges = await this.exchangeService.getExchangesByPharmacy(
                this.authService.getCurrentUser()?.id
            );
            const exchange = exchanges.find(e => e.id === exchangeId);
            
            if (exchange) {
                this.exchange = exchange;
                this.isResponding = this.shouldShowResponse(exchange);
                
                if (this.isResponding) {
                    await this.loadAvailableMedicines();
                }

                this.notifyPropertyChange('exchange', this.exchange);
                this.notifyPropertyChange('isResponding', this.isResponding);
            }
        } catch (error) {
            console.error('Error loading exchange:', error);
        }
    }

    private async loadAvailableMedicines() {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
        this.availableMedicines = medicines.map(m => ({
            ...m,
            selected: false,
            quantity: 0
        }));
        this.notifyPropertyChange('availableMedicines', this.availableMedicines);
    }

    private shouldShowResponse(exchange: MedicineExchange): boolean {
        const user = this.authService.getCurrentUser();
        return exchange.status === 'pending' && 
               exchange.proposedTo === user?.id;
    }

    get primaryActionText(): string {
        if (this.isResponding) {
            return 'Submit Response';
        }
        return this.exchange?.status === 'draft' ? 'Submit' : 'Close';
    }

    get primaryActionClass(): string {
        return this.isResponding ? 'bg-green-500' : 'bg-blue-500';
    }

    async onPrimaryAction() {
        if (this.isResponding) {
            await this.submitResponse();
        } else {
            this.navigationService.goBack();
        }
    }

    private async submitResponse() {
        try {
            const selectedMedicines = this.availableMedicines
                .filter(m => m.selected && m.quantity > 0)
                .map(m => ({
                    medicineId: m.id,
                    quantity: m.quantity
                }));

            if (selectedMedicines.length === 0) {
                // Show error
                return;
            }

            await this.exchangeService.updateExchangeStatus(
                this.exchange.id,
                'accepted'
            );

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error submitting response:', error);
        }
    }

    onCancel() {
        this.navigationService.goBack();
    }
}