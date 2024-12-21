export interface AuthCredentials {
    email: string;
    password: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    currentUser: User | null;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    phoneNumber: string;
}

export type UserRole = 'admin' | 'pharmacist' | 'courier';