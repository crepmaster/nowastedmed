import { Observable } from '@nativescript/core';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { ValidationUtil } from '../../utils/validation.util';

export class RegistrationViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private validationUtil: ValidationUtil;

    // Form fields
    public userTypeIndex: number = 0;
    public email: string = '';
    public password: string = '';
    public phoneNumber: string = '';
    public pharmacyName: string = '';
    public licenseNumber: string = '';
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van'];
    public selectedVehicleIndex: number = 0;
    public errorMessage: string = '';

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();
    }

    get isPharmacy(): boolean {
        return this.userTypeIndex === 0;
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) {
                return;
            }

            const registrationData = {
                email: this.email,
                password: this.password,
                phoneNumber: this.phoneNumber,
                role: this.isPharmacy ? 'pharmacist' : 'courier',
                ...(this.isPharmacy ? {
                    pharmacyName: this.pharmacyName,
                    licenseNumber: this.licenseNumber
                } : {
                    vehicleType: this.vehicleTypes[this.selectedVehicleIndex]
                })
            };

            const success = await this.authService.register(registrationData);
            if (success) {
                this.navigationService.navigate({
                    moduleName: 'pages/registration/registration-success-page',
                    clearHistory: true
                });
            } else {
                this.set('errorMessage', 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.set('errorMessage', 'An error occurred during registration');
        }
    }

    private validateForm(): boolean {
        if (!this.validationUtil.isValidEmail(this.email)) {
            this.set('errorMessage', 'Please enter a valid email address');
            return false;
        }

        if (!this.validationUtil.isValidPassword(this.password)) {
            this.set('errorMessage', 'Password must be at least 8 characters long');
            return false;
        }

        if (!this.validationUtil.isValidPhoneNumber(this.phoneNumber)) {
            this.set('errorMessage', 'Please enter a valid phone number');
            return false;
        }

        if (this.isPharmacy) {
            if (!this.pharmacyName || !this.licenseNumber) {
                this.set('errorMessage', 'Please fill in all pharmacy details');
                return false;
            }
        }

        return true;
    }
}