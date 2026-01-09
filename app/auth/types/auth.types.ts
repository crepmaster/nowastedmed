import type { User, UserRole, Pharmacist, Courier } from '../../models/user.model';

// Re-export user types for convenience
export type { User, UserRole, Pharmacist, Courier };

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    currentUser: User | null;
}