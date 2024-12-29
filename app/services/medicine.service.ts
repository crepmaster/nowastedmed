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
        console.log('Getting medicines for pharmacy:', pharmacyId);
        console.log('Current medicines:', this.medicines);
        return this.medicines.filter(m => m.pharmacyId === pharmacyId);
    }

    async addMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
        const newMedicine: Medicine = {
            id: Date.now().toString(),
            ...medicine,
            status: 'available'
        } as Medicine;
        
        this.medicines.push(newMedicine);
        console.log('Added new medicine:', newMedicine);
        console.log('Current medicines:', this.medicines);
        
        return newMedicine;
    }

    async createExchange(medicine: Medicine): Promise<Exchange> {
        console.log('Creating exchange for medicine:', medicine);
        
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const exchange: Exchange = {
            id: Date.now().toString(),
            medicineId: medicine.id,
            fromPharmacyId: user.id,
            toPharmacyId: '',
            status: 'pending',
            createdAt: new Date(),
            qrCode: '',
            medicineName: medicine.name, // Add medicine name for display
            fromPharmacyName: user.name, // Add pharmacy name for display
            quantity: medicine.quantity
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
        
        console.log('Created new exchange:', exchange);
        return exchange;
    }

    async getAvailableExchanges(currentPharmacyId: string): Promise<Exchange[]> {
        console.log('Getting available exchanges for pharmacy:', currentPharmacyId);
        const exchanges = this.exchangeStorage.loadExchanges();
        console.log('All exchanges:', exchanges);
        
        // Filter exchanges that are:
        // 1. In 'pending' status
        // 2. Not created by the current pharmacy
        // 3. Not yet accepted by another pharmacy
        const availableExchanges = exchanges.filter(e => 
            e.status === 'pending' && 
            e.fromPharmacyId !== currentPharmacyId &&
            !e.toPharmacyId
        );
        
        console.log('Available exchanges:', availableExchanges);
        return availableExchanges;
    }

    async requestExchange(exchangeId: string, toPharmacyId: string): Promise<boolean> {
        console.log('Requesting exchange:', exchangeId, 'for pharmacy:', toPharmacyId);
        
        const exchanges = this.exchangeStorage.loadExchanges();
        const exchange = exchanges.find(e => e.id === exchangeId);
        
        if (exchange) {
            exchange.status = 'accepted';
            exchange.toPharmacyId = toPharmacyId;
            this.exchangeStorage.saveExchanges(exchanges);
            
            // Update medicine status
            const medicine = this.medicines.find(m => m.id === exchange.medicineId);
            if (medicine) {
                medicine.status = 'exchanged';
            }
            
            console.log('Exchange updated:', exchange);
            return true;
        }
        return false;
    }
}