import { Observable } from '@nativescript/core';
import { MedicineService } from '../../../services/medicine.service';

export class CreateExchangeViewModel extends Observable {
    private medicineService: MedicineService;
    public qrCode: string = '';
    public errorMessage: string = '';
    public isGenerating: boolean = false;

    constructor() {
        super();
        this.medicineService = MedicineService.getInstance();
    }

    async onGenerateQR() {
        try {
            this.set('isGenerating', true);
            this.set('errorMessage', '');

            // Create a sample exchange object
            const exchange = {
                id: Date.now().toString(),
                medicineId: 'sample-medicine-id',
                fromPharmacyId: 'sample-pharmacy-id',
                timestamp: new Date().toISOString()
            };

            // Generate QR code
            const qrCodeDataUrl = await this.medicineService.generateQRCode(exchange);
            this.set('qrCode', qrCodeDataUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.set('errorMessage', 'Failed to generate QR code');
        } finally {
            this.set('isGenerating', false);
        }
    }
}