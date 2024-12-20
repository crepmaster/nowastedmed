import { Observable } from '@nativescript/core';
import { Pharmacist, Courier } from '../../models/user.model';

export class DatabaseService extends Observable {
    private static instance: DatabaseService;
    private pharmacies: Pharmacist[] = [];
    private couriers: Courier[] = [];

    private constructor() {
        super();
    }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    // Pharmacy Methods
    async getPharmacies(): Promise<Pharmacist[]> {
        return this.pharmacies;
    }

    async getPharmacyById(id: string): Promise<Pharmacist | null> {
        return this.pharmacies.find(p => p.id === id) || null;
    }

    async createPharmacy(pharmacy: Partial<Pharmacist>): Promise<Pharmacist> {
        const newPharmacy = {
            id: Date.now().toString(),
            ...pharmacy
        } as Pharmacist;
        this.pharmacies.push(newPharmacy);
        return newPharmacy;
    }

    async updatePharmacy(id: string, data: Partial<Pharmacist>): Promise<Pharmacist> {
        const index = this.pharmacies.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Pharmacy not found');
        
        this.pharmacies[index] = { ...this.pharmacies[index], ...data };
        return this.pharmacies[index];
    }

    async deletePharmacy(id: string): Promise<boolean> {
        const index = this.pharmacies.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        this.pharmacies.splice(index, 1);
        return true;
    }

    // Courier Methods
    async getCouriers(): Promise<Courier[]> {
        return this.couriers;
    }

    async getCourierById(id: string): Promise<Courier | null> {
        return this.couriers.find(c => c.id === id) || null;
    }

    async createCourier(courier: Partial<Courier>): Promise<Courier> {
        const newCourier = {
            id: Date.now().toString(),
            ...courier
        } as Courier;
        this.couriers.push(newCourier);
        return newCourier;
    }

    async updateCourier(id: string, data: Partial<Courier>): Promise<Courier> {
        const index = this.couriers.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Courier not found');
        
        this.couriers[index] = { ...this.couriers[index], ...data };
        return this.couriers[index];
    }

    async deleteCourier(id: string): Promise<boolean> {
        const index = this.couriers.findIndex(c => c.id === id);
        if (index === -1) return false;
        
        this.couriers.splice(index, 1);
        return true;
    }
}