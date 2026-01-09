import { Observable } from '@nativescript/core';
import type { Pharmacist, User } from '../../models/user.model';
import { AuthService } from '../auth.service';

export class PharmacyDatabaseService extends Observable {
    private static instance: PharmacyDatabaseService;
    private authService: AuthService;
    
    private constructor() {
        super();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): PharmacyDatabaseService {
        if (!PharmacyDatabaseService.instance) {
            PharmacyDatabaseService.instance = new PharmacyDatabaseService();
        }
        return PharmacyDatabaseService.instance;
    }

    async getAllPharmacies(): Promise<Pharmacist[]> {
        try {
            const registeredUsers = this.authService.getRegisteredUsers();
            const pharmacists = registeredUsers
                .filter(user => user.role === 'pharmacist')
                .map(user => ({
                    ...user,
                    pharmacyName: user.pharmacyName || user.name,
                    address: user.address || '',
                    license: user.license || ''
                }));
            return pharmacists;
        } catch (error) {
            console.error('Error getting pharmacies:', error);
            return [];
        }
    }
}