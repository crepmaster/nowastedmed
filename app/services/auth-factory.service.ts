/**
 * Auth Factory Service
 *
 * Returns the appropriate auth service based on environment configuration.
 * - Firebase Auth: For shared testing and production (data syncs across devices)
 * - Local Auth: For offline demo mode (data stored locally only)
 */

import { getEnvironmentService } from '../config/environment.config';

// Define a common interface that both services implement
export interface IAuthService {
    login(email: string, password: string): Promise<boolean>;
    logout(): void | Promise<void>;
    getCurrentUser(): any;
    register?(userData: any): Promise<boolean>;
}

let authServiceInstance: IAuthService | null = null;

/**
 * Get the appropriate auth service based on environment configuration
 */
export function getAuthService(): IAuthService {
    if (authServiceInstance) {
        return authServiceInstance;
    }

    const env = getEnvironmentService();
    const useFirebase = env.isFeatureEnabled('useFirebaseAuth');

    if (useFirebase) {
        console.log('🔐 Using Firebase Authentication');
        const { AuthFirebaseService } = require('./firebase/auth-firebase.service');
        authServiceInstance = AuthFirebaseService.getInstance();
    } else {
        console.log('🔐 Using Local Authentication (Demo Mode)');
        const { AuthService } = require('./auth.service');
        authServiceInstance = AuthService.getInstance();
    }

    return authServiceInstance!;
}

/**
 * Reset auth service instance (for testing purposes)
 */
export function resetAuthService(): void {
    authServiceInstance = null;
}
