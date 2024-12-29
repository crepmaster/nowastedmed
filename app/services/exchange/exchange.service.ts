import { Observable } from '@nativescript/core';
import { 
    MedicineExchange, 
    ExchangeStatus, 
    MedicineExchangeItem,
    ExchangeProposal 
} from '../../models/exchange/medicine-exchange.model';
import { ExchangeValidationResult } from '../../models/exchange/exchange-validation.model';
import { ValidationService } from './validation.service';
import { ExchangeStorage } from '../storage/exchange.storage';

export class ExchangeService extends Observable {
    private static instance: ExchangeService;
    private validationService: ValidationService;
    private exchangeStorage: ExchangeStorage;
    private exchanges: MedicineExchange[] = [];

    private constructor() {
        super();
        this.validationService = ValidationService.getInstance();
        this.exchangeStorage = ExchangeStorage.getInstance();
        this.loadExchanges();
    }

    static getInstance(): ExchangeService {
        if (!ExchangeService.instance) {
            ExchangeService.instance = new ExchangeService();
        }
        return ExchangeService.instance;
    }

    private loadExchanges(): void {
        this.exchanges = this.exchangeStorage.loadExchanges();
    }

    private saveExchanges(): void {
        this.exchangeStorage.saveExchanges(this.exchanges);
    }

    async createExchange(exchange: Partial<MedicineExchange>): Promise<MedicineExchange> {
        const validation = await this.validationService.validateExchange(exchange);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const newExchange: MedicineExchange = {
            id: Date.now().toString(),
            status: 'pending',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            proposedMedicines: [],
            offeredMedicines: [],
            ...exchange
        };

        this.exchanges.push(newExchange);
        this.saveExchanges();
        return newExchange;
    }

    async getExchangesByPharmacy(pharmacyId: string): Promise<MedicineExchange[]> {
        return this.exchanges.filter(e => 
            e.proposedBy === pharmacyId || e.proposedTo === pharmacyId
        );
    }

    async getAvailableExchanges(currentPharmacyId: string): Promise<MedicineExchange[]> {
        return this.exchanges.filter(e => 
            e.status === 'pending' && 
            e.proposedBy !== currentPharmacyId && 
            !e.proposedTo
        );
    }

    async updateExchangeStatus(
        exchangeId: string, 
        status: ExchangeStatus,
        respondingPharmacyId?: string,
        notes?: string
    ): Promise<MedicineExchange> {
        const exchange = this.exchanges.find(e => e.id === exchangeId);
        if (!exchange) {
            throw new Error('Exchange not found');
        }

        exchange.status = status;
        exchange.updatedAt = new Date();
        
        if (respondingPharmacyId) {
            exchange.proposedTo = respondingPharmacyId;
        }
        
        if (notes) {
            exchange.notes = notes;
        }

        this.saveExchanges();
        return exchange;
    }
}