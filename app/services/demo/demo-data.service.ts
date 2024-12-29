import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { AuthStorage } from '../../auth/storage/auth.storage';

export class DemoDataService {
    private static instance: DemoDataService;
    private authService: AuthService;
    private securityService: SecurityService;
    private authStorage: AuthStorage;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.securityService = SecurityService.getInstance();
        this.authStorage = AuthStorage.getInstance();
    }

    static getInstance(): DemoDataService {
        if (!DemoDataService.instance) {
            DemoDataService.instance = new DemoDataService();
        }
        return DemoDataService.instance;
    }

    async initializeDemoData(): Promise<void> {
        try {
            // Clear existing users for demo purposes
            this.authStorage.clearUsers();
            
            // Create first demo pharmacy
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

            // Create second demo pharmacy
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
            const success1 = await this.authService.register(demoPharmacy1);
            const success2 = await this.authService.register(demoPharmacy2);

            if (success1 && success2) {
                console.log('Demo pharmacies created successfully');
                console.log('Pharmacy 1 credentials:', {
                    email: demoPharmacy1.email,
                    password: demoPharmacy1.password
                });
                console.log('Pharmacy 2 credentials:', {
                    email: demoPharmacy2.email,
                    password: demoPharmacy2.password
                });
                
                const users = this.authStorage.loadUsers();
                console.log('Current users:', users);
            } else {
                console.error('Failed to create demo pharmacies');
            }
        } catch (error) {
            console.error('Error initializing demo data:', error);
        }
    }
}