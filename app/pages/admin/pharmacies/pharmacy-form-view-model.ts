import { Observable } from '@nativescript/core';
import { Pharmacist } from '../../../models/user.model';
import { PharmacyCrudService } from '../../../services/crud/pharmacy.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { ValidationUtil } from '../../../utils/validation.util';
import { AuthService } from '../../../services/auth.service';

export class PharmacyFormViewModel extends Observable {
    private pharmacyCrudService: PharmacyCrudService;
    private navigationService: NavigationService;
    private validationUtil: ValidationUtil;
    private authService: AuthService;
    private pharmacyId: string | null = null;

    public isEditMode: boolean = false;
    public pharmacyName: string = '';
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public phoneNumber: string = '';
    public licenseNumber: string = '';
    public address: string = '';
    public errorMessage: string = '';

    constructor(params: { mode: 'create' | 'edit', pharmacyId?: string }) {
        super();
        this.pharmacyCrudService = PharmacyCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();
        this.authService = AuthService.getInstance();

        this.isEditMode = params.mode === 'edit';
        if (this.isEditMode && params.pharmacyId) {
            this.pharmacyId = params.pharmacyId;
            this.loadPharmacy();
        }
    }

    private async loadPharmacy() {
        try {
            if (!this.pharmacyId) return;
            
            const pharmacy = await this.pharmacyCrudService.getById(this.pharmacyId);
            if (pharmacy) {
                this.set('pharmacyName', pharmacy.pharmacyName);
                this.set('email', pharmacy.email);
                this.set('phoneNumber', pharmacy.phoneNumber);
                this.set('licenseNumber', pharmacy.license);
                this.set('address', pharmacy.address);
            }
        } catch (error) {
            console.error('Error loading pharmacy:', error);
            this.set('errorMessage', 'Failed to load pharmacy details');
        }
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            // Check for uniqueness
            try {
                const isNameTaken = await this.pharmacyCrudService.isPharmacyNameTaken(
                    this.pharmacyName,
                    this.isEditMode ? this.pharmacyId : undefined
                );
                if (isNameTaken) {
                    this.set('errorMessage', 'A pharmacy with this name already exists');
                    return;
                }

                const isEmailTaken = await this.pharmacyCrudService.isEmailTaken(
                    this.email,
                    this.isEditMode ? this.pharmacyId : undefined
                );
                if (isEmailTaken) {
                    this.set('errorMessage', 'This email is already registered');
                    return;
                }
            } catch (error) {
                console.error('Error checking uniqueness:', error);
                this.set('errorMessage', 'Failed to validate pharmacy details');
                return;
            }

            const pharmacyData: Partial<Pharmacist> = {
                pharmacyName: this.pharmacyName,
                email: this.email,
                password: this.password,
                phoneNumber: this.phoneNumber,
                license: this.licenseNumber,
                address: this.address,
                role: 'pharmacist' as const
            };

            if (this.isEditMode && this.pharmacyId) {
                await this.pharmacyCrudService.update(this.pharmacyId, pharmacyData);
            } else {
                const registered = await this.authService.register(pharmacyData);
                if (!registered) {
                    this.set('errorMessage', 'Failed to register pharmacy');
                    return;
                }
            }

            this.navigationService.navigate({
                moduleName: 'pages/admin/dashboard/admin-dashboard-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Error saving pharmacy:', error);
            if (error instanceof Error) {
                this.set('errorMessage', error.message);
            } else {
                this.set('errorMessage', 'Failed to save pharmacy');
            }
        }
    }

    private validateForm(): boolean {
        if (!this.pharmacyName || !this.email || !this.phoneNumber || !this.licenseNumber || !this.address) {
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