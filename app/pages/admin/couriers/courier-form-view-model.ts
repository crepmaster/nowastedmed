import { Observable } from '@nativescript/core';
import { CarrierCrudService } from '../../../services/crud/carrier.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { ValidationUtil } from '../../../utils/validation.util';

export class CourierFormViewModel extends Observable {
    private carrierCrudService: CarrierCrudService;
    private navigationService: NavigationService;
    private validationUtil: ValidationUtil;
    private courierId: string | null = null;

    public isEditMode: boolean = false;
    public name: string = '';
    public email: string = '';
    public phoneNumber: string = '';
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van', 'Bicycle'];
    public selectedVehicleIndex: number = 0;
    public licenseNumber: string = '';
    public errorMessage: string = '';

    constructor(params: { mode: 'create' | 'edit', courierId?: string }) {
        super();
        this.carrierCrudService = CarrierCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();

        this.isEditMode = params.mode === 'edit';
        if (this.isEditMode && params.courierId) {
            this.courierId = params.courierId;
            this.loadCourier();
        }
    }

    private async loadCourier() {
        try {
            if (!this.courierId) return;
            
            const courier = await this.carrierCrudService.getById(this.courierId);
            if (courier) {
                this.set('name', courier.name);
                this.set('email', courier.email);
                this.set('phoneNumber', courier.phoneNumber);
                this.set('licenseNumber', courier.licenseNumber);
                const vehicleIndex = this.vehicleTypes.indexOf(courier.vehicleType);
                if (vehicleIndex !== -1) {
                    this.set('selectedVehicleIndex', vehicleIndex);
                }
            }
        } catch (error) {
            console.error('Error loading courier:', error);
            this.set('errorMessage', 'Failed to load courier details');
        }
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            const courierData = {
                name: this.name,
                email: this.email,
                phoneNumber: this.phoneNumber,
                vehicleType: this.vehicleTypes[this.selectedVehicleIndex],
                licenseNumber: this.licenseNumber,
                role: 'courier'
            };

            if (this.isEditMode && this.courierId) {
                await this.carrierCrudService.update(this.courierId, courierData);
            } else {
                await this.carrierCrudService.create(courierData);
            }

            // Navigate back to the admin dashboard
            this.navigationService.navigate({
                moduleName: 'pages/admin/dashboard/admin-dashboard-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Error saving courier:', error);
            this.set('errorMessage', 'Failed to save courier');
        }
    }

    private validateForm(): boolean {
        if (!this.name || !this.email || !this.phoneNumber || !this.licenseNumber) {
            this.set('errorMessage', 'Please fill in all fields');
            return false;
        }

        if (!this.validationUtil.isValidEmail(this.email)) {
            this.set('errorMessage', 'Please enter a valid email address');
            return false;
        }

        if (!this.validationUtil.isValidPhoneNumber(this.phoneNumber)) {
            this.set('errorMessage', 'Please enter a valid phone number');
            return false;
        }

        return true;
    }
}