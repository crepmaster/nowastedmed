import { Observable } from '@nativescript/core';
import { Courier } from '../../../models/user.model';
import { CourierCrudService } from '../../../services/crud/courier.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { ValidationUtil } from '../../../utils/validation.util';
import { AuthService } from '../../../services/auth.service';

export class CourierFormViewModel extends Observable {
    private courierCrudService: CourierCrudService;
    private navigationService: NavigationService;
    private validationUtil: ValidationUtil;
    private authService: AuthService;
    private courierId: string | null = null;

    public isEditMode: boolean = false;
    public name: string = '';
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public phoneNumber: string = '';
    public licenseNumber: string = '';
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van', 'Bicycle'];
    public selectedVehicleIndex: number = 0;
    public errorMessage: string = '';

    constructor(params: { mode: 'create' | 'edit', courierId?: string }) {
        super();
        this.courierCrudService = CourierCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();
        this.authService = AuthService.getInstance();

        this.isEditMode = params.mode === 'edit';
        if (this.isEditMode && params.courierId) {
            this.courierId = params.courierId;
            this.loadCourier();
        }
    }

    private async loadCourier() {
        try {
            if (!this.courierId) return;
            
            const courier = await this.courierCrudService.getById(this.courierId);
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

            // Check for uniqueness
            try {
                const isEmailTaken = await this.courierCrudService.isEmailTaken(
                    this.email,
                    this.isEditMode ? this.courierId : undefined
                );
                if (isEmailTaken) {
                    this.set('errorMessage', 'This email is already registered');
                    return;
                }

                const isLicenseTaken = await this.courierCrudService.isLicenseNumberTaken(
                    this.licenseNumber,
                    this.isEditMode ? this.courierId : undefined
                );
                if (isLicenseTaken) {
                    this.set('errorMessage', 'This license number is already registered');
                    return;
                }
            } catch (error) {
                console.error('Error checking uniqueness:', error);
                this.set('errorMessage', 'Failed to validate courier details');
                return;
            }

            const courierData: Partial<Courier> = {
                name: this.name,
                email: this.email,
                password: this.password,
                phoneNumber: this.phoneNumber,
                licenseNumber: this.licenseNumber,
                vehicleType: this.vehicleTypes[this.selectedVehicleIndex],
                role: 'courier' as const
            };

            if (this.isEditMode && this.courierId) {
                await this.courierCrudService.update(this.courierId, courierData);
            } else {
                const registered = await this.authService.register(courierData);
                if (!registered) {
                    this.set('errorMessage', 'Failed to register courier');
                    return;
                }
            }

            this.navigationService.navigate({
                moduleName: 'pages/admin/dashboard/admin-dashboard-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Error saving courier:', error);
            if (error instanceof Error) {
                this.set('errorMessage', error.message);
            } else {
                this.set('errorMessage', 'Failed to save courier');
            }
        }
    }

    private validateForm(): boolean {
        if (!this.name || !this.email || !this.phoneNumber || !this.licenseNumber) {
            this.set('errorMessage', 'Please fill in all fields');
            return false;
        }

        if (!this.isEditMode && (!this.password || !this.confirmPassword)) {
            this.set('errorMessage', 'Please enter and confirm the password');
            return false;
        }

        if (!this.isEditMode && this.password !== this.confirmPassword) {
            this.set('errorMessage', 'Passwords do not match');
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

        if (!this.isEditMode && !this.validationUtil.isValidPassword(this.password)) {
            this.set('errorMessage', 'Password must be at least 8 characters long');
            return false;
        }

        return true;
    }
}