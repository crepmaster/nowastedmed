import { Observable } from '@nativescript/core';
import { MedicineExchange } from '../../models/exchange/medicine-exchange.model';
import { ExchangeStorage } from '../storage/exchange.storage';

export class ExchangeService extends Observable {
    private static instance: ExchangeService;
    private exchangeStorage: ExchangeStorage;

    private constructor() {
        super();
        this.exchangeStorage = ExchangeStorage.getInstance();
    }

    static getInstance(): ExchangeService {
        if (!ExchangeService.instance) {
            ExchangeService.instance = new ExchangeService();
        }
        return ExchangeService.instance;
    }

    async getExchangesByPharmacy(pharmacyId: string): Promise<MedicineExchange[]> {
        const exchanges = this.exchangeStorage.loadExchanges();
        return exchanges.filter(e => 
            e.proposedBy === pharmacyId || e.proposedTo === pharmacyId
        );
    }

    async createExchange(exchange: Partial<MedicineExchange>): Promise<MedicineExchange> {
        const newExchange: MedicineExchange = {
            id: Date.now().toString(),
            status: 'pending',
            priority: exchange.priority || 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            proposedMedicines: exchange.proposedMedicines || [],
            offeredMedicines: [],
            proposedBy: exchange.proposedBy,
            proposedTo: '', // Empty for new exchanges
            notes: exchange.notes || ''
        };

        const exchanges = this.exchangeStorage.loadExchanges();
        exchanges.push(newExchange);
        this.exchangeStorage.saveExchanges(exchanges);

        return newExchange;
    }

    async updateExchangeStatus(exchangeId: string, status: string): Promise<boolean> {
        const exchanges = this.exchangeStorage.loadExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);
        
        if (!exchange) return false;

        exchange.status = status;
        exchange.updatedAt = new Date();
        
        this.exchangeStorage.saveExchanges(exchanges);
        return true;
    }
}