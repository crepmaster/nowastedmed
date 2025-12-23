/**
 * Environment Configuration
 *
 * Manages environment-specific settings for development, staging, and production.
 * The environment is determined at build time or can be overridden.
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
    name: Environment;
    displayName: string;
    isProduction: boolean;
    isDevelopment: boolean;

    // Firebase
    firebase: {
        projectId: string;
        apiKey: string;
        authDomain: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        functionsRegion: string;
        functionsBaseUrl: string;
    };

    // Features
    features: {
        enableDemoMode: boolean;
        enableAnalytics: boolean;
        enableCrashReporting: boolean;
        enableDebugLogs: boolean;
        enableMockData: boolean;
    };

    // API
    api: {
        timeout: number;
        retryAttempts: number;
        retryDelay: number;
    };

    // Security
    security: {
        enableAppCheck: boolean;
        sessionTimeout: number; // in milliseconds
        maxLoginAttempts: number;
        lockoutDuration: number; // in milliseconds
    };
}

/**
 * Development Environment Configuration
 */
const developmentConfig: EnvironmentConfig = {
    name: 'development',
    displayName: 'Development',
    isProduction: false,
    isDevelopment: true,

    firebase: {
        projectId: 'mediexchange',
        apiKey: 'AIzaSyCcsUpbSHE4RHy8JKA3nm-91KKeju8B5Ko',
        authDomain: 'mediexchange.firebaseapp.com',
        storageBucket: 'mediexchange.firebasestorage.app',
        messagingSenderId: '850077575356',
        appId: '1:850077575356:web:67c7130629f17dd57708b9',
        functionsRegion: 'europe-west1',
        functionsBaseUrl: 'https://europe-west1-mediexchange.cloudfunctions.net'
    },

    features: {
        enableDemoMode: true,
        enableAnalytics: false,
        enableCrashReporting: false,
        enableDebugLogs: true,
        enableMockData: true
    },

    api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },

    security: {
        enableAppCheck: false,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 10,
        lockoutDuration: 5 * 60 * 1000 // 5 minutes
    }
};

/**
 * Staging Environment Configuration
 */
const stagingConfig: EnvironmentConfig = {
    name: 'staging',
    displayName: 'Staging',
    isProduction: false,
    isDevelopment: false,

    firebase: {
        projectId: 'mediexchange',
        apiKey: 'AIzaSyCcsUpbSHE4RHy8JKA3nm-91KKeju8B5Ko',
        authDomain: 'mediexchange.firebaseapp.com',
        storageBucket: 'mediexchange.firebasestorage.app',
        messagingSenderId: '850077575356',
        appId: '1:850077575356:web:67c7130629f17dd57708b9',
        functionsRegion: 'europe-west1',
        functionsBaseUrl: 'https://europe-west1-mediexchange.cloudfunctions.net'
    },

    features: {
        enableDemoMode: false,
        enableAnalytics: true,
        enableCrashReporting: true,
        enableDebugLogs: true,
        enableMockData: false
    },

    api: {
        timeout: 20000,
        retryAttempts: 2,
        retryDelay: 1000
    },

    security: {
        enableAppCheck: true,
        sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutes
    }
};

/**
 * Production Environment Configuration
 */
const productionConfig: EnvironmentConfig = {
    name: 'production',
    displayName: 'Production',
    isProduction: true,
    isDevelopment: false,

    firebase: {
        projectId: 'mediexchange',
        apiKey: 'AIzaSyCcsUpbSHE4RHy8JKA3nm-91KKeju8B5Ko',
        authDomain: 'mediexchange.firebaseapp.com',
        storageBucket: 'mediexchange.firebasestorage.app',
        messagingSenderId: '850077575356',
        appId: '1:850077575356:web:67c7130629f17dd57708b9',
        functionsRegion: 'europe-west1',
        functionsBaseUrl: 'https://europe-west1-mediexchange.cloudfunctions.net'
    },

    features: {
        enableDemoMode: false,
        enableAnalytics: true,
        enableCrashReporting: true,
        enableDebugLogs: false,
        enableMockData: false
    },

    api: {
        timeout: 15000,
        retryAttempts: 2,
        retryDelay: 500
    },

    security: {
        enableAppCheck: true,
        sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
        maxLoginAttempts: 3,
        lockoutDuration: 30 * 60 * 1000 // 30 minutes
    }
};

/**
 * Environment configurations map
 */
const environments: Record<Environment, EnvironmentConfig> = {
    development: developmentConfig,
    staging: stagingConfig,
    production: productionConfig
};

/**
 * Determine current environment
 * Priority: ENV variable > __DEV__ flag > default to production
 */
function getCurrentEnvironment(): Environment {
    // Check for explicit environment variable (set during build)
    if (typeof process !== 'undefined' && process.env?.APP_ENV) {
        const env = process.env.APP_ENV as Environment;
        if (environments[env]) {
            return env;
        }
    }

    // Check NativeScript __DEV__ flag
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        return 'development';
    }

    // Default to production for safety
    return 'production';
}

/**
 * Environment Service
 * Singleton service for accessing environment configuration
 */
class EnvironmentService {
    private static instance: EnvironmentService;
    private currentEnv: Environment;
    private config: EnvironmentConfig;

    private constructor() {
        this.currentEnv = getCurrentEnvironment();
        this.config = environments[this.currentEnv];
        this.logEnvironment();
    }

    static getInstance(): EnvironmentService {
        if (!EnvironmentService.instance) {
            EnvironmentService.instance = new EnvironmentService();
        }
        return EnvironmentService.instance;
    }

    private logEnvironment(): void {
        if (this.config.features.enableDebugLogs) {
            console.log(`🌍 Environment: ${this.config.displayName}`);
            console.log(`📦 Project: ${this.config.firebase.projectId}`);
        }
    }

    /**
     * Get current environment name
     */
    getEnvironment(): Environment {
        return this.currentEnv;
    }

    /**
     * Get full environment configuration
     */
    getConfig(): EnvironmentConfig {
        return this.config;
    }

    /**
     * Check if current environment is production
     */
    isProduction(): boolean {
        return this.config.isProduction;
    }

    /**
     * Check if current environment is development
     */
    isDevelopment(): boolean {
        return this.config.isDevelopment;
    }

    /**
     * Get Firebase configuration
     */
    getFirebaseConfig() {
        return this.config.firebase;
    }

    /**
     * Get feature flags
     */
    getFeatures() {
        return this.config.features;
    }

    /**
     * Check if a specific feature is enabled
     */
    isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
        return this.config.features[feature];
    }

    /**
     * Get API configuration
     */
    getApiConfig() {
        return this.config.api;
    }

    /**
     * Get security configuration
     */
    getSecurityConfig() {
        return this.config.security;
    }
}

// Export singleton instance getter
export const getEnvironmentService = (): EnvironmentService => EnvironmentService.getInstance();

// Export for convenience
export const environment = getEnvironmentService();
