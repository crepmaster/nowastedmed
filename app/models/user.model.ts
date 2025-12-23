import { SupportedRegion } from './wallet.model';

export type UserRole = 'pharmacist' | 'courier' | 'admin';

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
  address: string;          // Street address within the city
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

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
}

export interface Pharmacist extends User {
  pharmacyName: string;
  location?: UserLocation;    // Required for new pharmacists (optional for legacy)
  license: string;
  address: string;            // Keep for backwards compatibility
}

export interface Courier extends User {
  vehicleType: string;
  licenseNumber: string;
  location?: UserLocation;    // Optional for couriers - they can operate in multiple cities
  operatingCities?: string[]; // List of cityIds where courier operates
}