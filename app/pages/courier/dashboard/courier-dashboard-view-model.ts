import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { QRCodeUtil } from '../../../utils/qrcode.util';

export class CourierDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private qrCodeUtil: QRCodeUtil;

    public stats = {
        pending: 0,
        inTransit: 0,
        delivered: 0
    };

    public activeDeliveries = [];
    public deliveryHistory = [];
    public selectedTabIndex = 0;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.qrCodeUtil = QRCodeUtil.getInstance();

        // Initialize with demo data
        this.loadDemoData();
    }

    private loadDemoData() {
        // Demo active deliveries
        this.set('activeDeliveries', [
            {
                id: '1',
                medicineName: 'Aspirin 100mg',
                fromPharmacy: 'PharmaCare Central',
                toPharmacy: 'MediLife Plus',
                status: 'pending'
            },
            {
                id: '2',
                medicineName: 'Amoxicillin 500mg',
                fromPharmacy: 'HealthHub Pharmacy',
                toPharmacy: 'CarePlus Drugstore',
                status: 'in_transit'
            }
        ]);

        // Demo delivery history
        this.set('deliveryHistory', [
            {
                id: '3',
                medicineName: 'Ibuprofen 400mg',
                fromPharmacy: 'MediCare Plus',
                toPharmacy: 'LifeCare Pharmacy',
                completedAt: new Date(Date.now() - 86400000) // Yesterday
            }
        ]);

        // Update stats
        this.updateStats();
    }

    private updateStats() {
        this.stats.pending = this.activeDeliveries.filter(d => d.status === 'pending').length;
        this.stats.inTransit = this.activeDeliveries.filter(d => d.status === 'in_transit').length;
        this.stats.delivered = this.deliveryHistory.length;
        this.notifyPropertyChange('stats', this.stats);
    }

    async onDeliveryAction(args: any) {
        const delivery = args.object.bindingContext;
        if (delivery.status === 'pending') {
            delivery.status = 'in_transit';
        } else if (delivery.status === 'in_transit') {
            // Move to history
            this.activeDeliveries = this.activeDeliveries.filter(d => d.id !== delivery.id);
            this.deliveryHistory.unshift({
                ...delivery,
                completedAt: new Date()
            });
        }
        this.updateStats();
        this.notifyPropertyChange('activeDeliveries', this.activeDeliveries);
        this.notifyPropertyChange('deliveryHistory', this.deliveryHistory);
    }

    async onScanQR() {
        try {
            const qrData = await this.qrCodeUtil.scanQRCode();
            // Handle QR code data
            console.log('QR code scanned:', qrData);
        } catch (error) {
            console.error('Error scanning QR code:', error);
        }
    }

    onLogout() {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}