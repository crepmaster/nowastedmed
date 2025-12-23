import { ApplicationSettings } from '@nativescript/core';
import { User } from '../types/auth.types';

/**
 * Auth Storage - Handles local user data persistence
 *
 * NOTE: For production, user data should be stored in Firebase.
 * This is kept for offline/demo functionality only.
 */
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
            const usersJson = JSON.stringify(users);
            ApplicationSettings.setString(this.USERS_KEY, usersJson);
        } catch (error) {
            console.error('Error saving user data');
        }
    }

    loadUsers(): User[] {
        try {
            const usersJson = ApplicationSettings.getString(this.USERS_KEY);
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            console.error('Error loading user data');
            return [];
        }
    }

    clearUsers(): void {
        ApplicationSettings.remove(this.USERS_KEY);
    }
}