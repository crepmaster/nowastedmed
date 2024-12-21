import { Observable } from '@nativescript/core';
import { Pharmacist } from '../../models/user.model';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../../services/auth.service';

export class PharmacyCrudService extends Observable {
    private static instance: PharmacyCrudService;
    private databaseService: DatabaseService;
    private authService: AuthService;

    private constructor() {
        super();
        this.databaseService = DatabaseService.getInstance();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): PharmacyCrudService {
        if (!PharmacyCrudService.instance) {
            PharmacyCrudService.instance = new PharmacyCrudService();
        }
        return PharmacyCrudService.instance;
    }

    async isPharmacyNameTaken(pharmacyName: string, excludeId?: string): Promise<boolean> {
        const registeredUsers = this.authService.getRegisteredUsers();
        return registeredUsers.some(user => 
            user.role === 'pharmacist' && 
            user.pharmacyName?.toLowerCase() === pharmacyName.toLowerCase() &&
            user.id !== excludeId
        );
    }

    async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
        const registeredUsers = this.authService.getRegisteredUsers();
        return registeredUsers.some(user => 
            user.email.toLowerCase() === email.toLowerCase() &&
            user.id !== excludeId
        );
    }

    async getAll(): Promise<Pharmacist[]> {
        return this.databaseService.getPharmacies();
    }

    async getById(id: string): Promise<Pharmacist | null> {
        return this.databaseService.getPharmacyById(id);
    }

    async create(pharmacy: Partial<Pharmacist>): Promise<Pharmacist> {
        // Check for uniqueness
        if (await this.isPharmacyNameTaken(pharmacy.pharmacyName!)) {
            throw new Error('A pharmacy with this name already exists');
        }
        if (await this.isEmailTaken(pharmacy.email!)) {
            throw new Error('This email is already registered');
        }

        return this.databaseService.createPharmacy(pharmacy);
    }

    async update(id: string, data: Partial<Pharmacist>): Promise<Pharmacist> {
        // Check for uniqueness, excluding the current pharmacy
        if (data.pharmacyName && await this.isPharmacyNameTaken(data.pharmacyName, id)) {
            throw new Error('A pharmacy with this name already exists');
        }
        if (data.email && await this.isEmailTaken(data.email, id)) {
            throw new Error('This email is already registered');
        }

        return this.databaseService.updatePharmacy(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return this.databaseService.deletePharmacy(id);
    }
}