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
            
            // Create demo pharmacy
            const demoPharmacy = {
                email: 'demo.pharmacy@example.com',
                password: 'Demo@123',
                role: 'pharmacist',
                pharmacyName: 'Demo Pharmacy',
                name: 'Demo Pharmacy',
                phoneNumber: '+1234567890',
                license: 'PHR123456',
                address: '123 Pharmacy St'
            };

            const success = await this.authService.register(demoPharmacy);
            if (success) {
                console.log('Demo pharmacy created successfully');
                const users = this.authStorage.loadUsers();
                console.log('Current users:', users);
            }
        } catch (error) {
            console.error('Error initializing demo data:', error);
        }
    }
}