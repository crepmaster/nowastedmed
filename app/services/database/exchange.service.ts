import { Observable } from '@nativescript/core';
import { Exchange } from '../../models/medicine.model';
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

    async getAllExchanges(): Promise<Exchange[]> {
        try {
            const exchanges = await this.medicineService.getAvailableExchanges();
            return exchanges;
        } catch (error) {
            console.error('Error getting exchanges:', error);
            return [];
        }
    }
}