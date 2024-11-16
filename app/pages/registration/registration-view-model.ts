import { Observable, Frame } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { SecurityService } from '../../services/security.service';
import * as Geolocation from '@nativescript/geolocation';
import * as imagepicker from '@nativescript/imagepicker';

export class RegistrationViewModel extends Observable {
    private authService: AuthService;
    private permissionsService: PermissionsService;
    private securityService: SecurityService;

    // Common fields
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public phoneNumber: string = '';
    public errorMessage: string = '';
    public userTypeIndex: number = 0;

    // Pharmacy fields
    public pharmacyName: string = '';
    public registrationNumber: string = '';
    public address: string = '';
    public latitude: number = 0;
    public longitude: number = 0;

    // Courier fields
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van', 'Bicycle'];
    public selectedVehicleIndex: number = 0;
    public licenseNumber: string = '';
    public documentName: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.permissionsService = PermissionsService.getInstance();
        this.securityService = SecurityService.getInstance();
    }

    get isPharmacy(): boolean {
        return this.userTypeIndex === 0;
    }

    async getCurrentLocation() {
        try {
            const hasPermission = await this.permissionsService.requestLocationPermission();
            if (!hasPermission) {
                this.set('errorMessage', 'Location permission is required for pharmacy registration');
                return;
            }

            const location = await Geolocation.getCurrentLocation({
                desiredAccuracy: Geolocation.Accuracy.high,
                maximumAge: 5000,
                timeout: 10000
            });

            this.set('latitude', location.latitude);
            this.set('longitude', location.longitude);
            this.notifyPropertyChange('latitude', location.latitude);
            this.notifyPropertyChange('longitude', location.longitude);
        } catch (error) {
            console.error('Error getting location:', error);
            this.set('errorMessage', 'Failed to get location. Please try again.');
        }
    }

    async onUploadDocument() {
        try {
            const hasPermission = await this.permissionsService.requestCameraPermission();
            if (!hasPermission) {
                this.set('errorMessage', 'Camera permission is required for document upload');
                return;
            }

            const context = imagepicker.create({
                mode: "single"
            });

            const selection = await context.present();
            if (selection.length > 0) {
                const selected = selection[0];
                this.set('documentName', selected.fileName || 'ID Document uploaded');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            this.set('errorMessage', 'Failed to upload document');
        }
    }

    async onRegister() {
        try {
            if (!this.validateInput()) {
                return;
            }

            const hashedPassword = this.securityService.hashPassword(this.password);
            const registrationData = {
                email: this.email,
                password: hashedPassword,
                phoneNumber: this.phoneNumber,
                role: this.isPharmacy ? 'pharmacist' : 'courier',
                ...(this.isPharmacy ? {
                    pharmacyName: this.pharmacyName,
                    registrationNumber: this.registrationNumber,
                    address: this.address,
                    location: {
                        latitude: this.latitude,
                        longitude: this.longitude
                    }
                } : {
                    vehicleType: this.vehicleTypes[this.selectedVehicleIndex],
                    licenseNumber: this.licenseNumber,
                    documentUploaded: !!this.documentName
                })
            };

            const success = await this.authService.register(registrationData);
            if (success) {
                Frame.topmost().navigate({
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

    private validateInput(): boolean {
        // Common validations
        if (!this.email || !this.password || !this.confirmPassword || !this.phoneNumber) {
            this.set('errorMessage', 'Please fill in all required fields');
            return false;
        }

        if (!this.validateEmail(this.email)) {
            this.set('errorMessage', 'Please enter a valid email address');
            return false;
        }

        if (!this.validatePassword(this.password)) {
            this.set('errorMessage', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return false;
        }

        if (this.password !== this.confirmPassword) {
            this.set('errorMessage', 'Passwords do not match');
            return false;
        }

        if (!this.validatePhoneNumber(this.phoneNumber)) {
            this.set('errorMessage', 'Please enter a valid phone number');
            return false;
        }

        // Pharmacy-specific validations
        if (this.isPharmacy) {
            if (!this.pharmacyName || !this.registrationNumber || !this.address) {
                this.set('errorMessage', 'Please fill in all pharmacy details');
                return false;
            }

            if (this.latitude === 0 && this.longitude === 0) {
                this.set('errorMessage', 'Please verify your pharmacy location');
                return false;
            }
        }
        // Courier-specific validations
        else {
            if (!this.licenseNumber) {
                this.set('errorMessage', 'Please enter your license number');
                return false;
            }

            if (!this.documentName) {
                this.set('errorMessage', 'Please upload your ID document');
                return false;
            }
        }

        return true;
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private validatePassword(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    private validatePhoneNumber(phone: string): boolean {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(phone);
    }
}