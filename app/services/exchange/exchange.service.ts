import { Observable } from '@nativescript/core';
import { MedicineExchange, ExchangeStatus, ExchangeProposal, MedicineExchangeItem } from '../../models/exchange/medicine-exchange.model';
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

    async updateExchangeStatus(exchangeId: string, status: ExchangeStatus): Promise<boolean> {
        const exchanges = this.exchangeStorage.loadExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);

        if (!exchange) return false;

        exchange.status = status;
        exchange.updatedAt = new Date();

        this.exchangeStorage.saveExchanges(exchanges);
        return true;
    }

    async createProposal(exchangeId: string, proposedBy: string, medicines: MedicineExchangeItem[]): Promise<ExchangeProposal> {
        const proposal: ExchangeProposal = {
            id: `proposal_${Date.now()}`,
            exchangeId,
            proposedBy,
            medicines,
            status: 'pending',
            createdAt: new Date()
        };

        // Update the exchange with the offered medicines
        const exchanges = this.exchangeStorage.loadExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);
        if (exchange) {
            exchange.offeredMedicines = medicines;
            exchange.proposedTo = proposedBy;
            exchange.updatedAt = new Date();
            this.exchangeStorage.saveExchanges(exchanges);
        }

        return proposal;
    }

    async getExchangeById(exchangeId: string): Promise<MedicineExchange | undefined> {
        const exchanges = this.exchangeStorage.loadExchanges();
        return exchanges.find(e => e.id === exchangeId);
    }
}