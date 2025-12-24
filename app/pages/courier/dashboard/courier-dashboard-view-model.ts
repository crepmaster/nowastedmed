import { Observable, Dialogs, Frame } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { getAuthService, IAuthService } from '../../../services/auth-factory.service';
import { DeliveryFirebaseService } from '../../../services/firebase/delivery-firebase.service';
import { QRCodeUtil } from '../../../utils/qrcode.util';
import { Delivery, DeliveryStatus, CourierStats } from '../../../models/delivery.model';
import { User } from '../../../models/user.model';

interface DeliveryDisplay extends Delivery {
    statusLabel: string;
    statusColor: string;
    actionLabel: string;
    formattedDate: string;
}

export class CourierDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: IAuthService;
    private deliveryService: DeliveryFirebaseService;
    private qrCodeUtil: QRCodeUtil;

    private unsubscribeActive: (() => void) | null = null;
    private currentUserId: string = '';
    private currentUser: User | null = null;
    private operatingCityIds: string[] = [];

    private _stats: CourierStats = {
        totalDeliveries: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0,
        inTransitDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0,
        rating: 4.5,
        totalEarnings: 0,
    };

    private _activeDeliveries: DeliveryDisplay[] = [];
    private _deliveryHistory: DeliveryDisplay[] = [];
    private _pendingDeliveries: DeliveryDisplay[] = [];
    private _selectedTabIndex: number = 0;
    private _isLoading: boolean = true;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = getAuthService();
        this.deliveryService = DeliveryFirebaseService.getInstance();
        this.qrCodeUtil = QRCodeUtil.getInstance();

        this.initializeData();
    }

    // Getters and Setters
    get stats(): CourierStats { return this._stats; }
    set stats(value: CourierStats) {
        if (this._stats !== value) {
            this._stats = value;
            this.notifyPropertyChange('stats', value);
        }
    }

    get activeDeliveries(): DeliveryDisplay[] { return this._activeDeliveries; }
    set activeDeliveries(value: DeliveryDisplay[]) {
        if (this._activeDeliveries !== value) {
            this._activeDeliveries = value;
            this.notifyPropertyChange('activeDeliveries', value);
            this.notifyPropertyChange('hasActiveDeliveries', value.length > 0);
        }
    }

    get hasActiveDeliveries(): boolean { return this._activeDeliveries.length > 0; }

    get deliveryHistory(): DeliveryDisplay[] { return this._deliveryHistory; }
    set deliveryHistory(value: DeliveryDisplay[]) {
        if (this._deliveryHistory !== value) {
            this._deliveryHistory = value;
            this.notifyPropertyChange('deliveryHistory', value);
            this.notifyPropertyChange('hasDeliveryHistory', value.length > 0);
        }
    }

    get hasDeliveryHistory(): boolean { return this._deliveryHistory.length > 0; }

    get pendingDeliveries(): DeliveryDisplay[] { return this._pendingDeliveries; }
    set pendingDeliveries(value: DeliveryDisplay[]) {
        if (this._pendingDeliveries !== value) {
            this._pendingDeliveries = value;
            this.notifyPropertyChange('pendingDeliveries', value);
            this.notifyPropertyChange('hasPendingDeliveries', value.length > 0);
        }
    }

    get hasPendingDeliveries(): boolean { return this._pendingDeliveries.length > 0; }

    get selectedTabIndex(): number { return this._selectedTabIndex; }
    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    /**
     * Initialize data loading
     */
    private async initializeData(): Promise<void> {
        try {
            this.isLoading = true;

            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                console.error('No user logged in');
                return;
            }

            this.currentUserId = currentUser.id;
            this.currentUser = currentUser;

            // Determine courier's operating cities
            // Couriers can have multiple operating cities or a primary location
            if (currentUser.operatingCities && currentUser.operatingCities.length > 0) {
                this.operatingCityIds = currentUser.operatingCities;
            } else if (currentUser.location?.cityId) {
                this.operatingCityIds = [currentUser.location.cityId];
            } else {
                // If no city is set, show all deliveries (backwards compatibility)
                this.operatingCityIds = [];
            }

            // Load all data in parallel
            await Promise.all([
                this.loadActiveDeliveries(),
                this.loadDeliveryHistory(),
                this.loadPendingDeliveries(),
                this.loadStats(),
            ]);

        } catch (error) {
            console.error('Error initializing courier dashboard:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load active deliveries (assigned to this courier, not yet completed)
     */
    private async loadActiveDeliveries(): Promise<void> {
        try {
            const deliveries = await this.deliveryService.getCourierDeliveries(
                this.currentUserId,
                ['assigned', 'picked_up', 'in_transit']
            );
            this.activeDeliveries = deliveries.map(d => this.formatDeliveryForDisplay(d));

            // Subscribe to real-time updates
            this.unsubscribeActive = this.deliveryService.subscribeToCourierDeliveries(
                this.currentUserId,
                (deliveries) => {
                    this.activeDeliveries = deliveries
                        .filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status))
                        .map(d => this.formatDeliveryForDisplay(d));
                },
                ['assigned', 'picked_up', 'in_transit']
            );
        } catch (error) {
            console.error('Error loading active deliveries:', error);
        }
    }

    /**
     * Load delivery history (completed)
     */
    private async loadDeliveryHistory(): Promise<void> {
        try {
            const deliveries = await this.deliveryService.getCourierDeliveries(
                this.currentUserId,
                ['delivered', 'failed', 'cancelled']
            );
            this.deliveryHistory = deliveries.map(d => this.formatDeliveryForDisplay(d));
        } catch (error) {
            console.error('Error loading delivery history:', error);
        }
    }

    /**
     * Load pending deliveries (available to accept)
     * IMPORTANT: Only shows deliveries in courier's operating cities
     */
    private async loadPendingDeliveries(): Promise<void> {
        try {
            let deliveries: Delivery[];

            if (this.operatingCityIds.length === 1) {
                // Single city - use simple method
                deliveries = await this.deliveryService.getPendingDeliveriesByCity(this.operatingCityIds[0]);
            } else if (this.operatingCityIds.length > 1) {
                // Multiple cities - use multi-city method
                deliveries = await this.deliveryService.getPendingDeliveriesByCities(this.operatingCityIds);
            } else {
                // No city filter (backwards compatibility)
                deliveries = await this.deliveryService.getPendingDeliveries();
            }

            this.pendingDeliveries = deliveries.map(d => this.formatDeliveryForDisplay(d));
        } catch (error) {
            console.error('Error loading pending deliveries:', error);
        }
    }

    /**
     * Load courier stats
     */
    private async loadStats(): Promise<void> {
        try {
            const stats = await this.deliveryService.getCourierStats(this.currentUserId);
            this.stats = stats;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * Format delivery for display
     */
    private formatDeliveryForDisplay(delivery: Delivery): DeliveryDisplay {
        const statusInfo = this.getStatusInfo(delivery.status);
        const createdAt = delivery.createdAt instanceof Date
            ? delivery.createdAt
            : new Date(delivery.createdAt);

        return {
            ...delivery,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            actionLabel: this.getActionLabel(delivery.status),
            formattedDate: this.formatDate(createdAt),
        };
    }

    /**
     * Get status display info
     */
    private getStatusInfo(status: DeliveryStatus): { label: string; color: string } {
        switch (status) {
            case 'pending':
                return { label: 'Pending', color: '#F59E0B' };
            case 'assigned':
                return { label: 'Assigned', color: '#3B82F6' };
            case 'picked_up':
                return { label: 'Picked Up', color: '#8B5CF6' };
            case 'in_transit':
                return { label: 'In Transit', color: '#3B82F6' };
            case 'delivered':
                return { label: 'Delivered', color: '#10B981' };
            case 'failed':
                return { label: 'Failed', color: '#EF4444' };
            case 'cancelled':
                return { label: 'Cancelled', color: '#6B7280' };
            default:
                return { label: status, color: '#6B7280' };
        }
    }

    /**
     * Get action button label
     */
    private getActionLabel(status: DeliveryStatus): string {
        switch (status) {
            case 'pending':
                return 'Accept';
            case 'assigned':
                return 'Start Pickup';
            case 'picked_up':
            case 'in_transit':
                return 'Confirm Delivery';
            default:
                return 'View Details';
        }
    }

    /**
     * Format date for display
     */
    private formatDate(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }

        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }

    /**
     * Handle delivery action (accept, pickup, deliver)
     */
    async onDeliveryAction(args: any): Promise<void> {
        const delivery: DeliveryDisplay = args.object.bindingContext;

        try {
            switch (delivery.status) {
                case 'pending':
                    await this.acceptDelivery(delivery);
                    break;
                case 'assigned':
                    await this.startPickup(delivery);
                    break;
                case 'picked_up':
                case 'in_transit':
                    await this.confirmDelivery(delivery);
                    break;
                default:
                    this.viewDeliveryDetails(delivery);
            }
        } catch (error) {
            console.error('Error handling delivery action:', error);
            Dialogs.alert({
                title: 'Error',
                message: 'Failed to process action. Please try again.',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Accept a pending delivery
     */
    private async acceptDelivery(delivery: Delivery): Promise<void> {
        const confirmed = await Dialogs.confirm({
            title: 'Accept Delivery',
            message: `Accept delivery from ${delivery.fromPharmacyName} to ${delivery.toPharmacyName}?`,
            okButtonText: 'Accept',
            cancelButtonText: 'Cancel',
        });

        if (confirmed) {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) return;

            await this.deliveryService.acceptDelivery(
                delivery.id,
                currentUser.id,
                currentUser.name,
                currentUser.phoneNumber || ''
            );

            Dialogs.alert({
                title: 'Delivery Accepted',
                message: 'You have accepted this delivery. Navigate to the pickup location.',
                okButtonText: 'OK',
            });

            await this.loadPendingDeliveries();
            await this.loadActiveDeliveries();
            await this.loadStats();
        }
    }

    /**
     * Start pickup (scan QR and confirm)
     */
    private async startPickup(delivery: Delivery): Promise<void> {
        try {
            // Try to scan QR code
            const qrData = await this.qrCodeUtil.scanQRCode();

            // Verify QR code matches delivery
            if (qrData && qrData.includes(delivery.id)) {
                await this.deliveryService.confirmPickup(delivery.id, this.currentUserId, {
                    notes: 'Pickup confirmed via QR scan',
                });

                Dialogs.alert({
                    title: 'Pickup Confirmed',
                    message: 'Medicine picked up successfully. Deliver to destination.',
                    okButtonText: 'OK',
                });
            } else {
                // Allow manual confirmation
                const manual = await Dialogs.confirm({
                    title: 'QR Mismatch',
                    message: 'QR code doesn\'t match. Confirm pickup manually?',
                    okButtonText: 'Confirm Manually',
                    cancelButtonText: 'Cancel',
                });

                if (manual) {
                    await this.deliveryService.confirmPickup(delivery.id, this.currentUserId, {
                        notes: 'Pickup confirmed manually',
                    });
                }
            }

            await this.loadActiveDeliveries();
            await this.loadStats();
        } catch (error) {
            // QR scan failed or cancelled, offer manual confirmation
            const manual = await Dialogs.confirm({
                title: 'Confirm Pickup',
                message: `Confirm pickup from ${delivery.fromPharmacyName}?`,
                okButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
            });

            if (manual) {
                await this.deliveryService.confirmPickup(delivery.id, this.currentUserId, {
                    notes: 'Pickup confirmed manually (QR unavailable)',
                });

                await this.loadActiveDeliveries();
                await this.loadStats();
            }
        }
    }

    /**
     * Confirm delivery (scan QR and complete)
     */
    private async confirmDelivery(delivery: Delivery): Promise<void> {
        try {
            // Try to scan QR code
            const qrData = await this.qrCodeUtil.scanQRCode();

            if (qrData && qrData.includes(delivery.id)) {
                await this.deliveryService.confirmDelivery(delivery.id, this.currentUserId, {
                    notes: 'Delivery confirmed via QR scan',
                });

                Dialogs.alert({
                    title: 'Delivery Complete',
                    message: 'Medicine delivered successfully!',
                    okButtonText: 'OK',
                });
            } else {
                const manual = await Dialogs.confirm({
                    title: 'QR Mismatch',
                    message: 'QR code doesn\'t match. Confirm delivery manually?',
                    okButtonText: 'Confirm Manually',
                    cancelButtonText: 'Cancel',
                });

                if (manual) {
                    await this.deliveryService.confirmDelivery(delivery.id, this.currentUserId, {
                        notes: 'Delivery confirmed manually',
                    });
                }
            }

            await this.loadActiveDeliveries();
            await this.loadDeliveryHistory();
            await this.loadStats();
        } catch (error) {
            const manual = await Dialogs.confirm({
                title: 'Confirm Delivery',
                message: `Confirm delivery to ${delivery.toPharmacyName}?`,
                okButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
            });

            if (manual) {
                await this.deliveryService.confirmDelivery(delivery.id, this.currentUserId, {
                    notes: 'Delivery confirmed manually (QR unavailable)',
                });

                await this.loadActiveDeliveries();
                await this.loadDeliveryHistory();
                await this.loadStats();
            }
        }
    }

    /**
     * View delivery details
     */
    private viewDeliveryDetails(delivery: Delivery): void {
        Frame.topmost().navigate({
            moduleName: 'pages/courier/delivery/delivery-details-page',
            context: { deliveryId: delivery.id },
        });
    }

    /**
     * Scan QR code manually
     */
    async onScanQR(): Promise<void> {
        try {
            const qrData = await this.qrCodeUtil.scanQRCode();
            if (qrData) {
                console.log('QR code scanned:', qrData);
                // Process QR data - could be pickup or delivery confirmation
                Dialogs.alert({
                    title: 'QR Scanned',
                    message: 'QR code processed successfully.',
                    okButtonText: 'OK',
                });
            }
        } catch (error) {
            console.error('Error scanning QR code:', error);
        }
    }

    /**
     * Navigate to wallet
     */
    onViewWallet(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/wallet/wallet-page',
        });
    }

    /**
     * Refresh data
     */
    async onRefresh(): Promise<void> {
        await this.initializeData();
    }

    /**
     * Logout
     */
    onLogout(): void {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true,
        });
    }

    /**
     * Cleanup subscriptions
     */
    onUnloaded(): void {
        if (this.unsubscribeActive) {
            this.unsubscribeActive();
            this.unsubscribeActive = null;
        }
    }
}
