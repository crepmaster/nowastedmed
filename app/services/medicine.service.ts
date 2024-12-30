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

    async addMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
        const newMedicine: Medicine = {
            id: Date.now().toString(),
            ...medicine,
            status: 'available'
        } as Medicine;
        
        this.medicines.push(newMedicine);
        return newMedicine;
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
            toPharmacyId: '',
            status: 'pending',
            createdAt: new Date(),
            qrCode: '',
            priority: priority,
            notes: notes,
            proposedMedicines: [{
                medicineId: medicine.id,
                quantity: quantity,
                medicine: medicine
            }]
        };

        // Update medicine status
        const medicineToUpdate = this.medicines.find(m => m.id === medicine.id);
        if (medicineToUpdate) {
            medicineToUpdate.status = 'pending';
        }
        
        // Save exchange
        const exchanges = this.exchangeStorage.loadExchanges();
        exchanges.push(exchange);
        this.exchangeStorage.saveExchanges(exchanges);
        
        return exchange;
    }

    async getAvailableExchanges(currentPharmacyId: string): Promise<Exchange[]> {
        const exchanges = this.exchangeStorage.loadExchanges();
        
        // Filter exchanges that are:
        // 1. In 'pending' status
        // 2. Not created by the current pharmacy
        // 3. Not yet accepted by another pharmacy
        return exchanges.filter(e => 
            e.status === 'pending' && 
            e.fromPharmacyId !== currentPharmacyId &&
            !e.toPharmacyId
        );
    }
}