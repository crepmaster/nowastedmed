import { Observable } from '@nativescript/core';
import { Courier, User } from '../../models/user.model';
import { AuthService } from '../auth.service';

export class CourierDatabaseService extends Observable {
    private static instance: CourierDatabaseService;
    private authService: AuthService;
    
    private constructor() {
        super();
        this.authService = AuthService.getInstance();
    }

    static getInstance(): CourierDatabaseService {
        if (!CourierDatabaseService.instance) {
            CourierDatabaseService.instance = new CourierDatabaseService();
        }
        return CourierDatabaseService.instance;
    }

    async getAllCouriers(): Promise<Courier[]> {
        try {
            const registeredUsers = this.authService.getRegisteredUsers();
            return registeredUsers
                .filter(user => user.role === 'courier')
                .map(user => user as Courier);
        } catch (error) {
            console.error('Error getting couriers:', error);
            return [];
        }
    }
}