import { Observable } from '@nativescript/core';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { ValidationUtil } from '../../utils/validation.util';
import { InputSanitizerService } from '../../services/utils/input-sanitizer.service';
import {
    Country,
    City,
    getActiveCountries,
    getCitiesByCountry,
    getCountryByCode
} from '../../models/location.model';
import { UserLocation } from '../../models/user.model';

export class RegistrationViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private validationUtil: ValidationUtil;
    private sanitizer: InputSanitizerService;

    // Form fields
    public userTypeIndex: number = 0;
    public email: string = '';
    public password: string = '';
    public phoneNumber: string = '';
    public pharmacyName: string = '';
    public licenseNumber: string = '';
    public address: string = '';  // Street address
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van'];
    public selectedVehicleIndex: number = 0;
    public errorMessage: string = '';

    // Location fields
    private _countries: Country[] = [];
    private _cities: City[] = [];
    private _selectedCountryIndex: number = 0;
    private _selectedCityIndex: number = 0;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.validationUtil = ValidationUtil.getInstance();
        this.sanitizer = InputSanitizerService.getInstance();

        // Initialize countries list
        this._countries = getActiveCountries();
        this.notifyPropertyChange('countries', this.countryNames);

        // Initialize cities for the first country
        if (this._countries.length > 0) {
            this.updateCitiesForCountry(this._countries[0].code);
        }
    }

    // Country/City getters and setters
    get countryNames(): string[] {
        return this._countries.map(c => c.name);
    }

    get cityNames(): string[] {
        return this._cities.map(c => c.name);
    }

    get selectedCountryIndex(): number {
        return this._selectedCountryIndex;
    }

    set selectedCountryIndex(value: number) {
        if (this._selectedCountryIndex !== value) {
            this._selectedCountryIndex = value;
            this.notifyPropertyChange('selectedCountryIndex', value);

            // Update cities when country changes
            if (this._countries[value]) {
                this.updateCitiesForCountry(this._countries[value].code);
            }
        }
    }

    get selectedCityIndex(): number {
        return this._selectedCityIndex;
    }

    set selectedCityIndex(value: number) {
        if (this._selectedCityIndex !== value) {
            this._selectedCityIndex = value;
            this.notifyPropertyChange('selectedCityIndex', value);
        }
    }

    get selectedCountry(): Country | undefined {
        return this._countries[this._selectedCountryIndex];
    }

    get selectedCity(): City | undefined {
        return this._cities[this._selectedCityIndex];
    }

    /**
     * Update cities list when country changes
     */
    private updateCitiesForCountry(countryCode: string): void {
        this._cities = getCitiesByCountry(countryCode);
        this._selectedCityIndex = 0;
        this.notifyPropertyChange('cityNames', this.cityNames);
        this.notifyPropertyChange('selectedCityIndex', 0);
    }

    /**
     * Build UserLocation from selected values
     */
    private buildUserLocation(): UserLocation | undefined {
        const country = this.selectedCountry;
        const city = this.selectedCity;

        if (!country || !city) {
            return undefined;
        }

        return {
            countryCode: country.code,
            countryName: country.name,
            cityId: city.id,
            cityName: city.name,
            region: country.region,
            currency: country.currency,
            address: this.sanitizer.sanitizeAddress(this.address)
        };
    }

    get isPharmacy(): boolean {
        return this.userTypeIndex === 0;
    }

    async onSubmit() {
        try {
            if (!this.validateForm()) {
                return;
            }

            // Build location data
            const location = this.buildUserLocation();

            // Sanitize all input data before sending to auth service
            const registrationData: any = {
                email: this.sanitizer.sanitizeEmail(this.email),
                password: this.password, // Don't sanitize password
                phoneNumber: this.sanitizer.sanitizePhoneNumber(this.phoneNumber),
                role: this.isPharmacy ? 'pharmacist' : 'courier',
                location, // Include structured location
            };

            if (this.isPharmacy) {
                registrationData.pharmacyName = this.sanitizer.sanitizeName(this.pharmacyName);
                registrationData.licenseNumber = this.sanitizer.sanitizeLicenseNumber(this.licenseNumber);
                registrationData.address = location?.address || this.sanitizer.sanitizeAddress(this.address);
            } else {
                registrationData.vehicleType = this.vehicleTypes[this.selectedVehicleIndex];
                // For couriers, set their operating cities to their initial city
                if (location?.cityId) {
                    registrationData.operatingCities = [location.cityId];
                }
            }

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

        // Validate location selection (required for all users)
        if (!this.selectedCountry || !this.selectedCity) {
            this.set('errorMessage', 'Please select your country and city');
            return false;
        }

        if (this.isPharmacy) {
            if (!this.pharmacyName || !this.licenseNumber) {
                this.set('errorMessage', 'Please fill in all pharmacy details');
                return false;
            }

            if (!this.address || this.address.trim().length < 5) {
                this.set('errorMessage', 'Please enter your pharmacy address');
                return false;
            }
        }

        return true;
    }
}