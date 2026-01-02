/**
 * Firebase App Check Service
 *
 * App Check helps protect your Firebase backend resources from abuse
 * by preventing unauthorized clients from accessing your Firebase resources.
 *
 * SETUP REQUIRED:
 * 1. Install the package: npm install @nativescript/firebase-app-check
 * 2. Enable App Check in Firebase Console:
 *    - Go to Firebase Console > App Check
 *    - Register your app with SafetyNet (Android) and/or DeviceCheck (iOS)
 * 3. For Android: Add SafetyNet API key to AndroidManifest.xml
 * 4. For iOS: Enable DeviceCheck in Apple Developer Portal
 *
 * DEBUG MODE:
 * For development/testing, you can use debug tokens instead of actual attestation.
 * See: https://firebase.google.com/docs/app-check/android/debug-provider
 */

import { getEnvironment } from '../../config/environment.config';

// App Check types (will be available after installing @nativescript/firebase-app-check)
interface AppCheckToken {
    token: string;
    expireTimeMillis: number;
}

/**
 * App Check Service
 * Manages Firebase App Check initialization and token handling
 */
export class AppCheckService {
    private static instance: AppCheckService;
    private isInitialized: boolean = false;
    private appCheck: any = null;

    private constructor() {}

    static getInstance(): AppCheckService {
        if (!AppCheckService.instance) {
            AppCheckService.instance = new AppCheckService();
        }
        return AppCheckService.instance;
    }

    /**
     * Initialize App Check
     * Should be called after Firebase is initialized but before using any Firebase services
     */
    async initialize(): Promise<boolean> {
        // Check if App Check is enabled in environment config
        if (!getEnvironment().getSecurityConfig().enableAppCheck) {
            console.log('⚠️ App Check is disabled in environment config');
            return false;
        }

        if (this.isInitialized) {
            console.log('✅ App Check already initialized');
            return true;
        }

        try {
            console.log('🔐 Initializing Firebase App Check...');

            // Dynamic import to avoid errors if package is not installed
            const appCheckModule = await this.loadAppCheckModule();
            if (!appCheckModule) {
                console.warn('⚠️ @nativescript/firebase-app-check not installed');
                return false;
            }

            // Configure App Check based on environment
            if (getEnvironment().isDevelopment()) {
                // Use debug provider for development
                await this.initializeDebugProvider(appCheckModule);
            } else {
                // Use production provider (SafetyNet/DeviceCheck)
                await this.initializeProductionProvider(appCheckModule);
            }

            this.isInitialized = true;
            console.log('✅ Firebase App Check initialized');
            return true;
        } catch (error) {
            console.error('❌ App Check initialization failed:', error);
            // Don't throw - app should still work without App Check in dev
            return false;
        }
    }

    /**
     * Try to load App Check module
     * DISABLED: @nativescript/firebase-app-check is not installed.
     * When you need App Check, install the package first:
     *   npm install @nativescript/firebase-app-check
     * Then uncomment the require below.
     */
    private async loadAppCheckModule(): Promise<any> {
        // App Check module not installed - return null to skip initialization
        // To enable, install the package and uncomment:
        // try {
        //     const module = require('@nativescript/firebase-app-check');
        //     return module;
        // } catch (error) {
        //     return null;
        // }
        return null;
    }

    /**
     * Initialize debug provider for development
     */
    private async initializeDebugProvider(appCheckModule: any): Promise<void> {
        console.log('🔧 Using App Check debug provider');

        // In debug mode, App Check uses a debug token
        // You need to add this token to Firebase Console > App Check > Apps > Manage debug tokens
        if (appCheckModule.AppCheck) {
            this.appCheck = appCheckModule.AppCheck;
            await this.appCheck.setTokenAutoRefreshEnabled(true);
        }
    }

    /**
     * Initialize production provider (SafetyNet for Android, DeviceCheck for iOS)
     */
    private async initializeProductionProvider(appCheckModule: any): Promise<void> {
        console.log('🔒 Using App Check production provider');

        if (appCheckModule.AppCheck) {
            this.appCheck = appCheckModule.AppCheck;
            await this.appCheck.activate(
                // Options for production
                {
                    isTokenAutoRefreshEnabled: true
                }
            );
        }
    }

    /**
     * Get current App Check token
     * Useful for custom backend calls that need App Check validation
     */
    async getToken(forceRefresh: boolean = false): Promise<AppCheckToken | null> {
        if (!this.isInitialized || !this.appCheck) {
            console.warn('App Check not initialized');
            return null;
        }

        try {
            const result = await this.appCheck.getToken(forceRefresh);
            return {
                token: result.token,
                expireTimeMillis: result.expireTimeMillis
            };
        } catch (error) {
            console.error('Failed to get App Check token:', error);
            return null;
        }
    }

    /**
     * Check if App Check is initialized and working
     */
    isAppCheckEnabled(): boolean {
        return this.isInitialized && this.appCheck !== null;
    }

    /**
     * Get headers for API calls that need App Check
     */
    async getAppCheckHeaders(): Promise<Record<string, string>> {
        const token = await this.getToken();
        if (token) {
            return {
                'X-Firebase-AppCheck': token.token
            };
        }
        return {};
    }
}

/**
 * Export singleton getter
 */
export const getAppCheckService = (): AppCheckService => AppCheckService.getInstance();
