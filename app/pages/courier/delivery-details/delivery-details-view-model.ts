import { Observable, Frame, Dialogs, Utils } from '@nativescript/core';
import { DeliveryFirebaseService } from '../../../services/firebase/delivery-firebase.service';
import { CourierEarningsFirebaseService } from '../../../services/firebase/courier-earnings-firebase.service';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { QRCodeUtil } from '../../../utils/qrcode.util';
import { Delivery, DeliveryStatusChange, CourierEarning } from '../../../models/delivery.model';

interface StatusHistoryItem {
    status: string;
    statusLabel: string;
    timestamp: Date;
    timestampFormatted: string;
    note?: string;
    isLast: boolean;
}

export class DeliveryDetailsViewModel extends Observable {
    private deliveryService: DeliveryFirebaseService;
    private earningsService: CourierEarningsFirebaseService;
    private authService: AuthFirebaseService;
    private qrCodeUtil: QRCodeUtil;
    private unsubscribe: (() => void) | null = null;

    private _delivery: Delivery | null = null;
    private _earning: CourierEarning | null = null;
    private _isLoading: boolean = true;
    private _statusHistory: StatusHistoryItem[] = [];
    private currentUserId: string = '';

    constructor(private deliveryId: string) {
        super();
        this.deliveryService = DeliveryFirebaseService.getInstance();
        this.earningsService = CourierEarningsFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();
        this.qrCodeUtil = QRCodeUtil.getInstance();

        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            this.currentUserId = currentUser.id;
        }

        this.loadDelivery();
    }

    // Getters
    get delivery(): Delivery | null {
        return this._delivery;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get statusHistory(): StatusHistoryItem[] {
        return this._statusHistory;
    }

    get statusLabel(): string {
        if (!this._delivery) return '';
        const labels: Record<string, string> = {
            pending: 'Pending',
            assigned: 'Assigned',
            picked_up: 'Picked Up',
            in_transit: 'In Transit',
            delivered: 'Delivered',
            failed: 'Failed',
            cancelled: 'Cancelled',
        };
        return labels[this._delivery.status] || this._delivery.status;
    }

    get statusColor(): string {
        if (!this._delivery) return 'text-gray-600';
        const colors: Record<string, string> = {
            pending: 'text-yellow-600',
            assigned: 'text-blue-600',
            picked_up: 'text-orange-600',
            in_transit: 'text-purple-600',
            delivered: 'text-green-600',
            failed: 'text-red-600',
            cancelled: 'text-gray-600',
        };
        return colors[this._delivery.status] || 'text-gray-600';
    }

    get deliveryFeeFormatted(): string {
        if (!this._delivery) return '';
        const fee = this._delivery.deliveryFee || 0;
        const currency = this._delivery.currency || 'XAF';
        return `${fee.toLocaleString()} ${currency}`;
    }

    get platformFeeFormatted(): string {
        if (!this._earning) return '';
        return `${this._earning.platformFee.toLocaleString()} ${this._earning.currency}`;
    }

    get netEarningsFormatted(): string {
        if (!this._earning) return '';
        return `${this._earning.netAmount.toLocaleString()} ${this._earning.currency}`;
    }

    get earningStatus(): string {
        if (!this._earning) return '';
        const statuses: Record<string, string> = {
            pending: 'Earnings pending (24h hold)',
            available: 'Available for withdrawal',
            processing: 'Payout in progress',
            paid: 'Paid out',
            failed: 'Payout failed',
        };
        return statuses[this._earning.status] || '';
    }

    get pickupTimeFormatted(): string {
        if (!this._delivery?.actualPickupTime) return '';
        return `Picked up: ${this.formatDate(this._delivery.actualPickupTime)}`;
    }

    get deliveryTimeFormatted(): string {
        if (!this._delivery?.actualDeliveryTime) return '';
        return `Delivered: ${this.formatDate(this._delivery.actualDeliveryTime)}`;
    }

    get showEarnings(): boolean {
        return this._delivery?.status === 'delivered' && this._earning !== null;
    }

    get showActions(): boolean {
        if (!this._delivery) return false;
        const actionableStatuses = ['pending', 'assigned', 'picked_up', 'in_transit'];
        return actionableStatuses.includes(this._delivery.status);
    }

    // Private methods
    private async loadDelivery(): Promise<void> {
        try {
            this.set('_isLoading', true);

            // Subscribe to real-time updates
            this.unsubscribe = this.deliveryService.subscribeToDelivery(
                this.deliveryId,
                (delivery) => {
                    this._delivery = delivery;
                    this.notifyPropertyChange('delivery', delivery);
                    this.notifyPropertyChange('statusLabel', this.statusLabel);
                    this.notifyPropertyChange('statusColor', this.statusColor);
                    this.notifyPropertyChange('deliveryFeeFormatted', this.deliveryFeeFormatted);
                    this.notifyPropertyChange('pickupTimeFormatted', this.pickupTimeFormatted);
                    this.notifyPropertyChange('deliveryTimeFormatted', this.deliveryTimeFormatted);
                    this.notifyPropertyChange('showActions', this.showActions);
                    this.notifyPropertyChange('showEarnings', this.showEarnings);

                    if (delivery) {
                        this.processStatusHistory(delivery.statusHistory || []);
                    }

                    this.set('_isLoading', false);
                }
            );

            // Load earning if delivery is completed
            await this.loadEarning();
        } catch (error) {
            console.error('Error loading delivery:', error);
            this.set('_isLoading', false);
        }
    }

    private async loadEarning(): Promise<void> {
        try {
            const earnings = await this.earningsService.getCourierEarnings(this.currentUserId);
            const earning = earnings.find(e => e.deliveryId === this.deliveryId);
            if (earning) {
                this._earning = earning;
                this.notifyPropertyChange('platformFeeFormatted', this.platformFeeFormatted);
                this.notifyPropertyChange('netEarningsFormatted', this.netEarningsFormatted);
                this.notifyPropertyChange('earningStatus', this.earningStatus);
                this.notifyPropertyChange('showEarnings', this.showEarnings);
            }
        } catch (error) {
            console.error('Error loading earning:', error);
        }
    }

    private processStatusHistory(history: DeliveryStatusChange[]): void {
        const labels: Record<string, string> = {
            pending: 'Created',
            assigned: 'Assigned to Courier',
            picked_up: 'Picked Up',
            in_transit: 'In Transit',
            delivered: 'Delivered',
            failed: 'Failed',
            cancelled: 'Cancelled',
        };

        this._statusHistory = history.map((item, index) => ({
            status: item.status,
            statusLabel: labels[item.status] || item.status,
            timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp),
            timestampFormatted: this.formatDate(item.timestamp),
            note: item.note,
            isLast: index === history.length - 1,
        })).reverse(); // Show newest first

        this.notifyPropertyChange('statusHistory', this._statusHistory);
    }

    private formatDate(date: any): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Action handlers
    public async onAcceptDelivery(): Promise<void> {
        if (!this._delivery || this._delivery.status !== 'pending') return;

        const confirm = await Dialogs.confirm({
            title: 'Accept Delivery',
            message: `Accept delivery from ${this._delivery.fromPharmacyName} to ${this._delivery.toPharmacyName}?`,
            okButtonText: 'Accept',
            cancelButtonText: 'Cancel',
        });

        if (!confirm) return;

        try {
            const user = this.authService.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            await this.deliveryService.acceptDelivery(
                this.deliveryId,
                user.id,
                user.name || 'Courier',
                user.phoneNumber || ''
            );

            await Dialogs.alert({
                title: 'Success',
                message: 'Delivery accepted! Head to the pickup location.',
                okButtonText: 'OK',
            });
        } catch (error: any) {
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to accept delivery',
                okButtonText: 'OK',
            });
        }
    }

    public async onStartPickup(): Promise<void> {
        if (!this._delivery || this._delivery.status !== 'assigned') return;

        try {
            // Try QR scan first
            const qrData = await this.qrCodeUtil.scanQRCode();

            if (qrData && qrData.includes(this.deliveryId)) {
                await this.deliveryService.confirmPickup(this.deliveryId, this.currentUserId, {
                    notes: 'Pickup confirmed via QR scan',
                });

                await Dialogs.alert({
                    title: 'Pickup Confirmed',
                    message: 'Medicines collected. Head to delivery location.',
                    okButtonText: 'OK',
                });
            } else {
                // QR didn't match - offer manual confirmation
                const manual = await Dialogs.confirm({
                    title: 'QR Code Invalid',
                    message: 'QR code did not match. Confirm pickup manually?',
                    okButtonText: 'Confirm Manually',
                    cancelButtonText: 'Cancel',
                });

                if (manual) {
                    await this.confirmPickupManually();
                }
            }
        } catch (error) {
            // QR scan failed - offer manual confirmation
            const manual = await Dialogs.confirm({
                title: 'QR Scan Failed',
                message: 'Could not scan QR code. Confirm pickup manually?',
                okButtonText: 'Confirm Manually',
                cancelButtonText: 'Cancel',
            });

            if (manual) {
                await this.confirmPickupManually();
            }
        }
    }

    private async confirmPickupManually(): Promise<void> {
        const result = await Dialogs.prompt({
            title: 'Manual Pickup Confirmation',
            message: 'Enter any notes about the pickup:',
            okButtonText: 'Confirm Pickup',
            cancelButtonText: 'Cancel',
            defaultText: '',
        });

        if (result.result) {
            await this.deliveryService.confirmPickup(this.deliveryId, this.currentUserId, {
                notes: result.text || 'Manual confirmation',
            });

            await Dialogs.alert({
                title: 'Pickup Confirmed',
                message: 'Medicines collected. Head to delivery location.',
                okButtonText: 'OK',
            });
        }
    }

    public async onMarkInTransit(): Promise<void> {
        if (!this._delivery || this._delivery.status !== 'picked_up') return;

        await this.deliveryService.updateDeliveryStatus(
            this.deliveryId,
            'in_transit',
            this.currentUserId,
            'Courier in transit to delivery location'
        );
    }

    public async onCompleteDelivery(): Promise<void> {
        if (!this._delivery) return;
        if (this._delivery.status !== 'picked_up' && this._delivery.status !== 'in_transit') return;

        try {
            // Try QR scan first
            const qrData = await this.qrCodeUtil.scanQRCode();

            if (qrData && qrData.includes(this.deliveryId)) {
                await this.deliveryService.confirmDelivery(this.deliveryId, this.currentUserId, {
                    notes: 'Delivery confirmed via QR scan',
                });

                await this.showDeliverySuccess();
            } else {
                // QR didn't match - offer manual confirmation
                const manual = await Dialogs.confirm({
                    title: 'QR Code Invalid',
                    message: 'QR code did not match. Confirm delivery manually?',
                    okButtonText: 'Confirm Manually',
                    cancelButtonText: 'Cancel',
                });

                if (manual) {
                    await this.confirmDeliveryManually();
                }
            }
        } catch (error) {
            // QR scan failed - offer manual confirmation
            const manual = await Dialogs.confirm({
                title: 'QR Scan Failed',
                message: 'Could not scan QR code. Confirm delivery manually?',
                okButtonText: 'Confirm Manually',
                cancelButtonText: 'Cancel',
            });

            if (manual) {
                await this.confirmDeliveryManually();
            }
        }
    }

    private async confirmDeliveryManually(): Promise<void> {
        const result = await Dialogs.prompt({
            title: 'Manual Delivery Confirmation',
            message: 'Enter any notes about the delivery:',
            okButtonText: 'Confirm Delivery',
            cancelButtonText: 'Cancel',
            defaultText: '',
        });

        if (result.result) {
            await this.deliveryService.confirmDelivery(this.deliveryId, this.currentUserId, {
                notes: result.text || 'Manual confirmation',
            });

            await this.showDeliverySuccess();
        }
    }

    private async showDeliverySuccess(): Promise<void> {
        // Reload earning info
        await this.loadEarning();

        const earningMsg = this._earning
            ? `\n\nYou earned ${this._earning.netAmount.toLocaleString()} ${this._earning.currency}!`
            : '';

        await Dialogs.alert({
            title: 'Delivery Complete!',
            message: `Medicines delivered successfully.${earningMsg}`,
            okButtonText: 'Great!',
        });
    }

    public async onReportProblem(): Promise<void> {
        const result = await Dialogs.action({
            title: 'Report Problem',
            message: 'What issue are you experiencing?',
            actions: [
                'Cannot reach pickup location',
                'Cannot reach delivery location',
                'Medicine damaged',
                'Recipient unavailable',
                'Other issue',
            ],
            cancelButtonText: 'Cancel',
        });

        if (result && result !== 'Cancel') {
            const notes = await Dialogs.prompt({
                title: 'Additional Details',
                message: 'Please provide more details:',
                okButtonText: 'Submit',
                cancelButtonText: 'Cancel',
            });

            if (notes.result) {
                await this.deliveryService.updateDeliveryStatus(
                    this.deliveryId,
                    'failed',
                    this.currentUserId,
                    `${result}: ${notes.text || 'No details provided'}`
                );

                await Dialogs.alert({
                    title: 'Problem Reported',
                    message: 'The issue has been reported. An admin will review it.',
                    okButtonText: 'OK',
                });

                Frame.topmost().goBack();
            }
        }
    }

    public onCallPickup(): void {
        if (this._delivery?.fromPhone) {
            Utils.openUrl(`tel:${this._delivery.fromPhone}`);
        }
    }

    public onCallDelivery(): void {
        if (this._delivery?.toPhone) {
            Utils.openUrl(`tel:${this._delivery.toPhone}`);
        }
    }

    public onUnloaded(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
