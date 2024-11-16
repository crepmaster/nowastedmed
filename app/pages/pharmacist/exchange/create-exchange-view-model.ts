import { Observable, ImageSource } from '@nativescript/core';
import { Medicine } from '../../../models/medicine.model';
import { MedicineService } from '../../../services/medicine.service';
import * as qrcode from 'qrcode';

export class CreateExchangeViewModel extends Observable {
    private medicineService: MedicineService;
    public medicine: Medicine;
    public qrCode: string = '';
    public qrCodeImage: ImageSource | null = null;
    public errorMessage: string = '';

    constructor(medicine: Medicine) {
        super();
        this.medicineService = MedicineService.getInstance();
        this.medicine = medicine;
    }

    async onGenerateQR() {
        try {
            const exchange = await this.medicineService.createExchange(this.medicine.id);
            this.qrCode = await this.medicineService.generateQRCode(exchange);
            
            // Generate QR code image
            const qrImageData = await qrcode.toDataURL(this.qrCode);
            this.qrCodeImage = await ImageSource.fromBase64(qrImageData.split(',')[1]);
            
            this.notifyPropertyChange('qrCode', this.qrCode);
            this.notifyPropertyChange('qrCodeImage', this.qrCodeImage);
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.set('errorMessage', 'Failed to generate QR code');
        }
    }
}