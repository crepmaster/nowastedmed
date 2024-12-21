import { ApplicationSettings } from '@nativescript/core';
import { User } from '../../auth/types/auth.types';

export class UserStorage {
    private static instance: UserStorage;
    private readonly USERS_KEY = 'registered_users';

    static getInstance(): UserStorage {
        if (!UserStorage.instance) {
            UserStorage.instance = new UserStorage();
        }
        return UserStorage.instance;
    }

    saveUsers(users: User[]): void {
        try {
            ApplicationSettings.setString(this.USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    loadUsers(): User[] {
        try {
            const usersJson = ApplicationSettings.getString(this.USERS_KEY);
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