import { Observable } from '@nativescript/core';
import { PharmacyCrudService } from '../../../services/crud/pharmacy.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { ValidationUtil } from '../../../utils/validation.util';

export class PharmacyFormViewModel extends Observable {
    private pharmacyCrudService: PharmacyCrudService;
    private navigationService: NavigationService;
    private validationUtil: ValidationUtil;
    private pharmacyId: string | null = null;

    public isEditMode: boolean = false;
    public pharmacyName: string = '';
    public email: string = '';
    public phoneNumber: string = '';
    public licenseNumber: string = '';
    public address: string = '';
    public errorMessage: string = '';

    constructor(params: { mode: 'create' | 'edit', pharmacyId?: string }) {
        super();
        this.pharmacyCrudService = PharmacyCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();

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

            const pharmacyData = {
                pharmacyName: this.pharmacyName,
                email: this.email,
                phoneNumber: this.phoneNumber,
                license: this.licenseNumber,
                address: this.address
            };

            if (this.isEditMode && this.pharmacyId) {
                await this.pharmacyCrudService.update(this.pharmacyId, pharmacyData);
            } else {
                await this.pharmacyCrudService.create(pharmacyData);
            }

            this.navigationService.goBack();
        } catch (error) {
            console.error('Error saving pharmacy:', error);
            this.set('errorMessage', 'Failed to save pharmacy');
        }
    }

    private validateForm(): boolean {
        if (!this.pharmacyName || !this.email || !this.phoneNumber || !this.licenseNumber || !this.address) {
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