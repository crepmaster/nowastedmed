import { Observable } from '@nativescript/core';
import { Medicine } from '../models/medicine.model';
import { MedicineExchange } from '../models/exchange/medicine-exchange.model';
import { QRCodeUtil } from '../utils/qrcode.util';
import { ExchangeStorage } from './storage/exchange.storage';
import { AuthService } from './auth.service';

export class MedicineService extends Observable {
    private static instance: MedicineService;
    private medicines: Medicine[] = [];
    private exchangeStorage: ExchangeStorage;
    private qrCodeUtil: QRCodeUtil;
    private authService: AuthService;

    private constructor() {
        super();
        this.exchangeStorage = ExchangeStorage.getInstance();
        this.qrCodeUtil = QRCodeUtil.getInstance();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): MedicineService {
        if (!MedicineService.instance) {
            MedicineService.instance = new MedicineService();
        }
        return MedicineService.instance;
    }

    clearAllMedicines(): void {
        this.medicines = [];
        this.notifyPropertyChange('medicines', this.medicines);
    }

    async getAllMedicines(): Promise<Medicine[]> {
        return this.medicines;
    }

    async getMedicinesByPharmacy(pharmacyId: string): Promise<Medicine[]> {
        return this.medicines.filter(m => m.pharmacyId === pharmacyId);
    }

    async getAvailableExchanges(): Promise<MedicineExchange[]> {
        return this.exchangeStorage.getExchanges().filter(e => e.status === 'pending');
    }

    async getAvailableMedicinesForExchange(excludePharmacyId: string): Promise<Medicine[]> {
        return this.medicines.filter(m =>
            m.pharmacyId !== excludePharmacyId &&
            m.availableForExchange &&
            m.quantity > 0
        );
    }

    async addMedicine(medicineData: Partial<Medicine>): Promise<Medicine> {
        const medicine: Medicine = {
            id: `med_${Date.now()}`,
            name: medicineData.name || '',
            batchNumber: medicineData.batchNumber || '',
            quantity: medicineData.quantity || 0,
            expiryDate: medicineData.expiryDate || new Date(),
            pharmacyId: medicineData.pharmacyId || '',
            availableForExchange: medicineData.availableForExchange || false,
            category: medicineData.category || 'general',
            price: medicineData.price || 0
        };
        this.medicines.push(medicine);
        this.notifyPropertyChange('medicines', this.medicines);
        return medicine;
    }

    async makeAvailableForExchange(medicineId: string, quantity: number): Promise<boolean> {
        const medicine = this.medicines.find(m => m.id === medicineId);
        if (medicine && medicine.quantity >= quantity) {
            medicine.availableForExchange = true;
            medicine.exchangeQuantity = quantity;
            this.notifyPropertyChange('medicines', this.medicines);
            return true;
        }
        return false;
    }

    async requestExchange(exchangeId: string): Promise<boolean> {
        const exchanges = this.exchangeStorage.getExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);
        if (exchange) {
            exchange.status = 'requested';
            this.exchangeStorage.saveExchanges(exchanges);
            return true;
        }
        return false;
    }

    async generateQRCode(exchange: MedicineExchange): Promise<string> {
        return this.qrCodeUtil.generateQRCode(JSON.stringify(exchange));
    }
}
