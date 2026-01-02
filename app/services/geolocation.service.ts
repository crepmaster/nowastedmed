/**
 * Geolocation Service
 *
 * Provides GPS coordinate capture functionality for pharmacies and delivery tracking.
 * Essential for African markets where street addresses are often unreliable.
 */

import { Observable, CoreTypes } from '@nativescript/core';
import * as Geolocation from '@nativescript/geolocation';
import { PermissionsService } from './permissions.service';
import { getEnvironment } from '../config/environment.config';

// Use CoreTypes.Accuracy for NativeScript geolocation
const Accuracy = CoreTypes.Accuracy;

/**
 * Demo pharmacy locations for Cotonou, Benin
 * Each location represents a real pharmacy location in the city center
 * Used for testing when demo mode is enabled
 */
const DEMO_PHARMACY_LOCATIONS: GeoCoordinates[] = [
    // Pharmacy 1 - Near Dantokpa Market
    { latitude: 6.3654, longitude: 2.4183, accuracy: 10 },
    // Pharmacy 2 - Akpakpa area
    { latitude: 6.3589, longitude: 2.4312, accuracy: 10 },
    // Pharmacy 3 - Ganhi area (near train station)
    { latitude: 6.3703, longitude: 2.3912, accuracy: 10 },
    // Pharmacy 4 - Cadjehoun area
    { latitude: 6.3621, longitude: 2.3845, accuracy: 10 },
    // Pharmacy 5 - Zogbo area
    { latitude: 6.3789, longitude: 2.3956, accuracy: 10 },
    // Pharmacy 6 - Sainte Rita area
    { latitude: 6.3512, longitude: 2.4089, accuracy: 10 },
    // Pharmacy 7 - Fidjrosse area
    { latitude: 6.3445, longitude: 2.3678, accuracy: 10 },
    // Pharmacy 8 - Haie Vive area
    { latitude: 6.3823, longitude: 2.3789, accuracy: 10 },
    // Pharmacy 9 - Cotonou Center
    { latitude: 6.3678, longitude: 2.4056, accuracy: 10 },
    // Pharmacy 10 - Jericho area
    { latitude: 6.3534, longitude: 2.4234, accuracy: 10 },
];

/**
 * Demo/Test coordinates for different African cities (city centers)
 * Used when demo mode is enabled and real GPS is not available
 */
const DEMO_CITY_CENTERS: Record<string, GeoCoordinates> = {
    // Benin
    'bj_cotonou': { latitude: 6.3703, longitude: 2.3912, accuracy: 10 },
    'bj_porto_novo': { latitude: 6.4969, longitude: 2.6289, accuracy: 10 },
    // Nigeria
    'ng_lagos': { latitude: 6.5244, longitude: 3.3792, accuracy: 10 },
    'ng_abuja': { latitude: 9.0765, longitude: 7.3986, accuracy: 10 },
    // Kenya
    'ke_nairobi': { latitude: -1.2921, longitude: 36.8219, accuracy: 10 },
    'ke_mombasa': { latitude: -4.0435, longitude: 39.6682, accuracy: 10 },
    // Ghana
    'gh_accra': { latitude: 5.6037, longitude: -0.1870, accuracy: 10 },
    // Senegal
    'sn_dakar': { latitude: 14.7167, longitude: -17.4677, accuracy: 10 },
    // Default (Cotonou, Benin)
    'default': { latitude: 6.3703, longitude: 2.3912, accuracy: 10 },
};

// Counter for assigning unique demo locations to pharmacies
let demoLocationIndex = 0;

export interface GeoCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;      // Accuracy in meters
    altitude?: number;      // Altitude in meters (if available)
    timestamp?: Date;       // When the location was captured
}

export interface GeolocationOptions {
    desiredAccuracy?: number;   // Desired accuracy in meters (default: 10)
    timeout?: number;           // Timeout in milliseconds (default: 30000)
    maximumAge?: number;        // Maximum age of cached location in ms (default: 0)
}

export class GeolocationService extends Observable {
    private static instance: GeolocationService;
    private permissionsService: PermissionsService;

    private constructor() {
        super();
        this.permissionsService = PermissionsService.getInstance();
    }

    static getInstance(): GeolocationService {
        if (!GeolocationService.instance) {
            GeolocationService.instance = new GeolocationService();
        }
        return GeolocationService.instance;
    }

    /**
     * Check if demo mode is enabled
     */
    isDemoMode(): boolean {
        return getEnvironment().isFeatureEnabled('enableDemoMode');
    }

    /**
     * Get demo coordinates for a specific city (city center)
     * @param cityId - City ID (e.g., 'bj_cotonou', 'ng_lagos')
     */
    getDemoCoordinates(cityId?: string): GeoCoordinates {
        const coords = cityId ? DEMO_CITY_CENTERS[cityId] : DEMO_CITY_CENTERS['default'];
        return {
            ...(coords || DEMO_CITY_CENTERS['default']),
            timestamp: new Date(),
        };
    }

    /**
     * Get a unique demo pharmacy location
     * Each call returns a different location from the pool of 10 demo locations
     * This ensures demo pharmacies have different GPS coordinates
     */
    getNextDemoPharmacyLocation(): GeoCoordinates {
        const location = DEMO_PHARMACY_LOCATIONS[demoLocationIndex % DEMO_PHARMACY_LOCATIONS.length];
        demoLocationIndex++;
        return {
            ...location,
            timestamp: new Date(),
        };
    }

    /**
     * Reset the demo location counter
     * Call this when reinitializing demo data
     */
    resetDemoLocationCounter(): void {
        demoLocationIndex = 0;
    }

    /**
     * Get all demo pharmacy locations (for testing/debugging)
     */
    getAllDemoPharmacyLocations(): GeoCoordinates[] {
        return DEMO_PHARMACY_LOCATIONS.map(loc => ({
            ...loc,
            timestamp: new Date(),
        }));
    }

    /**
     * Check if location services are enabled
     */
    async isLocationEnabled(): Promise<boolean> {
        try {
            return await Geolocation.isEnabled();
        } catch (error) {
            console.error('Error checking location status:', error);
            return false;
        }
    }

    /**
     * Request location permission and enable location services
     */
    async requestLocationAccess(): Promise<boolean> {
        return this.permissionsService.requestLocationPermission();
    }

    /**
     * Get current GPS coordinates
     * @param options - Optional configuration for location accuracy and timeout
     */
    async getCurrentLocation(options?: GeolocationOptions): Promise<GeoCoordinates | null> {
        try {
            // First ensure we have permission
            const hasPermission = await this.requestLocationAccess();
            if (!hasPermission) {
                console.warn('Location permission denied');
                return null;
            }

            // Configure location options
            const locationOptions = {
                desiredAccuracy: options?.desiredAccuracy ?? Accuracy.high,
                timeout: options?.timeout ?? 30000,
                maximumAge: options?.maximumAge ?? 0,
            };

            // Get current location
            const location = await Geolocation.getCurrentLocation(locationOptions);

            if (!location) {
                console.warn('Could not get current location');
                return null;
            }

            return {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.horizontalAccuracy,
                altitude: location.altitude,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        }
    }

    /**
     * Get coordinates with high accuracy (for pharmacy registration)
     * Uses higher accuracy settings and longer timeout
     */
    async getHighAccuracyLocation(): Promise<GeoCoordinates | null> {
        return this.getCurrentLocation({
            desiredAccuracy: Accuracy.high,
            timeout: 60000, // 60 seconds for better accuracy
            maximumAge: 0,  // Always get fresh location
        });
    }

    /**
     * Get coordinates quickly with lower accuracy (for courier tracking)
     */
    async getQuickLocation(): Promise<GeoCoordinates | null> {
        return this.getCurrentLocation({
            desiredAccuracy: Accuracy.any,
            timeout: 10000, // 10 seconds
            maximumAge: 60000, // Accept cached location up to 1 minute old
        });
    }

    /**
     * Calculate distance between two coordinates in kilometers
     * Uses Haversine formula
     */
    calculateDistance(from: GeoCoordinates, to: GeoCoordinates): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(to.latitude - from.latitude);
        const dLon = this.toRad(to.longitude - from.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(from.latitude)) * Math.cos(this.toRad(to.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Convert degrees to radians
     */
    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(coords: GeoCoordinates): string {
        return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    }

    /**
     * Validate that coordinates are within valid ranges
     */
    validateCoordinates(coords: GeoCoordinates): boolean {
        if (!coords) return false;

        // Valid latitude range: -90 to 90
        if (coords.latitude < -90 || coords.latitude > 90) return false;

        // Valid longitude range: -180 to 180
        if (coords.longitude < -180 || coords.longitude > 180) return false;

        // Check for null island (0,0) which is often a default/error
        if (coords.latitude === 0 && coords.longitude === 0) return false;

        return true;
    }

    /**
     * Check if coordinates are within Africa (rough bounds)
     * Useful for validation in this app's target market
     */
    isWithinAfrica(coords: GeoCoordinates): boolean {
        // Africa's approximate bounding box
        const africaBounds = {
            north: 37.5,    // Northern tip (Tunisia)
            south: -35,     // Southern tip (South Africa)
            west: -25,      // Western tip (Senegal)
            east: 55,       // Eastern tip (Somalia/Madagascar)
        };

        return (
            coords.latitude >= africaBounds.south &&
            coords.latitude <= africaBounds.north &&
            coords.longitude >= africaBounds.west &&
            coords.longitude <= africaBounds.east
        );
    }

    /**
     * Generate a Google Maps URL for the coordinates
     * Useful for opening in external navigation apps
     */
    getGoogleMapsUrl(coords: GeoCoordinates): string {
        return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    }

    /**
     * Generate directions URL from one location to another
     */
    getDirectionsUrl(from: GeoCoordinates, to: GeoCoordinates): string {
        return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=driving`;
    }
}
