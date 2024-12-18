import { Observable, ImageSource } from '@nativescript/core';
import { Medicine } from '../../../models/medicine.model';
import { MedicineService } from '../../../services/medicine.service';

export class CreateExchangeViewModel extends Observable {
    private medicineService: MedicineService;
    public medicine: Medicine;
    public qrCode: string = '';
    public qrCodeImage: ImageSource | null = null;
    public errorMessage: string = '';
    public isGenerating: boolean = false;

    constructor(medicine: Medicine) {
        super();
        this.medicineService = MedicineService.getInstance();
        this.medicine = medicine;
    }

    async onGenerateQR() {
        try {
            this.set('isGenerating', true);
            this.set('errorMessage', '');

            const exchange = await this.medicineService.createExchange(this.medicine.id);
            this.qrCode = exchange.qrCode;
            
            // Convert data URL to ImageSource
            if (this.qrCode.startsWith('data:image/png;base64,')) {
                const base64Data = this.qrCode.replace('data:image/png;base64,', '');
                this.qrCodeImage = await ImageSource.fromBase64(base64Data);
                this.notifyPropertyChange('qrCodeImage', this.qrCodeImage);
            }
            
            this.notifyPropertyChange('qrCode', this.qrCode);
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.set('errorMessage', 'Failed to generate QR code');
        } finally {
            this.set('isGenerating', false);
        }
    }
}