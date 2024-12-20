import { Observable } from '@nativescript/core';
import * as Geolocation from '@nativescript/geolocation';

export class PermissionsService extends Observable {
    private static instance: PermissionsService;

    static getInstance(): PermissionsService {
        if (!PermissionsService.instance) {
            PermissionsService.instance = new PermissionsService();
        }
        return PermissionsService.instance;
    }

    async requestLocationPermission(): Promise<boolean> {
        try {
            const isEnabled = await Geolocation.isEnabled();
            if (!isEnabled) {
                return await Geolocation.enableLocationRequest(true);
            }
            return true;
        } catch (error) {
            console.error('Location permission error:', error);
            return false;
        }
    }

    async requestCameraPermission(): Promise<boolean> {
        try {
            if (global.isAndroid) {
                const result = await this.requestAndroidPermission(android.Manifest.permission.CAMERA);
                return result;
            } else if (global.isIOS) {
                // iOS camera permission is handled by the OS when needed
                return true;
            }
            return false;
        } catch (error) {
            console.error('Camera permission error:', error);
            return false;
        }
    }

    private async requestAndroidPermission(permission: string): Promise<boolean> {
        try {
            const activity = require("@nativescript/core/application").android.foregroundActivity;
            const hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
                android.support.v4.content.ContextCompat.checkSelfPermission(activity, permission);

            if (!hasPermission) {
                const result = await new Promise<boolean>((resolve) => {
                    android.support.v4.app.ActivityCompat.requestPermissions(
                        activity,
                        [permission],
                        123,
                        new android.support.v4.app.ActivityCompat.OnRequestPermissionsResultCallback({
                            onRequestPermissionsResult: (requestCode: number, permissions: string[], grantResults: number[]) => {
                                resolve(grantResults.length > 0 && grantResults[0] === android.content.pm.PackageManager.PERMISSION_GRANTED);
                            }
                        })
                    );
                });
                return result;
            }
            return true;
        } catch (error) {
            console.error('Error requesting Android permission:', error);
            return false;
        }
    }
}