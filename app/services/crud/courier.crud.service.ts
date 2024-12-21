import { Observable } from '@nativescript/core';
import { Courier } from '../../models/user.model';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../../services/auth.service';

export class CourierCrudService extends Observable {
    private static instance: CourierCrudService;
    private databaseService: DatabaseService;
    private authService: AuthService;

    private constructor() {
        super();
        this.databaseService = DatabaseService.getInstance();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): CourierCrudService {
        if (!CourierCrudService.instance) {
            CourierCrudService.instance = new CourierCrudService();
        }
        return CourierCrudService.instance;
    }

    async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
        const registeredUsers = this.authService.getRegisteredUsers();
        return registeredUsers.some(user => 
            user.email.toLowerCase() === email.toLowerCase() &&
            user.id !== excludeId
        );
    }

    async isLicenseNumberTaken(licenseNumber: string, excludeId?: string): Promise<boolean> {
        const registeredUsers = this.authService.getRegisteredUsers();
        return registeredUsers.some(user => 
            user.role === 'courier' && 
            user.licenseNumber?.toLowerCase() === licenseNumber.toLowerCase() &&
            user.id !== excludeId
        );
    }

    async getAll(): Promise<Courier[]> {
        return this.databaseService.getCouriers();
    }

    async getById(id: string): Promise<Courier | null> {
        return this.databaseService.getCourierById(id);
    }

    async create(courier: Partial<Courier>): Promise<Courier> {
        // Check for uniqueness
        if (await this.isEmailTaken(courier.email!)) {
            throw new Error('This email is already registered');
        }
        if (await this.isLicenseNumberTaken(courier.licenseNumber!)) {
            throw new Error('This license number is already registered');
        }

        return this.databaseService.createCourier(courier);
    }

    async update(id: string, data: Partial<Courier>): Promise<Courier> {
        // Check for uniqueness, excluding the current courier
        if (data.email && await this.isEmailTaken(data.email, id)) {
            throw new Error('This email is already registered');
        }
        if (data.licenseNumber && await this.isLicenseNumberTaken(data.licenseNumber, id)) {
            throw new Error('This license number is already registered');
        }

        return this.databaseService.updateCourier(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return this.databaseService.deleteCourier(id);
    }
}