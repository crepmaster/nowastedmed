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

    private stats: AdminStats = {
        totalPharmacies: 0,
        totalCouriers: 0,
        totalExchanges: 0,
        activeExchanges: 0,
        totalMedicines: 0,
        savingsAmount: 0
    };

    private constructor() {
        super();
        this.pharmacyDb = PharmacyDatabaseService.getInstance();
        this.courierDb = CourierDatabaseService.getInstance();
        this.exchangeDb = ExchangeDatabaseService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.authService = AuthService.getInstance();

        // Initialize stats
        this.refreshStats();
    }

    static getInstance(): AdminService {
        if (!AdminService.instance) {
            AdminService.instance = new AdminService();
        }
        return AdminService.instance;
    }

    async refreshStats(): Promise<void> {
        try {
            console.log('Refreshing admin stats...');
            
            const registeredUsers = this.authService.getRegisteredUsers();
            const pharmacies = registeredUsers.filter(user => user.role === 'pharmacist');
            const couriers = registeredUsers.filter(user => user.role === 'courier');
            const exchanges = await this.exchangeDb.getAllExchanges();
            const medicines = await this.medicineService.getAllMedicines();
            const activeExchanges = exchanges.filter(e => 
                e.status === 'pending' || e.status === 'in_transit'
            ).length;

            const newStats = {
                totalPharmacies: pharmacies.length,
                totalCouriers: couriers.length,
                totalExchanges: exchanges.length,
                activeExchanges: activeExchanges,
                totalMedicines: medicines.length,
                savingsAmount: this.calculateSavings(exchanges)
            };

            this.stats = newStats;
            this.notifyPropertyChange('stats', this.stats);
        } catch (error) {
            console.error('Error refreshing stats:', error);
        }
    }

    getStats(): AdminStats {
        return this.stats;
    }

    private calculateSavings(exchanges: any[]): number {
        return exchanges.length * 100;
    }
}