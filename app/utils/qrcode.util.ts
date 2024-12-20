import { ImageSource } from '@nativescript/core';
import { BarcodeScanner } from 'nativescript-barcodescanner';

export class QRCodeUtil {
    private static instance: QRCodeUtil;
    private barcodeScanner: BarcodeScanner;

    private constructor() {
        this.barcodeScanner = new BarcodeScanner();
    }

    static getInstance(): QRCodeUtil {
        if (!QRCodeUtil.instance) {
            QRCodeUtil.instance = new QRCodeUtil();
        }
        return QRCodeUtil.instance;
    }

    async generateQRCode(data: any): Promise<string> {
        try {
            // For now, return a placeholder image path
            // In a real app, you'd use platform-specific APIs to generate QR codes
            return "res://qr_placeholder";
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    async scanQRCode(): Promise<string> {
        try {
            const result = await this.barcodeScanner.scan({
                formats: "QR_CODE",
                message: "Place QR code inside the scan area",
                showFlipCameraButton: true,
                preferFrontCamera: false,
                showTorchButton: true,
                beepOnScan: true,
                torchOn: false,
                resultDisplayDuration: 500
            });

            return result.text;
        } catch (error) {
            console.error('Error scanning QR code:', error);
            throw new Error('Failed to scan QR code');
        }
    }
}