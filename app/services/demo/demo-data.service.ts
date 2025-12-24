import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { AuthStorage } from '../../auth/storage/auth.storage';
import { ExchangeStorage } from '../storage/exchange.storage';
import { MedicineService } from '../medicine.service';
import { environment } from '../../config/environment.config';
import { GeolocationService } from '../geolocation.service';

/**
 * Demo Data Service - For development and testing only
 *
 * WARNING: This service should ONLY be used in development/demo mode.
 * Disable or remove this service in production builds.
 *
 * Demo Accounts (for quick login buttons):
 * - Pharmacy: demo-pharmacy@nowastedmed.com / demo123
 * - Courier: demo-courier@nowastedmed.com / demo123
 * - Admin: demo-admin@nowastedmed.com / demo123
 */
export class DemoDataService {
    private static instance: DemoDataService;
    private authService: AuthService;
    private securityService: SecurityService;
    private authStorage: AuthStorage;
    private exchangeStorage: ExchangeStorage;
    private medicineService: MedicineService;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.securityService = SecurityService.getInstance();
        this.authStorage = AuthStorage.getInstance();
        this.exchangeStorage = ExchangeStorage.getInstance();
        this.medicineService = MedicineService.getInstance();
    }

    static getInstance(): DemoDataService {
        if (!DemoDataService.instance) {
            DemoDataService.instance = new DemoDataService();
        }
        return DemoDataService.instance;
    }

    /**
     * Check if demo mode is enabled
     * Uses environment configuration
     */
    static isDemoModeEnabled(): boolean {
        return environment.isFeatureEnabled('enableDemoMode');
    }

    /**
     * Initialize demo data for testing
     * Only works when demo mode is enabled in environment config
     */
    async initializeDemoData(): Promise<void> {
        if (!DemoDataService.isDemoModeEnabled()) {
            console.warn('Demo mode is disabled. Skipping demo data initialization.');
            return;
        }

        try {
            console.log('Clearing all existing data...');

            // Clear all data
            this.authStorage.clearUsers();
            this.exchangeStorage.clearExchanges();
            this.medicineService.clearAllMedicines();

            console.log('All data cleared. Creating demo pharmacies...');

            // Demo accounts use generated credentials
            // These are for LOCAL testing only and don't affect Firebase
            const demoAccounts = this.generateDemoAccounts();

            for (const account of demoAccounts) {
                await this.authService.register(account);
            }

            console.log('Demo pharmacies created successfully');
            console.log('Initialization complete - no medicines added');
        } catch (error) {
            console.error('Error initializing demo data:', error);
        }
    }

    /**
     * Generate demo account data
     * Fixed credentials for easy demo access via login buttons
     */
    private generateDemoAccounts(): any[] {
        // Get demo locations for pharmacies
        const locations = this.getDemoLocations();

        return [
            // === Main Demo Accounts (for quick login buttons) ===
            {
                email: 'demo-pharmacy@nowastedmed.com',
                password: 'demo123',
                role: 'pharmacist',
                pharmacyName: 'Pharmacie Centrale Demo',
                name: 'Pharmacie Centrale Demo',
                phoneNumber: '+22997001234',
                license: 'BJ-PHR-DEMO-001',
                address: 'Boulevard Saint-Michel, Cotonou',
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF',
                    coordinates: locations[0]
                }
            },
            {
                email: 'demo-courier@nowastedmed.com',
                password: 'demo123',
                role: 'courier',
                name: 'Kofi Demo Courier',
                phoneNumber: '+22996005678',
                vehicleType: 'motorcycle',
                vehiclePlate: 'BJ-1234-MC',
                operatingCities: ['cotonou'],
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF'
                }
            },
            {
                email: 'demo-admin@nowastedmed.com',
                password: 'demo123',
                role: 'admin',
                name: 'Admin Demo',
                phoneNumber: '+22990009999'
            },

            // === Additional Demo Pharmacies (for testing exchanges) ===
            {
                email: 'pharmacie-akpakpa@demo.local',
                password: 'demo123',
                role: 'pharmacist',
                pharmacyName: 'Pharmacie Akpakpa',
                name: 'Pharmacie Akpakpa',
                phoneNumber: '+22997002345',
                license: 'BJ-PHR-DEMO-002',
                address: 'Quartier Akpakpa, Cotonou',
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF',
                    coordinates: locations[1]
                }
            },
            {
                email: 'pharmacie-ganhi@demo.local',
                password: 'demo123',
                role: 'pharmacist',
                pharmacyName: 'Pharmacie Ganhi',
                name: 'Pharmacie Ganhi',
                phoneNumber: '+22997003456',
                license: 'BJ-PHR-DEMO-003',
                address: 'Quartier Ganhi, Cotonou',
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF',
                    coordinates: locations[2]
                }
            },
            {
                email: 'pharmacie-cadjehoun@demo.local',
                password: 'demo123',
                role: 'pharmacist',
                pharmacyName: 'Pharmacie Cadjehoun',
                name: 'Pharmacie Cadjehoun',
                phoneNumber: '+22997004567',
                license: 'BJ-PHR-DEMO-004',
                address: 'Quartier Cadjehoun, Cotonou',
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF',
                    coordinates: locations[3]
                }
            },
            {
                email: 'pharmacie-fidjrosse@demo.local',
                password: 'demo123',
                role: 'pharmacist',
                pharmacyName: 'Pharmacie Fidjrossè',
                name: 'Pharmacie Fidjrossè',
                phoneNumber: '+22997005678',
                license: 'BJ-PHR-DEMO-005',
                address: 'Quartier Fidjrossè, Cotonou',
                location: {
                    countryCode: 'BJ',
                    cityId: 'cotonou',
                    cityName: 'Cotonou',
                    region: 'west_africa_francophone',
                    currency: 'XOF',
                    coordinates: locations[4]
                }
            }
        ];
    }

    /**
     * Get demo GPS locations for pharmacies in Cotonou
     */
    private getDemoLocations() {
        return [
            { latitude: 6.3654, longitude: 2.4183, accuracy: 10 }, // Dantokpa Market
            { latitude: 6.3589, longitude: 2.4312, accuracy: 10 }, // Akpakpa
            { latitude: 6.3702, longitude: 2.4089, accuracy: 10 }, // Ganhi
            { latitude: 6.3621, longitude: 2.3967, accuracy: 10 }, // Cadjehoun
            { latitude: 6.3478, longitude: 2.3845, accuracy: 10 }, // Fidjrossè
        ];
    }

    /**
     * Reset demo location counter (for re-initialization)
     */
    resetDemoData(): void {
        GeolocationService.getInstance().resetDemoLocationCounter();
    }
}