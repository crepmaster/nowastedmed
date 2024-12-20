import { Observable, ApplicationSettings } from '@nativescript/core';
import { Pharmacist, User, Courier } from '../models/user.model';
import { SecurityService } from './security.service';

export class AuthService extends Observable {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private securityService: SecurityService;
    private registeredUsers: User[] = [];

    private readonly ADMIN_EMAIL = 'ebongueandre@promoshake.net';
    private readonly ADMIN_PASSWORD = '184vi@Tespi!';
    private readonly USERS_KEY = 'registered_users';

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    constructor() {
        super();
        this.securityService = SecurityService.getInstance();
        this.loadUsers();
    }

    private loadUsers() {
        try {
            const usersJson = ApplicationSettings.getString(this.USERS_KEY);
            if (usersJson) {
                this.registeredUsers = JSON.parse(usersJson);
                console.log('Loaded users:', this.registeredUsers);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.registeredUsers = [];
        }
    }

    private saveUsers() {
        try {
            ApplicationSettings.setString(this.USERS_KEY, JSON.stringify(this.registeredUsers));
            console.log('Saved users:', this.registeredUsers);
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    async register(userData: any): Promise<boolean> {
        try {
            const newUser: User = {
                id: userData.id || `user-${Date.now()}`,
                email: userData.email,
                role: userData.role,
                name: userData.pharmacyName || userData.name,
                phoneNumber: userData.phoneNumber,
                password: userData.password
            };

            if (userData.role === 'pharmacist') {
                (newUser as Pharmacist).pharmacyName = userData.pharmacyName;
                (newUser as Pharmacist).address = userData.address;
                (newUser as Pharmacist).license = userData.license;
            } else if (userData.role === 'courier') {
                (newUser as Courier).vehicleType = userData.vehicleType;
                (newUser as Courier).licenseNumber = userData.licenseNumber;
            }

            this.registeredUsers.push(newUser);
            this.saveUsers();
            console.log('User registered:', newUser);
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            // Admin login check
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                this.currentUser = {
                    id: 'admin-1',
                    email: email,
                    role: 'admin',
                    name: 'Administrator',
                    phoneNumber: ''
                };
                return true;
            }

            // Check registered users
            const user = this.registeredUsers.find(u => u.email === email && u.password === password);
            if (user) {
                this.currentUser = user;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    logout(): void {
        this.currentUser = null;
    }

    getRegisteredUsers(): User[] {
        return this.registeredUsers;
    }

    clearAllUsers(): void {
        this.registeredUsers = [];
        this.saveUsers();
    }
}