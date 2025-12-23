import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { AuthStorage } from '../../auth/storage/auth.storage';
import { ExchangeStorage } from '../storage/exchange.storage';
import { MedicineService } from '../medicine.service';

/**
 * Demo Data Service - For development and testing only
 *
 * WARNING: This service should ONLY be used in development/demo mode.
 * Disable or remove this service in production builds.
 */
export class DemoDataService {
    private static instance: DemoDataService;
    private authService: AuthService;
    private securityService: SecurityService;
    private authStorage: AuthStorage;
    private exchangeStorage: ExchangeStorage;
    private medicineService: MedicineService;

    // Demo mode flag - should be false in production
    private static readonly DEMO_MODE_ENABLED = __DEV__ ?? false;

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
     */
    static isDemoModeEnabled(): boolean {
        return DemoDataService.DEMO_MODE_ENABLED;
    }

    /**
     * Initialize demo data for testing
     * Only works when DEMO_MODE_ENABLED is true
     */
    async initializeDemoData(): Promise<void> {
        if (!DemoDataService.DEMO_MODE_ENABLED) {
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
     * Credentials are generated dynamically and only used locally
     */
    private generateDemoAccounts(): any[] {
        const timestamp = Date.now();
        return [
            {
                email: `demo.pharmacy1.${timestamp}@test.local`,
                password: this.securityService.generateSecureToken().substring(0, 12),
                role: 'pharmacist',
                pharmacyName: 'Central Pharmacy',
                name: 'Central Pharmacy',
                phoneNumber: '+1234567890',
                license: 'PHR123456',
                address: '123 Main St'
            },
            {
                email: `demo.pharmacy2.${timestamp}@test.local`,
                password: this.securityService.generateSecureToken().substring(0, 12),
                role: 'pharmacist',
                pharmacyName: 'City Pharmacy',
                name: 'City Pharmacy',
                phoneNumber: '+1987654321',
                license: 'PHR789012',
                address: '456 Oak St'
            }
        ];
    }
}