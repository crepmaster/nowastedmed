import { SupportedRegion } from './wallet.model';

export type UserRole = 'pharmacist' | 'courier' | 'admin';

/**
 * GPS coordinates for location tracking
 * Essential for African markets where street addresses are often unreliable
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;        // Accuracy in meters when captured
  capturedAt?: Date;        // When coordinates were captured
}

/**
 * Location information for users (especially pharmacies)
 */
export interface UserLocation {
  countryCode: string;      // ISO 3166-1 alpha-2 (e.g., 'BJ', 'NG', 'KE')
  countryName: string;      // Full country name
  cityId: string;           // City identifier (e.g., 'bj_cotonou')
  cityName: string;         // Full city name
  region: SupportedRegion;  // Region for mobile money providers
  currency: string;         // Local currency code (e.g., 'XOF', 'NGN')
  address: string;          // Street address within the city (descriptive/landmark-based)
  coordinates?: GeoCoordinates; // GPS coordinates - required for pharmacies
}

export type SubscriptionStatus = 'none' | 'pendingPayment' | 'active' | 'expired' | 'cancelled';

export type MobileMoneyProvider = 'mtn' | 'moov' | 'orange' | 'wave' | 'flooz' | 'airtel';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phoneNumber: string;
  password?: string;
  pharmacyName?: string;
  address?: string;           // Legacy field - use location.address for new records
  location?: UserLocation;    // Structured location data
  license?: string;
  licenseNumber?: string;
  vehicleType?: string;
  operatingCities?: string[]; // For couriers - list of cityIds they operate in
  isActive?: boolean;
  createdAt?: Date | any;

  // Subscription fields
  hasActiveSubscription?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlanId?: string;
  subscriptionStartDate?: Date | any;
  subscriptionEndDate?: Date | any;

  // Payment preferences
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
}

/**
 * Pharmacy location with required coordinates
 * NOTE: For new registrations, coordinates are required (enforced in registration validation)
 * Legacy records may not have coordinates
 */
export interface PharmacyLocation extends UserLocation {
  coordinates: GeoCoordinates;  // Required for new pharmacies (GPS is essential in Africa)
}

export interface Pharmacist extends User {
  pharmacyName: string;
  /**
   * Location with GPS coordinates
   * For new registrations: coordinates are REQUIRED (enforced in registration validation)
   * For legacy records: coordinates may be undefined
   */
  location?: UserLocation;      // UserLocation for backward compatibility, coordinates enforced at app level
  license: string;
  address: string;              // Keep for backwards compatibility (legacy field)
}

export interface Courier extends User {
  vehicleType: string;
  licenseNumber: string;
  location?: UserLocation;    // Optional for couriers - they can operate in multiple cities
  operatingCities?: string[]; // List of cityIds where courier operates
}