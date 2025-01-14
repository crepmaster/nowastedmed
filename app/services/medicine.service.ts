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

    clearAllMedicines(): void {
        this.medicines = [];
        this.notifyPropertyChange('medicines', this.medicines);
    }

    // ... rest of the existing methods ...
}