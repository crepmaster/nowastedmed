import { Observable, ApplicationSettings, isAndroid, isIOS } from '@nativescript/core';
import * as crypto from 'crypto-js';

declare const java: any;
declare const interop: any;
declare const SecRandomCopyBytes: (rnd: any, count: number, bytes: any) => number;
declare const kSecRandomDefault: any;

/**
 * Generate cryptographically secure random bytes using native APIs.
 * - Android: java.security.SecureRandom
 * - iOS: SecRandomCopyBytes
 */
function generateSecureRandomBytes(length: number): Uint8Array {
    if (isAndroid) {
        const secureRandom = new java.security.SecureRandom();
        const bytes = Array.create('byte', length);
        secureRandom.nextBytes(bytes);
        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = bytes[i] & 0xff;
        }
        return result;
    } else if (isIOS) {
        const bytesPointer = interop.alloc(length * interop.sizeof(interop.types.uint8));
        const status = SecRandomCopyBytes(kSecRandomDefault, length, bytesPointer);
        if (status !== 0) {
            throw new Error('SecRandomCopyBytes failed with status: ' + status);
        }
        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = interop.handleof(bytesPointer).add(i).readUInt8();
        }
        return result;
    }
    throw new Error('Unsupported platform for secure random generation');
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

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
            key = bytesToHex(generateSecureRandomBytes(32));
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
        return bytesToHex(generateSecureRandomBytes(32));
    }
}