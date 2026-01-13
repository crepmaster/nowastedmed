/**
 * AuthSessionService - Single source of truth for authentication state
 *
 * P0-1 Refactor: This service wraps getAuthService() and provides:
 * - Centralized currentUser access with Observable notifications
 * - Auth state change events for UI reactivity
 * - Role-based routing helpers
 * - Consistent interface regardless of Firebase/Local backend
 *
 * All view models should use this service instead of:
 * - Direct AuthFirebaseService imports
 * - Direct AuthService imports
 * - Direct getAuthService() calls
 */

import { Observable, EventData } from '@nativescript/core';
import { getAuthService, IAuthService } from './auth-factory.service';
import type { User, UserRole } from '../models/user.model';

/**
 * Auth state change event data
 */
export interface AuthStateChangeEventData extends EventData {
    user: User | null;
    isAuthenticated: boolean;
}

/**
 * Route configuration for role-based navigation
 */
export interface RoleRoute {
    role: UserRole;
    dashboard: string;
}

const ROLE_ROUTES: RoleRoute[] = [
    { role: 'pharmacist', dashboard: 'pages/pharmacy/dashboard/pharmacy-dashboard-page' },
    { role: 'courier', dashboard: 'pages/courier/dashboard/courier-dashboard-page' },
    { role: 'admin', dashboard: 'pages/admin/dashboard/admin-dashboard-page' }
];

/**
 * AuthSessionService - Singleton service for auth state management
 *
 * Usage:
 * ```typescript
 * import { getAuthSessionService } from '~/services/auth-session.service';
 *
 * const authSession = getAuthSessionService();
 * const user = authSession.currentUser;
 *
 * // Subscribe to auth changes
 * authSession.on('authStateChange', (args: AuthStateChangeEventData) => {
 *     console.log('Auth changed:', args.user?.name);
 * });
 * ```
 */
export class AuthSessionService extends Observable {
    private static instance: AuthSessionService;
    private authService: IAuthService | null = null;
    private _currentUser: User | null = null;
    private _isInitialized: boolean = false;

    private constructor() {
        super();
    }

    static getInstance(): AuthSessionService {
        if (!AuthSessionService.instance) {
            AuthSessionService.instance = new AuthSessionService();
        }
        return AuthSessionService.instance;
    }

    /**
     * Initialize the auth session service
     * Call this once during app startup after Firebase is ready
     */
    initialize(): void {
        if (this._isInitialized) {
            console.log('AuthSessionService already initialized');
            return;
        }

        console.log('🔐 Initializing AuthSessionService...');
        this.authService = getAuthService();

        // Get initial user state
        this._currentUser = this.authService.getCurrentUser() as User | null;

        // Listen for changes from underlying auth service (Firebase has Observable)
        if (this.authService && 'on' in this.authService) {
            (this.authService as unknown as Observable).on('propertyChange', (args: any) => {
                if (args.propertyName === 'currentUser') {
                    this.handleUserChange(args.value);
                }
            });
        }

        this._isInitialized = true;
        console.log('✅ AuthSessionService initialized, user:', this._currentUser?.name || 'none');
    }

    /**
     * Handle user change from underlying auth service
     */
    private handleUserChange(user: User | null): void {
        const previousUser = this._currentUser;
        this._currentUser = user;

        // Notify property change for data binding
        this.notifyPropertyChange('currentUser', user);
        this.notifyPropertyChange('isAuthenticated', user !== null);

        // Emit auth state change event
        const eventData: AuthStateChangeEventData = {
            eventName: 'authStateChange',
            object: this,
            user: user,
            isAuthenticated: user !== null
        };
        this.notify(eventData);

        console.log(`🔐 Auth state changed: ${previousUser?.name || 'none'} → ${user?.name || 'none'}`);
    }

    /**
     * Get current authenticated user
     */
    get currentUser(): User | null {
        // Always get fresh value from underlying service
        if (this.authService) {
            this._currentUser = this.authService.getCurrentUser() as User | null;
        }
        return this._currentUser;
    }

    /**
     * Check if user is authenticated
     */
    get isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Get current user's role
     */
    get userRole(): UserRole | null {
        return this.currentUser?.role || null;
    }

    /**
     * Get current user's ID
     */
    get userId(): string | null {
        return this.currentUser?.id || null;
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<boolean> {
        if (!this.authService) {
            this.initialize();
        }

        const success = await this.authService!.login(email, password);

        if (success) {
            // Refresh user state after login
            this._currentUser = this.authService!.getCurrentUser() as User | null;
            this.handleUserChange(this._currentUser);
        }

        return success;
    }

    /**
     * Register a new user
     */
    async register(userData: any): Promise<boolean> {
        if (!this.authService) {
            this.initialize();
        }

        if (this.authService!.register) {
            const success = await this.authService!.register(userData);

            if (success) {
                // Refresh user state after registration
                this._currentUser = this.authService!.getCurrentUser() as User | null;
                this.handleUserChange(this._currentUser);
            }

            return success;
        }

        return false;
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        if (!this.authService) {
            return;
        }

        await this.authService.logout();
        this._currentUser = null;
        this.handleUserChange(null);
    }

    /**
     * Get dashboard route for current user's role
     */
    getDashboardRoute(): string | null {
        const role = this.userRole;
        if (!role) return null;

        const route = ROLE_ROUTES.find(r => r.role === role);
        return route?.dashboard || null;
    }

    /**
     * Get dashboard route for a specific role
     */
    getDashboardRouteForRole(role: UserRole): string {
        const route = ROLE_ROUTES.find(r => r.role === role);
        return route?.dashboard || 'pages/login/login-page';
    }

    /**
     * Check if current user has a specific role
     */
    hasRole(role: UserRole): boolean {
        return this.userRole === role;
    }

    /**
     * Check if current user is a pharmacist
     */
    get isPharmacist(): boolean {
        return this.hasRole('pharmacist');
    }

    /**
     * Check if current user is a courier
     */
    get isCourier(): boolean {
        return this.hasRole('courier');
    }

    /**
     * Check if current user is an admin
     */
    get isAdmin(): boolean {
        return this.hasRole('admin');
    }

    /**
     * Update current user's profile
     * Only available with Firebase backend
     */
    async updateProfile(updates: Partial<User>): Promise<boolean> {
        if (!this.authService) {
            return false;
        }

        // Check if the underlying service supports profile updates
        if ('updateUserProfile' in this.authService) {
            const success = await (this.authService as any).updateUserProfile(updates);

            if (success) {
                // Refresh user state
                this._currentUser = this.authService.getCurrentUser() as User | null;
                this.handleUserChange(this._currentUser);
            }

            return success;
        }

        return false;
    }

    /**
     * Alias for updateProfile - matches AuthFirebaseService API
     */
    async updateUserProfile(updates: Record<string, any>): Promise<boolean> {
        return this.updateProfile(updates as Partial<User>);
    }

    /**
     * Reset password (Firebase only)
     */
    async resetPassword(email: string): Promise<boolean> {
        if (!this.authService) {
            return false;
        }

        if ('resetPassword' in this.authService) {
            return await (this.authService as any).resetPassword(email);
        }

        return false;
    }

    /**
     * Require authentication - throws if not authenticated
     * Use in view models that require a logged-in user
     */
    requireAuth(): User {
        const user = this.currentUser;
        if (!user) {
            throw new Error('Authentication required');
        }
        return user;
    }

    /**
     * Require specific role - throws if user doesn't have the role
     */
    requireRole(role: UserRole): User {
        const user = this.requireAuth();
        if (user.role !== role) {
            throw new Error(`Role '${role}' required, but user has role '${user.role}'`);
        }
        return user;
    }
}

/**
 * Get the AuthSessionService singleton instance
 * This is the primary way to access auth state in view models
 */
let authSessionInstance: AuthSessionService | null = null;

export function getAuthSessionService(): AuthSessionService {
    if (!authSessionInstance) {
        authSessionInstance = AuthSessionService.getInstance();
    }
    return authSessionInstance;
}

/**
 * Initialize auth session service
 * Call this during app startup after Firebase is ready
 */
export function initializeAuthSession(): void {
    getAuthSessionService().initialize();
}
