import { Observable, Dialogs } from '@nativescript/core';
import { getAuthSessionService, AuthSessionService } from '../../../services/auth-session.service';
import { NavigationService } from '../../../services/navigation.service';
import {
    Country,
    City,
    getActiveCountries,
    getCitiesByCountry
} from '../../../models/location.model';
import {
    MobileMoneyProvider,
    getProvidersByRegion
} from '../../../models/wallet.model';

export class EditProfileViewModel extends Observable {
    private authSession: AuthSessionService;
    private navigationService: NavigationService;

    // Form fields
    private _userName: string = '';
    private _userEmail: string = '';
    private _phoneNumber: string = '';
    private _address: string = '';
    private _userInitials: string = '';

    // Role flags
    private _isPharmacy: boolean = false;
    private _isCourier: boolean = false;

    // Pharmacy fields
    private _pharmacyName: string = '';
    private _licenseNumber: string = '';

    // Courier fields
    private _vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van'];
    private _selectedVehicleIndex: number = 0;

    // Location
    private _countries: Country[] = [];
    private _cities: City[] = [];
    private _selectedCountryIndex: number = 0;
    private _selectedCityIndex: number = 0;

    // Mobile Money Provider
    private _providers: MobileMoneyProvider[] = [];
    private _selectedProviderIndex: number = 0;

    // UI state
    private _isSaving: boolean = false;
    private _errorMessage: string = '';

    constructor() {
        super();
        this.authSession = getAuthSessionService();
        this.navigationService = NavigationService.getInstance();
        this.loadUserData();
    }

    // Basic info getters/setters
    get userName(): string { return this._userName; }
    set userName(value: string) {
        if (this._userName !== value) {
            this._userName = value;
            this.notifyPropertyChange('userName', value);
            this.updateInitials();
        }
    }

    get userEmail(): string { return this._userEmail; }
    set userEmail(value: string) {
        if (this._userEmail !== value) {
            this._userEmail = value;
            this.notifyPropertyChange('userEmail', value);
        }
    }

    get phoneNumber(): string { return this._phoneNumber; }
    set phoneNumber(value: string) {
        if (this._phoneNumber !== value) {
            this._phoneNumber = value;
            this.notifyPropertyChange('phoneNumber', value);
        }
    }

    get address(): string { return this._address; }
    set address(value: string) {
        if (this._address !== value) {
            this._address = value;
            this.notifyPropertyChange('address', value);
        }
    }

    get userInitials(): string { return this._userInitials; }

    // Role getters
    get isPharmacy(): boolean { return this._isPharmacy; }
    get isCourier(): boolean { return this._isCourier; }

    // Pharmacy getters/setters
    get pharmacyName(): string { return this._pharmacyName; }
    set pharmacyName(value: string) {
        if (this._pharmacyName !== value) {
            this._pharmacyName = value;
            this.notifyPropertyChange('pharmacyName', value);
        }
    }

    get licenseNumber(): string { return this._licenseNumber; }
    set licenseNumber(value: string) {
        if (this._licenseNumber !== value) {
            this._licenseNumber = value;
            this.notifyPropertyChange('licenseNumber', value);
        }
    }

    // Courier getters/setters
    get vehicleTypes(): string[] { return this._vehicleTypes; }
    get selectedVehicleIndex(): number { return this._selectedVehicleIndex; }
    set selectedVehicleIndex(value: number) {
        if (this._selectedVehicleIndex !== value) {
            this._selectedVehicleIndex = value;
            this.notifyPropertyChange('selectedVehicleIndex', value);
        }
    }

    // Location getters/setters
    get countryNames(): string[] {
        return this._countries.map(c => c.name);
    }

    get cityNames(): string[] {
        return this._cities.map(c => c.name);
    }

    get selectedCountryIndex(): number { return this._selectedCountryIndex; }
    set selectedCountryIndex(value: number) {
        if (this._selectedCountryIndex !== value) {
            this._selectedCountryIndex = value;
            this.notifyPropertyChange('selectedCountryIndex', value);
            // Update cities and providers when country changes
            if (this._countries[value]) {
                this.updateCitiesForCountry(this._countries[value].code);
                this.updateProvidersForCountry(this._countries[value]);
            }
        }
    }

    get selectedCityIndex(): number { return this._selectedCityIndex; }
    set selectedCityIndex(value: number) {
        if (this._selectedCityIndex !== value) {
            this._selectedCityIndex = value;
            this.notifyPropertyChange('selectedCityIndex', value);
        }
    }

    // Provider getters/setters
    get providerNames(): string[] {
        return this._providers.map(p => p.name);
    }

    get selectedProviderIndex(): number { return this._selectedProviderIndex; }
    set selectedProviderIndex(value: number) {
        if (this._selectedProviderIndex !== value) {
            this._selectedProviderIndex = value;
            this.notifyPropertyChange('selectedProviderIndex', value);
        }
    }

    // UI state getters/setters
    get isSaving(): boolean { return this._isSaving; }
    set isSaving(value: boolean) {
        if (this._isSaving !== value) {
            this._isSaving = value;
            this.notifyPropertyChange('isSaving', value);
        }
    }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notifyPropertyChange('errorMessage', value);
        }
    }

    /**
     * Load current user data into form
     */
    private loadUserData(): void {
        const user = this.authSession.currentUser;
        if (!user) return;

        // Basic info
        this._userName = user.name || '';
        this._userEmail = user.email || '';
        this._phoneNumber = user.phoneNumber || '';
        this.updateInitials();

        // Role
        this._isPharmacy = user.role === 'pharmacist';
        this._isCourier = user.role === 'courier';
        this.notifyPropertyChange('isPharmacy', this._isPharmacy);
        this.notifyPropertyChange('isCourier', this._isCourier);

        // Initialize countries
        this._countries = getActiveCountries();
        this.notifyPropertyChange('countryNames', this.countryNames);

        // Load location
        const location = (user as any).location;
        if (location) {
            this._address = location.address || '';

            // Find and select country
            const countryIndex = this._countries.findIndex(c => c.code === location.countryCode);
            if (countryIndex >= 0) {
                this._selectedCountryIndex = countryIndex;
                this.updateCitiesForCountry(this._countries[countryIndex].code);
                this.updateProvidersForCountry(this._countries[countryIndex]);

                // Find and select city
                const cityIndex = this._cities.findIndex(c => c.id === location.cityId);
                if (cityIndex >= 0) {
                    this._selectedCityIndex = cityIndex;
                }
            }
        } else if (this._countries.length > 0) {
            // Default to first country
            this.updateCitiesForCountry(this._countries[0].code);
            this.updateProvidersForCountry(this._countries[0]);
        }

        // Mobile money provider
        const providerId = (user as any).mobileMoneyProvider;
        if (providerId && this._providers.length > 0) {
            const providerIndex = this._providers.findIndex(p => p.id === providerId);
            if (providerIndex >= 0) {
                this._selectedProviderIndex = providerIndex;
            }
        }

        // Pharmacy-specific
        if (this._isPharmacy) {
            this._pharmacyName = (user as any).pharmacyName || '';
            this._licenseNumber = (user as any).licenseNumber || '';
        }

        // Courier-specific
        if (this._isCourier) {
            const vehicleType = (user as any).vehicleType;
            const vehicleIndex = this._vehicleTypes.indexOf(vehicleType);
            if (vehicleIndex >= 0) {
                this._selectedVehicleIndex = vehicleIndex;
            }
        }

        // Notify all properties
        this.notifyPropertyChange('userName', this._userName);
        this.notifyPropertyChange('userEmail', this._userEmail);
        this.notifyPropertyChange('phoneNumber', this._phoneNumber);
        this.notifyPropertyChange('address', this._address);
        this.notifyPropertyChange('selectedCountryIndex', this._selectedCountryIndex);
        this.notifyPropertyChange('selectedCityIndex', this._selectedCityIndex);
        this.notifyPropertyChange('selectedProviderIndex', this._selectedProviderIndex);
        this.notifyPropertyChange('pharmacyName', this._pharmacyName);
        this.notifyPropertyChange('licenseNumber', this._licenseNumber);
        this.notifyPropertyChange('selectedVehicleIndex', this._selectedVehicleIndex);
    }

    private updateInitials(): void {
        const name = this._userName || '';
        const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
            this._userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else {
            const cleanName = name.trim();
            this._userInitials = cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase() || 'U';
        }
        this.notifyPropertyChange('userInitials', this._userInitials);
    }

    private updateCitiesForCountry(countryCode: string): void {
        this._cities = getCitiesByCountry(countryCode);
        this._selectedCityIndex = 0;
        this.notifyPropertyChange('cityNames', this.cityNames);
        this.notifyPropertyChange('selectedCityIndex', 0);
    }

    private updateProvidersForCountry(country: Country): void {
        this._providers = getProvidersByRegion(country.region);
        this._selectedProviderIndex = 0;
        this.notifyPropertyChange('providerNames', this.providerNames);
        this.notifyPropertyChange('selectedProviderIndex', 0);
    }

    /**
     * Save profile changes
     */
    async onSave(): Promise<void> {
        if (this.isSaving) return;

        // Validate
        if (!this.validateForm()) return;

        this.isSaving = true;
        this.errorMessage = '';

        try {
            const selectedCountry = this._countries[this._selectedCountryIndex];
            const selectedCity = this._cities[this._selectedCityIndex];
            const selectedProvider = this._providers[this._selectedProviderIndex];

            const updates: Record<string, any> = {
                name: this._userName.trim(),
                phoneNumber: this._phoneNumber.trim(),
                location: {
                    countryCode: selectedCountry?.code,
                    countryName: selectedCountry?.name,
                    cityId: selectedCity?.id,
                    cityName: selectedCity?.name,
                    region: selectedCountry?.region,
                    currency: selectedCountry?.currency,
                    address: this._address.trim()
                },
                mobileMoneyProvider: selectedProvider?.id,
                mobileMoneyProviderName: selectedProvider?.name
            };

            // Pharmacy-specific updates
            if (this._isPharmacy) {
                updates.pharmacyName = this._pharmacyName.trim();
                updates.licenseNumber = this._licenseNumber.trim();
            }

            // Courier-specific updates
            if (this._isCourier) {
                updates.vehicleType = this._vehicleTypes[this._selectedVehicleIndex];
            }

            const success = await this.authSession.updateUserProfile(updates);

            if (success) {
                await Dialogs.alert({
                    title: 'Success',
                    message: 'Your profile has been updated.',
                    okButtonText: 'OK'
                });
                this.navigationService.goBack();
            } else {
                this.errorMessage = 'Failed to update profile. Please try again.';
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.errorMessage = 'An error occurred. Please try again.';
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Validate form before saving
     */
    private validateForm(): boolean {
        if (!this._userName.trim()) {
            this.errorMessage = 'Please enter your name';
            return false;
        }

        if (!this._phoneNumber.trim()) {
            this.errorMessage = 'Please enter your phone number';
            return false;
        }

        if (this._isPharmacy) {
            if (!this._pharmacyName.trim()) {
                this.errorMessage = 'Please enter pharmacy name';
                return false;
            }
            if (!this._licenseNumber.trim()) {
                this.errorMessage = 'Please enter license number';
                return false;
            }
        }

        return true;
    }

    /**
     * Cancel editing
     */
    onCancel(): void {
        this.navigationService.goBack();
    }
}
