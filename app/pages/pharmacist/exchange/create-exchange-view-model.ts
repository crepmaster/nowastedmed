import { Observable, Frame } from '@nativescript/core';
import { Medicine } from '../../../models/medicine.model';
import { MedicineExchange } from '../../../models/exchange/medicine-exchange.model';
import { MedicineService } from '../../../services/medicine.service';
import { ExchangeService } from '../../../services/exchange/exchange.service';
import { AuthService } from '../../../services/auth.service';

export class CreateExchangeViewModel extends Observable {
    private medicineService: MedicineService;
    private exchangeService: ExchangeService;
    private authService: AuthService;
    private medicine: Medicine;

    public qrCode: string = '';
    public errorMessage: string = '';
    public isGenerating: boolean = false;
    public exchangeQuantity: number = 1;

    constructor(medicine?: Medicine) {
        super();
        this.medicineService = MedicineService.getInstance();
        this.exchangeService = ExchangeService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicine = medicine;
        if (medicine) {
            this.set('medicine', medicine);
        }
    }

    async onGenerateQR() {
        try {
            this.set('isGenerating', true);
            this.set('errorMessage', '');

            const user = this.authService.getCurrentUser();
            if (!user || !this.medicine) {
                this.set('errorMessage', 'Missing user or medicine');
                return;
            }

            // Create exchange record
            const exchange: MedicineExchange = {
                id: `exchange_${Date.now()}`,
                proposedBy: user.id,
                proposedTo: '',
                status: 'pending',
                priority: 'medium',
                proposedMedicines: [{
                    medicineId: this.medicine.id,
                    quantity: this.exchangeQuantity,
                    medicine: this.medicine
                }],
                offeredMedicines: [],
                createdAt: new Date(),
                updatedAt: new Date()
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

    onBack() {
        Frame.topmost().goBack();
    }
}