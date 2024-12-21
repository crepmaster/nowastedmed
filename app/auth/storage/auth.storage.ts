import { ApplicationSettings } from '@nativescript/core';
import { User } from '../types/auth.types';

export class AuthStorage {
    private static instance: AuthStorage;
    private readonly USERS_KEY = 'registered_users';

    static getInstance(): AuthStorage {
        if (!AuthStorage.instance) {
            AuthStorage.instance = new AuthStorage();
        }
        return AuthStorage.instance;
    }

    saveUsers(users: User[]): void {
        try {
            console.log('Saving users to storage:', users);
            ApplicationSettings.setString(this.USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    loadUsers(): User[] {
        try {
            const usersJson = ApplicationSettings.getString(this.USERS_KEY);
            const users = usersJson ? JSON.parse(usersJson) : [];
            console.log('Loaded users from storage:', users);
            return users;
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    clearUsers(): void {
        ApplicationSettings.remove(this.USERS_KEY);
    }
}