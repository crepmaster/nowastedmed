import { Observable } from '@nativescript/core';
import { Pharmacist, User } from '../../models/user.model';
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
            console.log('Registered users in pharmacy service:', registeredUsers);
            
            const pharmacists = registeredUsers
                .filter(user => user.role === 'pharmacist')
                .map(user => {
                    const pharmacist = user as Pharmacist;
                    return {
                        ...pharmacist,
                        pharmacyName: pharmacist.pharmacyName || user.name,
                        address: pharmacist.address || '',
                        license: pharmacist.license || ''
                    };
                });

            console.log('Filtered pharmacists:', pharmacists);
            return pharmacists;
        } catch (error) {
            console.error('Error getting pharmacies:', error);
            return [];
        }
    }
}