import { Observable } from '@nativescript/core';
import { AdminStats, UserApproval } from '../models/admin.model';
import { PharmacyDatabaseService } from './database/pharmacy.service';
import { CourierDatabaseService } from './database/courier.service';
import { ExchangeDatabaseService } from './database/exchange.service';
import { MedicineService } from './medicine.service';
import { AuthService } from './auth.service';

export class AdminService extends Observable {
    private static instance: AdminService;
    private pharmacyDb: PharmacyDatabaseService;
    private courierDb: CourierDatabaseService;
    private exchangeDb: ExchangeDatabaseService;
    private medicineService: MedicineService;
    private authService: AuthService;

    private constructor() {
        super();
        this.pharmacyDb = PharmacyDatabaseService.getInstance();
        this.courierDb = CourierDatabaseService.getInstance();
        this.exchangeDb = ExchangeDatabaseService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): AdminService {
        if (!AdminService.instance) {
            AdminService.instance = new AdminService();
        }
        return AdminService.instance;
    }

    async getStats(): Promise<AdminStats> {
        try {
            console.log('Getting admin stats...');
            
            // Get registered users
            const registeredUsers = this.authService.getRegisteredUsers();
            
            // Filter pharmacies and couriers
            const pharmacies = registeredUsers.filter(user => user.role === 'pharmacist');
            const couriers = registeredUsers.filter(user => user.role === 'courier');
            
            // Get exchanges and medicines
            const exchanges = await this.exchangeDb.getAllExchanges();
            const medicines = await this.medicineService.getAllMedicines();
            
            // Calculate active exchanges
            const activeExchanges = exchanges.filter(e => 
                e.status === 'pending' || e.status === 'in_transit'
            ).length;

            return {
                totalPharmacies: pharmacies.length,
                totalCouriers: couriers.length,
                totalExchanges: exchanges.length,
                activeExchanges: activeExchanges,
                totalMedicines: medicines.length,
                savingsAmount: this.calculateSavings(exchanges)
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalPharmacies: 0,
                totalCouriers: 0,
                totalExchanges: 0,
                activeExchanges: 0,
                totalMedicines: 0,
                savingsAmount: 0
            };
        }
    }

    private calculateSavings(exchanges: any[]): number {
        // Implement your savings calculation logic here
        // For now, return a placeholder value
        return exchanges.length * 100; // Example: €100 per exchange
    }
}