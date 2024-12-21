import { User } from '../../auth/types/auth.types';
import { UserStorage } from '../storage/user.storage';
import { SecurityService } from '../security.service';

export class AuthManager {
    private static instance: AuthManager;
    private userStorage: UserStorage;
    private securityService: SecurityService;
    private registeredUsers: User[] = [];

    private constructor() {
        this.userStorage = UserStorage.getInstance();
        this.securityService = SecurityService.getInstance();
        this.loadUsers();
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    private loadUsers(): void {
        this.registeredUsers = this.userStorage.loadUsers();
    }

    getUsers(): User[] {
        return this.registeredUsers;
    }

    addUser(user: User): boolean {
        try {
            this.registeredUsers.push(user);
            this.userStorage.saveUsers(this.registeredUsers);
            return true;
        } catch (error) {
            console.error('Error adding user:', error);
            return false;
        }
    }

    updateUser(id: string, userData: Partial<User>): boolean {
        try {
            const index = this.registeredUsers.findIndex(u => u.id === id);
            if (index === -1) return false;

            this.registeredUsers[index] = {
                ...this.registeredUsers[index],
                ...userData,
                id: this.registeredUsers[index].id,
                role: this.registeredUsers[index].role
            };

            this.userStorage.saveUsers(this.registeredUsers);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    deleteUser(id: string): boolean {
        try {
            const index = this.registeredUsers.findIndex(u => u.id === id);
            if (index === -1) return false;

            this.registeredUsers.splice(index, 1);
            this.userStorage.saveUsers(this.registeredUsers);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }

    clearUsers(): void {
        this.registeredUsers = [];
        this.userStorage.clearUsers();
    }
}