import { Observable } from '@nativescript/core';
import { Medicine, Exchange } from '../models/medicine.model';
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

    async getAllMedicines(): Promise<Medicine[]> {
        return this.medicines;
    }

    async getMedicinesByPharmacy(pharmacyId: string): Promise<Medicine[]> {
        return this.medicines.filter(m => m.pharmacyId === pharmacyId);
    }

    async getAvailableMedicinesForExchange(currentPharmacyId: string): Promise<Medicine[]> {
        const exchanges = this.exchangeStorage.loadExchanges();
        const availableMedicines = this.medicines.filter(m => 
            m.status === 'for_exchange' && 
            m.pharmacyId !== currentPharmacyId &&
            m.exchangeQuantity > 0
        );

        // Enrich medicines with pharmacy names
        return availableMedicines.map(medicine => {
            const exchange = exchanges.find(e => e.medicineId === medicine.id);
            return {
                ...medicine,
                pharmacyName: exchange?.fromPharmacyName || 'Unknown Pharmacy'
            };
        });
    }

    async addMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
        const newMedicine: Medicine = {
            id: Date.now().toString(),
            ...medicine,
            status: 'available',
            exchangeQuantity: 0
        } as Medicine;
        
        this.medicines.push(newMedicine);
        this.notifyPropertyChange('medicines', this.medicines);
        return newMedicine;
    }

    async makeAvailableForExchange(medicineId: string, quantity: number): Promise<boolean> {
        try {
            const medicine = this.medicines.find(m => m.id === medicineId);
            if (!medicine) {
                console.error('Medicine not found');
                return false;
            }

            if (quantity > medicine.quantity) {
                console.error('Exchange quantity exceeds available quantity');
                return false;
            }

            medicine.status = 'for_exchange';
            medicine.exchangeQuantity = quantity;
            
            this.notifyPropertyChange('medicines', this.medicines);
            return true;
        } catch (error) {
            console.error('Error making medicine available for exchange:', error);
            return false;
        }
    }

    async createExchange(medicine: Medicine, quantity: number, priority: string, notes: string): Promise<Exchange> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const exchange: Exchange = {
            id: Date.now().toString(),
            medicineId: medicine.id,
            fromPharmacyId: user.id,
            fromPharmacyName: user.name,
            status: 'pending',
            createdAt: new Date(),
            qrCode: '',
            medicineName: medicine.name,
            quantity: quantity
        };

        // Update medicine status
        const medicineToUpdate = this.medicines.find(m => m.id === medicine.id);
        if (medicineToUpdate) {
            medicineToUpdate.status = 'pending';
            medicineToUpdate.exchangeQuantity = quantity;
            this.notifyPropertyChange('medicines', this.medicines);
        }
        
        // Save exchange
        const exchanges = this.exchangeStorage.loadExchanges();
        exchanges.push(exchange);
        this.exchangeStorage.saveExchanges(exchanges);
        
        return exchange;
    }

    async getAvailableExchanges(currentPharmacyId: string): Promise<Exchange[]> {
        const exchanges = this.exchangeStorage.loadExchanges();
        return exchanges.filter(e => 
            e.status === 'pending' && 
            e.fromPharmacyId !== currentPharmacyId &&
            !e.toPharmacyId
        );
    }
}