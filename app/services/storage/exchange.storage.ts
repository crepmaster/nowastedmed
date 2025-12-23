import { ApplicationSettings } from '@nativescript/core';
import { MedicineExchange } from '../../models/exchange/medicine-exchange.model';

export class ExchangeStorage {
    private static instance: ExchangeStorage;
    private readonly EXCHANGES_KEY = 'medicine_exchanges';

    static getInstance(): ExchangeStorage {
        if (!ExchangeStorage.instance) {
            ExchangeStorage.instance = new ExchangeStorage();
        }
        return ExchangeStorage.instance;
    }

    saveExchanges(exchanges: MedicineExchange[]): void {
        try {
            ApplicationSettings.setString(this.EXCHANGES_KEY, JSON.stringify(exchanges));
        } catch (error) {
            console.error('Error saving exchanges:', error);
        }
    }

    loadExchanges(): MedicineExchange[] {
        try {
            const exchangesJson = ApplicationSettings.getString(this.EXCHANGES_KEY);
            return exchangesJson ? JSON.parse(exchangesJson) : [];
        } catch (error) {
            console.error('Error loading exchanges:', error);
            return [];
        }
    }

    // Alias for loadExchanges for compatibility
    getExchanges(): MedicineExchange[] {
        return this.loadExchanges();
    }

    clearExchanges(): void {
        ApplicationSettings.remove(this.EXCHANGES_KEY);
    }
}