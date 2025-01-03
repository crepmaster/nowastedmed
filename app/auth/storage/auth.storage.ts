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
            console.log('Saving users:', users);
            const usersJson = JSON.stringify(users);
            ApplicationSettings.setString(this.USERS_KEY, usersJson);
            // Verify the save
            const savedJson = ApplicationSettings.getString(this.USERS_KEY);
            console.log('Saved users JSON:', savedJson);
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    loadUsers(): User[] {
        try {
            const usersJson = ApplicationSettings.getString(this.USERS_KEY);
            console.log('Loading users from storage:', usersJson);
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    clearUsers(): void {
        ApplicationSettings.remove(this.USERS_KEY);
    }
}