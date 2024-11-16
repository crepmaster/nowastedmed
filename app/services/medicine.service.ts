import { Observable } from '@nativescript/core';
import { Medicine, Exchange } from '../models/medicine.model';

export class MedicineService extends Observable {
    private static instance: MedicineService;
    private medicines: Medicine[] = [];
    private exchanges: Exchange[] = [];

    static getInstance(): MedicineService {
        if (!MedicineService.instance) {
            MedicineService.instance = new MedicineService();
        }
        return MedicineService.instance;
    }

    async getMedicinesByPharmacy(pharmacyId: string): Promise<Medicine[]> {
        // TODO: Implement API call
        return this.medicines.filter(m => m.pharmacyId === pharmacyId);
    }

    async getAvailableExchanges(): Promise<Exchange[]> {
        // TODO: Implement API call
        return this.exchanges.filter(e => e.status === 'pending');
    }

    async addMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
        // TODO: Implement API call
        const newMedicine: Medicine = {
            id: Date.now().toString(),
            ...medicine,
            status: 'available'
        } as Medicine;
        this.medicines.push(newMedicine);
        return newMedicine;
    }

    async createExchange(medicineId: string): Promise<Exchange> {
        // TODO: Implement API call
        const medicine = this.medicines.find(m => m.id === medicineId);
        if (!medicine) {
            throw new Error('Medicine not found');
        }

        const exchange: Exchange = {
            id: Date.now().toString(),
            medicineId,
            fromPharmacyId: medicine.pharmacyId,
            toPharmacyId: '',
            status: 'pending',
            createdAt: new Date(),
            qrCode: ''
        };

        this.exchanges.push(exchange);
        medicine.status = 'pending';
        return exchange;
    }

    async requestExchange(exchangeId: string): Promise<boolean> {
        // TODO: Implement API call
        const exchange = this.exchanges.find(e => e.id === exchangeId);
        if (exchange) {
            exchange.status = 'accepted';
            return true;
        }
        return false;
    }

    async generateQRCode(exchange: Exchange): Promise<string> {
        // Generate a unique QR code for the exchange
        const qrData = {
            exchangeId: exchange.id,
            medicineId: exchange.medicineId,
            timestamp: new Date().toISOString()
        };
        
        // In a real implementation, this would be encrypted and signed
        return JSON.stringify(qrData);
    }

    async verifyExchangeQR(qrCode: string): Promise<Exchange | null> {
        try {
            const data = JSON.parse(qrCode);
            return this.exchanges.find(e => e.id === data.exchangeId) || null;
        } catch {
            return null;
        }
    }
}