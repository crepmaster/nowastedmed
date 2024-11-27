import { Observable } from '@nativescript/core';
import { AdminStats, UserApproval } from '../models/admin.model';
import { Pharmacist } from '../models/user.model';
import { PharmacyDatabaseService } from './database/pharmacy.service';
import { CourierDatabaseService } from './database/courier.service';
import { ExchangeDatabaseService } from './database/exchange.service';
import { MedicineService } from './medicine.service';

export class AdminService extends Observable {
    private static instance: AdminService;
    private pharmacyDb: PharmacyDatabaseService;
    private courierDb: CourierDatabaseService;
    private exchangeDb: ExchangeDatabaseService;
    private medicineService: MedicineService;

    private constructor() {
        super();
        this.pharmacyDb = PharmacyDatabaseService.getInstance();
        this.courierDb = CourierDatabaseService.getInstance();
        this.exchangeDb = ExchangeDatabaseService.getInstance();
        this.medicineService = MedicineService.getInstance();
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
            const [pharmacies, couriers, exchanges, medicines] = await Promise.all([
                this.pharmacyDb.getAllPharmacies(),
                this.courierDb.getAllCouriers(),
                this.exchangeDb.getAllExchanges(),
                this.medicineService.getAllMedicines()
            ]);

            console.log('Retrieved data for stats:', {
                pharmacies: pharmacies.length,
                couriers: couriers.length,
                exchanges: exchanges.length,
                medicines: medicines.length
            });

            return {
                totalPharmacies: pharmacies.length,
                totalCouriers: couriers.length,
                totalExchanges: exchanges.length,
                totalMedicines: medicines.length,
                savingsAmount: 0
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalPharmacies: 0,
                totalCouriers: 0,
                totalExchanges: 0,
                totalMedicines: 0,
                savingsAmount: 0
            };
        }
    }

    async getPendingApprovals(): Promise<UserApproval[]> {
        return [];
    }

    async approveUser(userId: string): Promise<boolean> {
        return true;
    }

    async rejectUser(userId: string): Promise<boolean> {
        return true;
    }

    async getUserAnalytics(): Promise<any> {
        const pharmacies = await this.getPharmacies();
        return {
            activeUsers: pharmacies.length,
            weeklyGrowth: 0
        };
    }

    async getPharmacies(): Promise<Pharmacist[]> {
        try {
            console.log('Getting pharmacies from admin service...');
            const pharmacies = await this.pharmacyDb.getAllPharmacies();
            console.log('Retrieved pharmacies:', pharmacies);
            return pharmacies;
        } catch (error) {
            console.error('Error getting pharmacies:', error);
            return [];
        }
    }
}