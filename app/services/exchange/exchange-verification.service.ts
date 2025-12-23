import { Observable } from '@nativescript/core';
import { QRCodeUtil } from '../../utils/qrcode.util';
import { ExchangeFirebaseService } from '../firebase/exchange-firebase.service';
import { MedicineExchange } from '../../models/exchange/medicine-exchange.model';

/**
 * Exchange Verification Service
 * Handles QR code generation and scanning for exchange verification
 */
export interface ExchangeQRData {
    exchangeId: string;
    type: 'pickup' | 'delivery';
    timestamp: number;
    pharmacyId: string;
    signature: string;
}

export interface VerificationResult {
    success: boolean;
    exchange?: MedicineExchange;
    message: string;
    action?: 'pickup' | 'delivery' | 'complete';
}

export class ExchangeVerificationService extends Observable {
    private static instance: ExchangeVerificationService;
    private qrCodeUtil: QRCodeUtil;
    private exchangeService: ExchangeFirebaseService;

    private constructor() {
        super();
        this.qrCodeUtil = QRCodeUtil.getInstance();
        this.exchangeService = ExchangeFirebaseService.getInstance();
    }

    static getInstance(): ExchangeVerificationService {
        if (!ExchangeVerificationService.instance) {
            ExchangeVerificationService.instance = new ExchangeVerificationService();
        }
        return ExchangeVerificationService.instance;
    }

    /**
     * Generate QR code data for an exchange
     */
    generateQRData(exchangeId: string, type: 'pickup' | 'delivery', pharmacyId: string): ExchangeQRData {
        const timestamp = Date.now();
        const signature = this.generateSignature(exchangeId, type, timestamp);

        return {
            exchangeId,
            type,
            timestamp,
            pharmacyId,
            signature
        };
    }

    /**
     * Generate a QR code image for pickup
     */
    async generatePickupQR(exchangeId: string, pharmacyId: string): Promise<string> {
        const qrData = this.generateQRData(exchangeId, 'pickup', pharmacyId);
        return await this.qrCodeUtil.generateQRCode(JSON.stringify(qrData));
    }

    /**
     * Generate a QR code image for delivery confirmation
     */
    async generateDeliveryQR(exchangeId: string, pharmacyId: string): Promise<string> {
        const qrData = this.generateQRData(exchangeId, 'delivery', pharmacyId);
        return await this.qrCodeUtil.generateQRCode(JSON.stringify(qrData));
    }

    /**
     * Scan and verify a QR code
     */
    async scanAndVerify(): Promise<VerificationResult> {
        try {
            const scannedData = await this.qrCodeUtil.scanQRCode();

            if (!scannedData) {
                return {
                    success: false,
                    message: 'No QR code data found'
                };
            }

            return await this.verifyQRData(scannedData);
        } catch (error) {
            console.error('Error scanning QR code:', error);
            return {
                success: false,
                message: 'Failed to scan QR code'
            };
        }
    }

    /**
     * Verify scanned QR code data
     */
    async verifyQRData(scannedData: string): Promise<VerificationResult> {
        try {
            const qrData: ExchangeQRData = JSON.parse(scannedData);

            // Validate QR data structure
            if (!qrData.exchangeId || !qrData.type || !qrData.timestamp || !qrData.signature) {
                return {
                    success: false,
                    message: 'Invalid QR code format'
                };
            }

            // Verify signature
            const expectedSignature = this.generateSignature(
                qrData.exchangeId,
                qrData.type,
                qrData.timestamp
            );

            if (qrData.signature !== expectedSignature) {
                return {
                    success: false,
                    message: 'QR code verification failed - invalid signature'
                };
            }

            // Check if QR code is not expired (valid for 24 hours)
            const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in ms
            if (Date.now() - qrData.timestamp > expirationTime) {
                return {
                    success: false,
                    message: 'QR code has expired'
                };
            }

            // Fetch the exchange from Firestore
            const exchange = await this.exchangeService.getExchangeById(qrData.exchangeId);

            if (!exchange) {
                return {
                    success: false,
                    message: 'Exchange not found'
                };
            }

            // Determine action based on QR type and current status
            let action: 'pickup' | 'delivery' | 'complete';

            if (qrData.type === 'pickup') {
                if (exchange.status !== 'accepted') {
                    return {
                        success: false,
                        exchange,
                        message: 'Exchange must be accepted before pickup'
                    };
                }
                action = 'pickup';
            } else if (qrData.type === 'delivery') {
                if (exchange.status !== 'in_transit') {
                    return {
                        success: false,
                        exchange,
                        message: 'Exchange must be in transit for delivery confirmation'
                    };
                }
                action = 'delivery';
            } else {
                return {
                    success: false,
                    message: 'Unknown QR code type'
                };
            }

            return {
                success: true,
                exchange,
                message: `QR code verified for ${action}`,
                action
            };
        } catch (error) {
            console.error('Error verifying QR data:', error);
            return {
                success: false,
                message: 'Failed to verify QR code'
            };
        }
    }

    /**
     * Confirm pickup (for courier)
     */
    async confirmPickup(exchangeId: string): Promise<boolean> {
        try {
            const success = await this.exchangeService.updateExchangeStatus(exchangeId, 'in_transit');
            if (success) {
                console.log('✅ Pickup confirmed, exchange now in transit');
            }
            return success;
        } catch (error) {
            console.error('Error confirming pickup:', error);
            return false;
        }
    }

    /**
     * Confirm delivery (for receiving pharmacy)
     */
    async confirmDelivery(exchangeId: string): Promise<boolean> {
        try {
            const success = await this.exchangeService.completeExchange(exchangeId);
            if (success) {
                console.log('✅ Delivery confirmed, exchange completed');
            }
            return success;
        } catch (error) {
            console.error('Error confirming delivery:', error);
            return false;
        }
    }

    /**
     * Generate a simple signature for QR verification
     * In production, use a proper HMAC with a secret key
     */
    private generateSignature(exchangeId: string, type: string, timestamp: number): string {
        // Simple hash-like signature (in production, use crypto with secret key)
        const data = `${exchangeId}-${type}-${timestamp}-mediexchange`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
