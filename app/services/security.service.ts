import { Observable, ApplicationSettings } from '@nativescript/core';
import * as crypto from 'crypto-js';

/**
 * Security Service - Handles encryption, hashing, and token generation
 *
 * NOTE: The encryption key is generated per-device installation.
 * For shared data encryption, use Firebase's server-side encryption.
 */
export class SecurityService extends Observable {
    private static instance: SecurityService;
    private readonly DEVICE_KEY_STORAGE = 'app_device_encryption_key';
    private deviceKey: string;

    private constructor() {
        super();
        this.deviceKey = this.getOrCreateDeviceKey();
    }

    static getInstance(): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService();
        }
        return SecurityService.instance;
    }

    /**
     * Get or create a unique encryption key for this device
     * This key is generated once and stored locally
     */
    private getOrCreateDeviceKey(): string {
        let key = ApplicationSettings.getString(this.DEVICE_KEY_STORAGE);
        if (!key) {
            // Generate a new random key for this device
            key = crypto.lib.WordArray.random(32).toString();
            ApplicationSettings.setString(this.DEVICE_KEY_STORAGE, key);
        }
        return key;
    }

    /**
     * Encrypt data using device-specific key
     * NOTE: Only use for local data storage, not for data shared between devices
     */
    encryptData(data: any): string {
        const jsonString = JSON.stringify(data);
        return crypto.AES.encrypt(jsonString, this.deviceKey).toString();
    }

    /**
     * Decrypt data using device-specific key
     */
    decryptData(encryptedData: string): any {
        const bytes = crypto.AES.decrypt(encryptedData, this.deviceKey);
        const decryptedString = bytes.toString(crypto.enc.Utf8);
        return JSON.parse(decryptedString);
    }

    /**
     * Hash password using SHA-256
     * NOTE: For production auth, use Firebase Auth which handles password hashing securely
     */
    hashPassword(password: string): string {
        return crypto.SHA256(password).toString();
    }

    /**
     * Generate a cryptographically secure random token
     */
    generateSecureToken(): string {
        return crypto.lib.WordArray.random(32).toString();
    }
}