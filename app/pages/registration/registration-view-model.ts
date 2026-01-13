import { Observable } from '@nativescript/core';
import { NavigationService } from '../../services/navigation.service';
import { getAuthSessionService, AuthSessionService } from '../../services/auth-session.service';
import { ValidationUtil } from '../../utils/validation.util';
import { InputSanitizerService } from '../../services/utils/input-sanitizer.service';
import { GeolocationService, GeoCoordinates } from '../../services/geolocation.service';
import {
    Country,
    City,
    getActiveCountries,
    getCitiesByCountry
} from '../../models/location.model';
import {
    MobileMoneyProvider,
    getProvidersByRegion
} from '../../models/wallet.model';
import type { UserLocation } from '../../models/user.model';

export class RegistrationViewModel extends Observable {
    private navigationService: NavigationService;
    private authSession: AuthSessionService;
    private validationUtil: ValidationUtil;
    private sanitizer: InputSanitizerService;
    private geolocationService: GeolocationService;

    // Form fields
    public userTypeIndex: number = 0;
    public email: string = '';
    public password: string = '';
    public phoneNumber: string = '';
    public pharmacyName: string = '';
    public licenseNumber: string = '';
    public address: string = '';  // Street address / landmark description
    public vehicleTypes: string[] = ['Motorcycle', 'Car', 'Van'];
    public selectedVehicleIndex: number = 0;
    public errorMessage: string = '';

    // GPS coordinates for pharmacies
    private _coordinates: GeoCoordinates | null = null;
    private _isCapturingLocation: boolean = false;
    private _locationCaptured: boolean = false;
    private _coordinatesDisplay: string = '';

    // Location fields
    private _countries: Country[] = [];
    private _cities: City[] = [];
    private _selectedCountryIndex: number = 0;
    private _selectedCityIndex: number = 0;

    // Mobile Money Provider fields
    private _providers: MobileMoneyProvider[] = [];
    private _selectedProviderIndex: number = 0;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authSession = getAuthSessionService();
        this.validationUtil = ValidationUtil.getInstance();
        this.sanitizer = InputSanitizerService.getInstance();
        this.geolocationService = GeolocationService.getInstance();

        // Initialize countries list
        this._countries = getActiveCountries();
        this.notifyPropertyChange('countries', this.countryNames);

        // Initialize cities and providers for the first country
        if (this._countries.length > 0) {
            this.updateCitiesForCountry(this._countries[0].code);
            this.updateProvidersForCountry(this._countries[0]);
        }

    }

    // GPS coordinate getters for UI binding
    get isCapturingLocation(): boolean {
        return this._isCapturingLocation;
    }

    get locationCaptured(): boolean {
        return this._locationCaptured;
    }

    get coordinatesDisplay(): string {
        return this._coordinatesDisplay;
    }

    get captureButtonText(): string {
        if (this._isCapturingLocation) {
            return 'Capturing GPS...';
        }
        if (this._locationCaptured) {
            return 'Recapture GPS Location';
        }
        return 'Capture GPS Location';
    }

    /**
     * Capture current GPS coordinates for pharmacy location
     * In demo mode, uses mock coordinates based on selected city
     */
    async onCaptureLocation() {
        if (this._isCapturingLocation) return;

        this._isCapturingLocation = true;
        this.notifyPropertyChange('isCapturingLocation', true);
        this.notifyPropertyChange('captureButtonText', this.captureButtonText);
        this.set('errorMessage', '');

        try {
            let coords: GeoCoordinates | null = null;

            // In demo mode, use unique mock coordinates for each pharmacy
            if (this.geolocationService.isDemoMode()) {
                coords = this.geolocationService.getNextDemoPharmacyLocation();
                console.log(`Demo mode: Assigned unique pharmacy location`);
            } else {
                // Production: Get real GPS coordinates
                coords = await this.geolocationService.getHighAccuracyLocation();
            }

            if (coords) {
                // Validate coordinates
                if (!this.geolocationService.validateCoordinates(coords)) {
                    this.set('errorMessage', 'Invalid GPS coordinates received. Please try again.');
                    return;
                }

                // Optionally warn if not in Africa (but don't block)
                if (!this.geolocationService.isWithinAfrica(coords)) {
                    console.warn('Coordinates are outside Africa bounds - allowing anyway');
                }

                this._coordinates = coords;
                this._locationCaptured = true;
                this._coordinatesDisplay = this.geolocationService.formatCoordinates(coords);

                // In demo mode, add indicator
                if (this.geolocationService.isDemoMode()) {
                    this._coordinatesDisplay += ' (Demo)';
                }

                this.notifyPropertyChange('locationCaptured', true);
                this.notifyPropertyChange('coordinatesDisplay', this._coordinatesDisplay);
            } else {
                this.set('errorMessage', 'Could not capture GPS location. Please ensure location services are enabled.');
            }
        } catch (error) {
            console.error('Error capturing location:', error);
            this.set('errorMessage', 'Failed to capture GPS location. Please try again.');
        } finally {
            this._isCapturingLocation = false;
            this.notifyPropertyChange('isCapturingLocation', false);
            this.notifyPropertyChange('captureButtonText', this.captureButtonText);
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

            // Update cities and providers when country changes
            if (this._countries[value]) {
                this.updateCitiesForCountry(this._countries[value].code);
                this.updateProvidersForCountry(this._countries[value]);
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
     * Update providers list when country changes
     */
    private updateProvidersForCountry(country: Country): void {
        this._providers = getProvidersByRegion(country.region);
        this._selectedProviderIndex = 0;
        this.notifyPropertyChange('providerNames', this.providerNames);
        this.notifyPropertyChange('selectedProviderIndex', 0);
    }

    // Mobile Money Provider getters
    get providerNames(): string[] {
        return this._providers.map(p => p.name);
    }

    get selectedProviderIndex(): number {
        return this._selectedProviderIndex;
    }

    set selectedProviderIndex(value: number) {
        if (this._selectedProviderIndex !== value) {
            this._selectedProviderIndex = value;
            this.notifyPropertyChange('selectedProviderIndex', value);
        }
    }

    get selectedProvider(): MobileMoneyProvider | undefined {
        return this._providers[this._selectedProviderIndex];
    }

    /**
     * Build UserLocation from selected values
     * For pharmacies, includes GPS coordinates (required for new registrations)
     */
    private buildUserLocation(): UserLocation | undefined {
        const country = this.selectedCountry;
        const city = this.selectedCity;

        if (!country || !city) {
            return undefined;
        }

        const baseLocation: UserLocation = {
            countryCode: country.code,
            countryName: country.name,
            cityId: city.id,
            cityName: city.name,
            region: country.region,
            currency: country.currency,
            address: this.sanitizer.sanitizeAddress(this.address)
        };

        // For pharmacies, add GPS coordinates (required for new registrations)
        if (this.isPharmacy && this._coordinates) {
            return {
                ...baseLocation,
                coordinates: {
                    latitude: this._coordinates.latitude,
                    longitude: this._coordinates.longitude,
                    accuracy: this._coordinates.accuracy,
                    capturedAt: this._coordinates.timestamp
                }
            };
        }

        return baseLocation;
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

            // Add mobile money provider for wallet operations (applies to both roles)
            const provider = this.selectedProvider;
            if (provider) {
                registrationData.mobileMoneyProvider = provider.id;
                registrationData.mobileMoneyProviderName = provider.name;
            }

            if (this.isPharmacy) {
                registrationData.pharmacyName = this.sanitizer.sanitizeName(this.pharmacyName);
                registrationData.licenseNumber = this.sanitizer.sanitizeLicenseNumber(this.licenseNumber);
                registrationData.address = location?.address || this.sanitizer.sanitizeAddress(this.address);
                // Default to Free plan - user will choose plan after registration
                registrationData.subscriptionPlanId = 'plan_free';
                registrationData.subscriptionPlanType = 'free';
                registrationData.subscriptionStatus = 'active';
                registrationData.hasActiveSubscription = true;
            } else {
                registrationData.vehicleType = this.vehicleTypes[this.selectedVehicleIndex];
                // For couriers, set their operating cities to their initial city
                if (location?.cityId) {
                    registrationData.operatingCities = [location.cityId];
                }
            }

            const success = await this.authSession.register(registrationData);
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

            // Either GPS coordinates OR a detailed address is required
            // GPS is preferred for African markets where street addresses are often unreliable
            const hasAddress = this.address && this.address.trim().length >= 5;
            const hasGPS = this._coordinates && this._locationCaptured;

            if (!hasAddress && !hasGPS) {
                this.set('errorMessage', 'Please capture your GPS location OR enter a detailed address/landmark description');
                return false;
            }
        }

        return true;
    }
}