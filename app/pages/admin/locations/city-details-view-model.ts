import { Observable, Dialogs } from '@nativescript/core';
import {
    AdminLocationFirebaseService,
    CityDocument,
    CourierAssignment,
} from '../../../services/firebase/admin-location-firebase.service';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';

export class CityDetailsViewModel extends Observable {
    private adminService: AdminLocationFirebaseService;
    private authSession: AuthSessionService;
    private cityId: string;

    private _city: CityDocument | null = null;
    private _assignedCouriers: CourierAssignment[] = [];
    private _availableCouriers: any[] = [];
    private _isLoading: boolean = true;

    constructor(cityId: string) {
        super();
        this.cityId = cityId;
        this.adminService = AdminLocationFirebaseService.getInstance();
        this.authSession = getAuthSessionService();

        this.loadData();
    }

    // Getters
    get cityName(): string { return this._city?.name || 'Loading...'; }
    get countryName(): string { return this._city?.countryName || ''; }
    get countryCode(): string { return this._city?.countryCode || ''; }
    get isActive(): boolean { return this._city?.isActive || false; }
    get isCapital(): boolean { return this._city?.isCapital || false; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get assignedCouriers(): CourierAssignment[] { return this._assignedCouriers; }
    set assignedCouriers(value: CourierAssignment[]) {
        this._assignedCouriers = value;
        this.notifyPropertyChange('assignedCouriers', value);
    }

    get availableCouriers(): any[] { return this._availableCouriers; }
    set availableCouriers(value: any[]) {
        this._availableCouriers = value;
        this.notifyPropertyChange('availableCouriers', value);
    }

    /**
     * Load city data and couriers
     */
    private async loadData(): Promise<void> {
        try {
            this.isLoading = true;

            const [city, assignedCouriers, availableCouriers] = await Promise.all([
                this.adminService.getCityById(this.cityId),
                this.adminService.getCouriersInCity(this.cityId),
                this.adminService.getUnassignedCouriersForCity(this.cityId),
            ]);

            this._city = city;
            this.assignedCouriers = assignedCouriers;
            this.availableCouriers = availableCouriers;

            // Notify all property changes
            this.notifyPropertyChange('cityName', this.cityName);
            this.notifyPropertyChange('countryName', this.countryName);
            this.notifyPropertyChange('countryCode', this.countryCode);
            this.notifyPropertyChange('isActive', this.isActive);
            this.notifyPropertyChange('isCapital', this.isCapital);

        } catch (error) {
            console.error('Error loading city data:', error);
            await Dialogs.alert({
                title: 'Error',
                message: 'Failed to load city data',
                okButtonText: 'OK',
            });
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Add a new courier to this city
     */
    async onAddCourier(): Promise<void> {
        if (this._availableCouriers.length === 0) {
            await Dialogs.alert({
                title: 'No Available Couriers',
                message: 'All couriers are already assigned to this city, or there are no registered couriers.',
                okButtonText: 'OK',
            });
            return;
        }

        const courierNames = this._availableCouriers.map(c => `${c.name} (${c.phoneNumber})`);

        const result = await Dialogs.action({
            title: 'Select Courier',
            message: `Assign a courier to ${this.cityName}:`,
            cancelButtonText: 'Cancel',
            actions: courierNames,
        });

        if (!result || result === 'Cancel') return;

        const selectedIndex = courierNames.indexOf(result);
        const selectedCourier = this._availableCouriers[selectedIndex];

        if (!selectedCourier) return;

        await this.assignCourierToCity(selectedCourier);
    }

    /**
     * Assign courier from available list
     */
    async onAssignCourier(args: any): Promise<void> {
        const courier = args.object.bindingContext;
        await this.assignCourierToCity(courier);
    }

    /**
     * Common method to assign courier
     */
    private async assignCourierToCity(courier: any): Promise<void> {
        try {
            const currentUser = this.authSession.currentUser;
            if (!currentUser) {
                throw new Error('Admin user not found');
            }

            await this.adminService.assignCourierToCity(
                courier.id,
                this.cityId,
                currentUser.id
            );

            await Dialogs.alert({
                title: 'Success',
                message: `${courier.name} has been assigned to ${this.cityName}.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error assigning courier:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to assign courier',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Remove courier from this city
     */
    async onRemoveCourier(args: any): Promise<void> {
        const assignment: CourierAssignment = args.object.bindingContext;

        const confirmed = await Dialogs.confirm({
            title: 'Remove Courier',
            message: `Are you sure you want to remove ${assignment.courierName} from ${this.cityName}?`,
            okButtonText: 'Remove',
            cancelButtonText: 'Cancel',
        });

        if (!confirmed) return;

        try {
            await this.adminService.removeCourierFromCity(assignment.courierId, this.cityId);

            await Dialogs.alert({
                title: 'Success',
                message: `${assignment.courierName} has been removed from ${this.cityName}.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error removing courier:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to remove courier',
                okButtonText: 'OK',
            });
        }
    }

    /**
     * Toggle city active status
     */
    async onToggleStatus(): Promise<void> {
        const action = this.isActive ? 'deactivate' : 'activate';

        const confirmed = await Dialogs.confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} City`,
            message: `Are you sure you want to ${action} ${this.cityName}?`,
            okButtonText: 'Yes',
            cancelButtonText: 'No',
        });

        if (!confirmed) return;

        try {
            await this.adminService.toggleCityStatus(this.cityId, !this.isActive);

            await Dialogs.alert({
                title: 'Success',
                message: `${this.cityName} has been ${action}d.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error toggling city status:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || `Failed to ${action} city`,
                okButtonText: 'OK',
            });
        }
    }
}
