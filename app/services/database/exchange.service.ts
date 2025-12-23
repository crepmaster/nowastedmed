import { Observable } from '@nativescript/core';
import { MedicineExchange } from '../../models/exchange/medicine-exchange.model';
import { MedicineService } from '../medicine.service';

export class ExchangeDatabaseService extends Observable {
    private static instance: ExchangeDatabaseService;
    private medicineService: MedicineService;
    
    private constructor() {
        super();
        this.medicineService = MedicineService.getInstance();
    }

    static getInstance(): ExchangeDatabaseService {
        if (!ExchangeDatabaseService.instance) {
            ExchangeDatabaseService.instance = new ExchangeDatabaseService();
        }
        return ExchangeDatabaseService.instance;
    }

    async getAllExchanges(): Promise<MedicineExchange[]> {
        try {
            const exchanges = await this.medicineService.getAvailableExchanges();
            return exchanges;
        } catch (error) {
            console.error('Error getting exchanges:', error);
            return [];
        }
    }
}