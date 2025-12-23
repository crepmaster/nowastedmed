import { Observable, Dialogs, Frame } from '@nativescript/core';
import {
    AdminLocationFirebaseService,
    CountryDocument,
    CityDocument,
    CourierAssignment,
} from '../../../services/firebase/admin-location-firebase.service';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { SupportedRegion } from '../../../models/wallet.model';

interface LocationStats {
    totalCountries: number;
    activeCountries: number;
    totalCities: number;
    activeCities: number;
    totalCouriers: number;
    totalAssignments: number;
}

export class LocationManagementViewModel extends Observable {
    private adminService: AdminLocationFirebaseService;
    private authService: AuthFirebaseService;

    private _selectedTabIndex: number = 0;
    private _isLoading: boolean = true;
    private _countries: CountryDocument[] = [];
    private _cities: CityDocument[] = [];
    private _filteredCities: CityDocument[] = [];
    private _allCouriers: any[] = [];
    private _unassignedCouriers: any[] = [];
    private _selectedCountryIndex: number = 0;
    private _stats: LocationStats = {
        totalCountries: 0,
        activeCountries: 0,
        totalCities: 0,
        activeCities: 0,
        totalCouriers: 0,
        totalAssignments: 0,
    };

    constructor() {
        super();
        this.adminService = AdminLocationFirebaseService.getInstance();
        this.authService = AuthFirebaseService.getInstance();

        this.loadData();
    }

    // Getters and Setters
    get selectedTabIndex(): number { return this._selectedTabIndex; }
    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get countries(): CountryDocument[] { return this._countries; }
    set countries(value: CountryDocument[]) {
        this._countries = value;
        this.notifyPropertyChange('countries', value);
        this.notifyPropertyChange('countryNames', this.countryNames);
    }

    get countryNames(): string[] {
        return this._countries.map(c => `${c.name} (${c.code})`);
    }

    get cities(): CityDocument[] { return this._cities; }
    set cities(value: CityDocument[]) {
        this._cities = value;
        this.notifyPropertyChange('cities', value);
        this.filterCitiesByCountry();
    }

    get filteredCities(): CityDocument[] { return this._filteredCities; }
    set filteredCities(value: CityDocument[]) {
        this._filteredCities = value;
        this.notifyPropertyChange('filteredCities', value);
    }

    get allCouriers(): any[] { return this._allCouriers; }
    set allCouriers(value: any[]) {
        this._allCouriers = value;
        this.notifyPropertyChange('allCouriers', value);
    }

    get unassignedCouriers(): any[] { return this._unassignedCouriers; }
    set unassignedCouriers(value: any[]) {
        this._unassignedCouriers = value;
        this.notifyPropertyChange('unassignedCouriers', value);
    }

    get selectedCountryIndex(): number { return this._selectedCountryIndex; }
    set selectedCountryIndex(value: number) {
        if (this._selectedCountryIndex !== value) {
            this._selectedCountryIndex = value;
            this.notifyPropertyChange('selectedCountryIndex', value);
            this.filterCitiesByCountry();
        }
    }

    get stats(): LocationStats { return this._stats; }
    set stats(value: LocationStats) {
        this._stats = value;
        this.notifyPropertyChange('stats', value);
    }

    get totalCouriersInCountry(): number {
        return this._filteredCities.reduce((sum, city) => sum + (city.courierCount || 0), 0);
    }

    /**
     * Load all data
     */
    private async loadData(): Promise<void> {
        try {
            this.isLoading = true;

            const [countries, cities, couriers, stats] = await Promise.all([
                this.adminService.getAllCountries(false),
                this.adminService.getAllCities(false),
                this.adminService.getAllCouriers(),
                this.adminService.getLocationStats(),
            ]);

            this.countries = countries;
            this.cities = cities;
            this.allCouriers = couriers;
            this.stats = stats;

            // Calculate unassigned couriers
            this.unassignedCouriers = couriers.filter(
                c => !c.operatingCities || c.operatingCities.length === 0
            );

        } catch (error) {
            console.error('Error loading location data:', error);
            await Dialogs.alert({
                title: 'Error',
                message: 'Failed to load location data',
                okButtonText: 'OK',
            });
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Filter cities by selected country
     */
    private filterCitiesByCountry(): void {
        const selectedCountry = this._countries[this._selectedCountryIndex];
        if (selectedCountry) {
            this.filteredCities = this._cities.filter(
                c => c.countryCode === selectedCountry.code
            );
        } else {
            this.filteredCities = [];
        }
        this.notifyPropertyChange('totalCouriersInCountry', this.totalCouriersInCountry);
    }

    // ========================================
    // COUNTRY ACTIONS
    // ========================================

    async onAddCountry(): Promise<void> {
        try {
            // Get country details via dialogs
            const codeResult = await Dialogs.prompt({
                title: 'Add Country',
                message: 'Enter country code (e.g., BJ, NG, KE):',
                okButtonText: 'Next',
                cancelButtonText: 'Cancel',
                inputType: 'text',
            });

            if (!codeResult.result || !codeResult.text) return;
            const code = codeResult.text.toUpperCase();

            const nameResult = await Dialogs.prompt({
                title: 'Add Country',
                message: 'Enter country name:',
                okButtonText: 'Next',
                cancelButtonText: 'Cancel',
                inputType: 'text',
            });

            if (!nameResult.result || !nameResult.text) return;
            const name = nameResult.text;

            // Select region
            const regionResult = await Dialogs.action({
                title: 'Select Region',
                message: 'Choose the region for this country:',
                cancelButtonText: 'Cancel',
                actions: [
                    'West Africa (XOF)',
                    'West Africa (NGN)',
                    'West Africa (GHS)',
                    'West Africa (GNF)',
                    'East Africa (KES)',
                    'East Africa (TZS)',
                    'East Africa (UGX)',
                    'Southern Africa (BWP)',
                ],
            });

            if (!regionResult || regionResult === 'Cancel') return;

            const regionMap: { [key: string]: SupportedRegion } = {
                'West Africa (XOF)': 'west_africa_xof',
                'West Africa (NGN)': 'west_africa_ngn',
                'West Africa (GHS)': 'west_africa_ghs',
                'West Africa (GNF)': 'west_africa_gnf',
                'East Africa (KES)': 'east_africa_kes',
                'East Africa (TZS)': 'east_africa_tzs',
                'East Africa (UGX)': 'east_africa_ugx',
                'Southern Africa (BWP)': 'southern_africa_bwp',
            };

            const region = regionMap[regionResult];
            const currencyMap: { [key: string]: string } = {
                'west_africa_xof': 'XOF',
                'west_africa_ngn': 'NGN',
                'west_africa_ghs': 'GHS',
                'west_africa_gnf': 'GNF',
                'east_africa_kes': 'KES',
                'east_africa_tzs': 'TZS',
                'east_africa_ugx': 'UGX',
                'southern_africa_bwp': 'BWP',
            };
            const currency = currencyMap[region];

            const phonePrefixResult = await Dialogs.prompt({
                title: 'Add Country',
                message: 'Enter phone prefix (e.g., +229):',
                okButtonText: 'Create',
                cancelButtonText: 'Cancel',
                inputType: 'text',
                defaultText: '+',
            });

            if (!phonePrefixResult.result || !phonePrefixResult.text) return;
            const phonePrefix = phonePrefixResult.text;

            // Create the country
            await this.adminService.createCountry({
                code,
                name,
                region,
                currency,
                phonePrefix,
            });

            await Dialogs.alert({
                title: 'Success',
                message: `Country "${name}" has been created.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error adding country:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to create country',
                okButtonText: 'OK',
            });
        }
    }

    async onEditCountry(args: any): Promise<void> {
        const country: CountryDocument = args.object.bindingContext;

        const result = await Dialogs.action({
            title: `Edit ${country.name}`,
            message: `Code: ${country.code}\nCurrency: ${country.currency}\nRegion: ${country.region}`,
            cancelButtonText: 'Close',
            actions: [
                country.isActive ? 'Deactivate Country' : 'Activate Country',
                'Edit Name',
            ],
        });

        if (result === 'Deactivate Country' || result === 'Activate Country') {
            const confirmed = await Dialogs.confirm({
                title: 'Confirm',
                message: `Are you sure you want to ${country.isActive ? 'deactivate' : 'activate'} ${country.name}?`,
                okButtonText: 'Yes',
                cancelButtonText: 'No',
            });

            if (confirmed) {
                await this.adminService.toggleCountryStatus(country.id, !country.isActive);
                await this.loadData();
            }
        } else if (result === 'Edit Name') {
            const nameResult = await Dialogs.prompt({
                title: 'Edit Country Name',
                message: 'Enter new name:',
                okButtonText: 'Save',
                cancelButtonText: 'Cancel',
                defaultText: country.name,
            });

            if (nameResult.result && nameResult.text) {
                await this.adminService.updateCountry(country.id, { name: nameResult.text });
                await this.loadData();
            }
        }
    }

    // ========================================
    // CITY ACTIONS
    // ========================================

    async onAddCity(): Promise<void> {
        try {
            const selectedCountry = this._countries[this._selectedCountryIndex];
            if (!selectedCountry) {
                await Dialogs.alert({
                    title: 'Error',
                    message: 'Please select a country first',
                    okButtonText: 'OK',
                });
                return;
            }

            const nameResult = await Dialogs.prompt({
                title: `Add City to ${selectedCountry.name}`,
                message: 'Enter city name:',
                okButtonText: 'Next',
                cancelButtonText: 'Cancel',
                inputType: 'text',
            });

            if (!nameResult.result || !nameResult.text) return;
            const name = nameResult.text;

            const isCapitalResult = await Dialogs.confirm({
                title: 'Capital City',
                message: `Is ${name} the capital of ${selectedCountry.name}?`,
                okButtonText: 'Yes',
                cancelButtonText: 'No',
            });

            await this.adminService.createCity({
                name,
                countryCode: selectedCountry.code,
                isCapital: isCapitalResult,
            });

            await Dialogs.alert({
                title: 'Success',
                message: `City "${name}" has been created in ${selectedCountry.name}.`,
                okButtonText: 'OK',
            });

            await this.loadData();

        } catch (error: any) {
            console.error('Error adding city:', error);
            await Dialogs.alert({
                title: 'Error',
                message: error.message || 'Failed to create city',
                okButtonText: 'OK',
            });
        }
    }

    async onManageCity(args: any): Promise<void> {
        const city: CityDocument = args.object.bindingContext;

        Frame.topmost().navigate({
            moduleName: 'pages/admin/locations/city-details-page',
            context: { cityId: city.id },
        });
    }

    async onCityTap(args: any): Promise<void> {
        const city: CityDocument = args.object.bindingContext;

        const result = await Dialogs.action({
            title: city.name,
            message: `${city.courierCount || 0} couriers assigned`,
            cancelButtonText: 'Close',
            actions: [
                city.isActive ? 'Deactivate City' : 'Activate City',
                'Manage Couriers',
                'Edit Name',
            ],
        });

        if (result === 'Deactivate City' || result === 'Activate City') {
            const confirmed = await Dialogs.confirm({
                title: 'Confirm',
                message: `Are you sure you want to ${city.isActive ? 'deactivate' : 'activate'} ${city.name}?`,
                okButtonText: 'Yes',
                cancelButtonText: 'No',
            });

            if (confirmed) {
                await this.adminService.toggleCityStatus(city.id, !city.isActive);
                await this.loadData();
            }
        } else if (result === 'Manage Couriers') {
            Frame.topmost().navigate({
                moduleName: 'pages/admin/locations/city-details-page',
                context: { cityId: city.id },
            });
        } else if (result === 'Edit Name') {
            const nameResult = await Dialogs.prompt({
                title: 'Edit City Name',
                message: 'Enter new name:',
                okButtonText: 'Save',
                cancelButtonText: 'Cancel',
                defaultText: city.name,
            });

            if (nameResult.result && nameResult.text) {
                await this.adminService.updateCity(city.id, { name: nameResult.text });
                await this.loadData();
            }
        }
    }

    // ========================================
    // COURIER ACTIONS
    // ========================================

    async onAssignCourier(args: any): Promise<void> {
        const courier = args.object.bindingContext;

        // Let admin select city to assign courier to
        const cityNames = this._cities
            .filter(c => c.isActive)
            .map(c => `${c.name} (${c.countryCode})`);

        if (cityNames.length === 0) {
            await Dialogs.alert({
                title: 'No Cities',
                message: 'Please create cities first before assigning couriers.',
                okButtonText: 'OK',
            });
            return;
        }

        const result = await Dialogs.action({
            title: `Assign ${courier.name}`,
            message: 'Select a city to assign this courier:',
            cancelButtonText: 'Cancel',
            actions: cityNames,
        });

        if (!result || result === 'Cancel') return;

        // Find the selected city
        const selectedCityIndex = cityNames.indexOf(result);
        const activeCities = this._cities.filter(c => c.isActive);
        const selectedCity = activeCities[selectedCityIndex];

        if (!selectedCity) return;

        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('Admin user not found');
            }

            await this.adminService.assignCourierToCity(
                courier.id,
                selectedCity.id,
                currentUser.id
            );

            await Dialogs.alert({
                title: 'Success',
                message: `${courier.name} has been assigned to ${selectedCity.name}.`,
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
     * Refresh data
     */
    async onRefresh(): Promise<void> {
        await this.loadData();
    }
}
