import { Observable } from '@nativescript/core';
import type { Pharmacist, Courier } from '../../models/user.model';
import { AuthService } from '../auth.service';

export class DatabaseService extends Observable {
    private static instance: DatabaseService;
    private authService: AuthService;

    private constructor() {
        super();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    // Pharmacy Methods
    async getPharmacies(): Promise<Pharmacist[]> {
        const users = this.authService.getRegisteredUsers();
        return users.filter(user => user.role === 'pharmacist') as Pharmacist[];
    }

    async getPharmacyById(id: string): Promise<Pharmacist | null> {
        const users = this.authService.getRegisteredUsers();
        return users.find(user => user.role === 'pharmacist' && user.id === id) as Pharmacist || null;
    }

    async createPharmacy(pharmacy: Partial<Pharmacist>): Promise<Pharmacist> {
        // Registration is now handled by AuthService
        throw new Error('Use AuthService.register() instead');
    }

    async updatePharmacy(id: string, data: Partial<Pharmacist>): Promise<Pharmacist> {
        // TODO: Implement update functionality in AuthService
        throw new Error('Update functionality not implemented');
    }

    async deletePharmacy(id: string): Promise<boolean> {
        // TODO: Implement delete functionality in AuthService
        throw new Error('Delete functionality not implemented');
    }

    // Courier Methods
    async getCouriers(): Promise<Courier[]> {
        const users = this.authService.getRegisteredUsers();
        return users.filter(user => user.role === 'courier') as Courier[];
    }

    async getCourierById(id: string): Promise<Courier | null> {
        const users = this.authService.getRegisteredUsers();
        return users.find(user => user.role === 'courier' && user.id === id) as Courier || null;
    }

    async createCourier(courier: Partial<Courier>): Promise<Courier> {
        // Registration is now handled by AuthService
        throw new Error('Use AuthService.register() instead');
    }

    async updateCourier(id: string, data: Partial<Courier>): Promise<Courier> {
        // TODO: Implement update functionality in AuthService
        throw new Error('Update functionality not implemented');
    }

    async deleteCourier(id: string): Promise<boolean> {
        // TODO: Implement delete functionality in AuthService
        throw new Error('Delete functionality not implemented');
    }
}