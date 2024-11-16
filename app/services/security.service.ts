import { Observable } from '@nativescript/core';
import * as crypto from 'crypto-js';

export class SecurityService extends Observable {
    private static instance: SecurityService;
    private readonly SECRET_KEY = 'your-secret-key'; // In production, use environment variables

    static getInstance(): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService();
        }
        return SecurityService.instance;
    }

    encryptData(data: any): string {
        const jsonString = JSON.stringify(data);
        return crypto.AES.encrypt(jsonString, this.SECRET_KEY).toString();
    }

    decryptData(encryptedData: string): any {
        const bytes = crypto.AES.decrypt(encryptedData, this.SECRET_KEY);
        const decryptedString = bytes.toString(crypto.enc.Utf8);
        return JSON.parse(decryptedString);
    }

    hashPassword(password: string): string {
        return crypto.SHA256(password).toString();
    }

    generateSecureToken(): string {
        return crypto.lib.WordArray.random(32).toString();
    }
}