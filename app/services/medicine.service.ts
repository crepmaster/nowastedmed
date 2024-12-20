import { Observable } from '@nativescript/core';
import { Medicine, Exchange } from '../models/medicine.model';
import { QRCodeUtil } from '../utils/qrcode.util';

export class MedicineService extends Observable {
    private static instance: MedicineService;
    private medicines: Medicine[] = [];
    private exchanges: Exchange[] = [];
    private qrCodeUtil: QRCodeUtil;

    private constructor() {
        super();
        this.qrCodeUtil = QRCodeUtil.getInstance();
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

    async getAvailableExchanges(): Promise<Exchange[]> {
        return this.exchanges.filter(e => e.status === 'pending');
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

    async createExchange(medicineId: string): Promise<Exchange> {
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

        // Generate QR code
        const qrData = await this.qrCodeUtil.generateQRCode({
            exchangeId: exchange.id,
            medicineId: exchange.medicineId,
            fromPharmacyId: exchange.fromPharmacyId,
            timestamp: exchange.createdAt.toISOString()
        });
        
        exchange.qrCode = qrData;
        this.exchanges.push(exchange);
        medicine.status = 'pending';
        
        return exchange;
    }

    async requestExchange(exchangeId: string): Promise<boolean> {
        const exchange = this.exchanges.find(e => e.id === exchangeId);
        if (exchange) {
            exchange.status = 'accepted';
            return true;
        }
        return false;
    }

    async verifyExchangeQR(qrCode: string): Promise<Exchange | null> {
        try {
            const data = JSON.parse(qrCode);
            const exchange = this.exchanges.find(e => e.id === data.exchangeId);
            
            if (!exchange) {
                return null;
            }

            // Verify timestamp is within 24 hours
            const timestamp = new Date(data.timestamp);
            const now = new Date();
            const timeDiff = now.getTime() - timestamp.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return null;
            }

            return exchange;
        } catch (error) {
            console.error('Error verifying QR code:', error);
            return null;
        }
    }
}