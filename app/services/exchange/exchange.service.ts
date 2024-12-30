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

    async createExchange(exchange: Partial<MedicineExchange>): Promise<MedicineExchange> {
        // For Flow 1: Making medicine available
        const newExchange: MedicineExchange = {
            id: Date.now().toString(),
            status: 'pending',
            priority: exchange.priority || 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            proposedMedicines: exchange.proposedMedicines || [],
            offeredMedicines: [],
            proposedBy: exchange.proposedBy,
            proposedTo: '', // Empty for Flow 1
            notes: exchange.notes || ''
        };

        const exchanges = this.exchangeStorage.loadExchanges();
        exchanges.push(newExchange);
        this.exchangeStorage.saveExchanges(exchanges);

        return newExchange;
    }

    async createProposal(exchangeId: string, proposingPharmacyId: string, offeredMedicines: any[]): Promise<boolean> {
        // For Flow 2: Creating a proposal
        const exchanges = this.exchangeStorage.loadExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);
        
        if (!exchange) {
            throw new Error('Exchange not found');
        }

        exchange.proposedTo = proposingPharmacyId;
        exchange.offeredMedicines = offeredMedicines;
        exchange.status = 'proposal_pending';
        exchange.updatedAt = new Date();

        this.exchangeStorage.saveExchanges(exchanges);
        return true;
    }

    async getAvailableExchanges(pharmacyId: string): Promise<MedicineExchange[]> {
        const exchanges = this.exchangeStorage.loadExchanges();
        return exchanges.filter(e => 
            e.status === 'pending' && 
            e.proposedBy !== pharmacyId &&
            !e.proposedTo // No proposal yet
        );
    }
}