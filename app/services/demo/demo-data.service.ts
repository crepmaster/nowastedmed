import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { AuthStorage } from '../../auth/storage/auth.storage';
import { ExchangeStorage } from '../storage/exchange.storage';
import { MedicineService } from '../medicine.service';

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

    async initializeDemoData(): Promise<void> {
        try {
            console.log('Clearing all existing data...');
            
            // Clear all data
            this.authStorage.clearUsers();
            this.exchangeStorage.clearExchanges();
            this.medicineService.clearAllMedicines();
            
            console.log('All data cleared. Creating demo pharmacies...');

            // Create demo pharmacies without medicines
            const demoPharmacy1 = {
                email: 'pharmacy1@demo.com',
                password: 'Demo@123',
                role: 'pharmacist',
                pharmacyName: 'Central Pharmacy',
                name: 'Central Pharmacy',
                phoneNumber: '+1234567890',
                license: 'PHR123456',
                address: '123 Main St'
            };

            const demoPharmacy2 = {
                email: 'pharmacy2@demo.com',
                password: 'Demo@123',
                role: 'pharmacist',
                pharmacyName: 'City Pharmacy',
                name: 'City Pharmacy',
                phoneNumber: '+1987654321',
                license: 'PHR789012',
                address: '456 Oak St'
            };

            // Register both pharmacies
            await this.authService.register(demoPharmacy1);
            await this.authService.register(demoPharmacy2);

            console.log('Demo pharmacies created successfully');
            console.log('Initialization complete - no medicines added');
        } catch (error) {
            console.error('Error initializing demo data:', error);
        }
    }
}