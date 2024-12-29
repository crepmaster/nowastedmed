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
            // Clear existing data
            this.authStorage.clearUsers();
            this.exchangeStorage.clearExchanges();
            
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
                
                // Get registered users to get their IDs
                const users = this.authStorage.loadUsers();
                const pharmacy1 = users.find(u => u.email === demoPharmacy1.email);
                const pharmacy2 = users.find(u => u.email === demoPharmacy2.email);

                if (pharmacy1 && pharmacy2) {
                    // Add some demo medicines for pharmacy1
                    await this.medicineService.addMedicine({
                        name: 'Aspirin 100mg',
                        quantity: 100,
                        expiryDate: new Date('2024-12-31'),
                        pharmacyId: pharmacy1.id,
                        status: 'available',
                        batchNumber: 'ASP100-001'
                    });

                    // Add demo medicines for pharmacy2
                    await this.medicineService.addMedicine({
                        name: 'Paracetamol 500mg',
                        quantity: 200,
                        expiryDate: new Date('2024-12-31'),
                        pharmacyId: pharmacy2.id,
                        status: 'available',
                        batchNumber: 'PCM500-001'
                    });

                    // Create a demo exchange
                    const exchange = {
                        id: 'DEMO-001',
                        proposedBy: pharmacy1.id,
                        status: 'pending',
                        proposedMedicines: [{
                            medicineId: 'ASP100-001',
                            quantity: 50,
                            medicine: {
                                name: 'Aspirin 100mg',
                                quantity: 50,
                                expiryDate: new Date('2024-12-31')
                            }
                        }],
                        offeredMedicines: [],
                        priority: 'medium',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    this.exchangeStorage.saveExchanges([exchange]);

                    console.log('Demo data initialized successfully');
                    console.log('Pharmacy 1:', pharmacy1);
                    console.log('Pharmacy 2:', pharmacy2);
                    console.log('Demo exchange created:', exchange);
                }
            }
        } catch (error) {
            console.error('Error initializing demo data:', error);
        }
    }
}