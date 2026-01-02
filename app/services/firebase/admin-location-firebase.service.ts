/**
 * Admin Location Firebase Service
 *
 * Handles admin operations for managing countries, cities, and courier assignments.
 * Only users with 'admin' role can use these methods.
 *
 * SECURITY: All write operations require admin role verification.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import { FieldValue } from '@nativescript/firebase-firestore';
import { SupportedRegion } from '../../models/wallet.model';
import { AuthFirebaseService } from './auth-firebase.service';

/**
 * Country document stored in Firestore
 */
export interface CountryDocument {
    id: string;
    code: string;           // ISO 3166-1 alpha-2
    name: string;
    region: SupportedRegion;
    currency: string;
    phonePrefix: string;
    isActive: boolean;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * City document stored in Firestore
 */
export interface CityDocument {
    id: string;
    name: string;
    countryCode: string;
    countryName: string;
    isCapital: boolean;
    isActive: boolean;
    assignedCouriers: string[];  // Array of courier user IDs
    courierCount: number;
    createdAt: Date | any;
    updatedAt: Date | any;
}

/**
 * Courier assignment document
 */
export interface CourierAssignment {
    id: string;
    courierId: string;
    courierName: string;
    courierPhone: string;
    cityId: string;
    cityName: string;
    countryCode: string;
    isActive: boolean;
    assignedAt: Date | any;
    assignedBy: string;     // Admin user ID
}

/**
 * Create country request
 */
export interface CreateCountryRequest {
    code: string;
    name: string;
    region: SupportedRegion;
    currency: string;
    phonePrefix: string;
}

/**
 * Create city request
 */
export interface CreateCityRequest {
    name: string;
    countryCode: string;
    isCapital?: boolean;
}

export class AdminLocationFirebaseService {
    private static instance: AdminLocationFirebaseService;
    private firestore: any;
    private authService: AuthFirebaseService;

    private readonly COUNTRIES_COLLECTION = 'countries';
    private readonly CITIES_COLLECTION = 'cities';
    private readonly COURIER_ASSIGNMENTS_COLLECTION = 'courier_assignments';
    private readonly USERS_COLLECTION = 'users';

    private constructor() {
        this.firestore = firebase().firestore();
        this.authService = AuthFirebaseService.getInstance();
    }

    static getInstance(): AdminLocationFirebaseService {
        if (!AdminLocationFirebaseService.instance) {
            AdminLocationFirebaseService.instance = new AdminLocationFirebaseService();
        }
        return AdminLocationFirebaseService.instance;
    }

    // ========================================
    // AUTHORIZATION HELPERS
    // ========================================

    /**
     * Verify current user is an admin
     * @throws Error if user is not authenticated or not an admin
     */
    private verifyAdminAccess(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Unauthorized: Authentication required');
        }
        if (currentUser.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
        }
    }

    /**
     * Get current admin user ID
     * @throws Error if user is not an admin
     */
    private getAdminUserId(): string {
        this.verifyAdminAccess();
        return this.authService.getCurrentUser()!.id;
    }

    // ========================================
    // COUNTRY MANAGEMENT
    // ========================================

    /**
     * Create a new country
     * @throws Error if user is not an admin
     */
    async createCountry(request: CreateCountryRequest): Promise<string> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Check if country code already exists
            const existing = await this.getCountryByCode(request.code);
            if (existing) {
                throw new Error(`Country with code ${request.code} already exists`);
            }

            const countryData: Omit<CountryDocument, 'id'> = {
                code: request.code.toUpperCase(),
                name: request.name,
                region: request.region,
                currency: request.currency.toUpperCase(),
                phonePrefix: request.phonePrefix,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const docRef = await this.firestore
                .collection(this.COUNTRIES_COLLECTION)
                .add(countryData);

            console.log('Country created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating country:', error);
            throw error;
        }
    }

    /**
     * Get all countries
     */
    async getAllCountries(activeOnly: boolean = true): Promise<CountryDocument[]> {
        try {
            let query = this.firestore.collection(this.COUNTRIES_COLLECTION);

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('name', 'asc').get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting countries:', error);
            throw error;
        }
    }

    /**
     * Get country by code
     */
    async getCountryByCode(code: string): Promise<CountryDocument | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.COUNTRIES_COLLECTION)
                .where('code', '==', code.toUpperCase())
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            };
        } catch (error) {
            console.error('Error getting country:', error);
            throw error;
        }
    }

    /**
     * Update country
     * @throws Error if user is not an admin
     */
    async updateCountry(countryId: string, updates: Partial<CountryDocument>): Promise<void> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            await this.firestore
                .collection(this.COUNTRIES_COLLECTION)
                .doc(countryId)
                .update({
                    ...updates,
                    updatedAt: new Date(),
                });
            console.log('Country updated:', countryId);
        } catch (error) {
            console.error('Error updating country:', error);
            throw error;
        }
    }

    /**
     * Toggle country active status
     */
    async toggleCountryStatus(countryId: string, isActive: boolean): Promise<void> {
        await this.updateCountry(countryId, { isActive });
    }

    // ========================================
    // CITY MANAGEMENT
    // ========================================

    /**
     * Create a new city
     * @throws Error if user is not an admin
     */
    async createCity(request: CreateCityRequest): Promise<string> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Verify country exists
            const country = await this.getCountryByCode(request.countryCode);
            if (!country) {
                throw new Error(`Country with code ${request.countryCode} does not exist`);
            }

            // Generate city ID
            const cityId = `${request.countryCode.toLowerCase()}_${request.name.toLowerCase().replace(/\s+/g, '_')}`;

            // Check if city already exists
            const existing = await this.getCityById(cityId);
            if (existing) {
                throw new Error(`City ${request.name} already exists in ${country.name}`);
            }

            const cityData: Omit<CityDocument, 'id'> = {
                name: request.name,
                countryCode: request.countryCode.toUpperCase(),
                countryName: country.name,
                isCapital: request.isCapital || false,
                isActive: true,
                assignedCouriers: [],
                courierCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Use the generated cityId as document ID
            await this.firestore
                .collection(this.CITIES_COLLECTION)
                .doc(cityId)
                .set(cityData);

            console.log('City created:', cityId);
            return cityId;
        } catch (error) {
            console.error('Error creating city:', error);
            throw error;
        }
    }

    /**
     * Get all cities for a country
     */
    async getCitiesByCountry(countryCode: string, activeOnly: boolean = true): Promise<CityDocument[]> {
        try {
            let query = this.firestore
                .collection(this.CITIES_COLLECTION)
                .where('countryCode', '==', countryCode.toUpperCase());

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('name', 'asc').get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting cities:', error);
            throw error;
        }
    }

    /**
     * Get city by ID
     */
    async getCityById(cityId: string): Promise<CityDocument | null> {
        try {
            const doc = await this.firestore
                .collection(this.CITIES_COLLECTION)
                .doc(cityId)
                .get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            };
        } catch (error) {
            console.error('Error getting city:', error);
            throw error;
        }
    }

    /**
     * Get all cities (across all countries)
     */
    async getAllCities(activeOnly: boolean = true): Promise<CityDocument[]> {
        try {
            let query = this.firestore.collection(this.CITIES_COLLECTION);

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('countryCode', 'asc').get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));
        } catch (error) {
            console.error('Error getting all cities:', error);
            throw error;
        }
    }

    /**
     * Update city
     * @throws Error if user is not an admin
     */
    async updateCity(cityId: string, updates: Partial<CityDocument>): Promise<void> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            await this.firestore
                .collection(this.CITIES_COLLECTION)
                .doc(cityId)
                .update({
                    ...updates,
                    updatedAt: new Date(),
                });
            console.log('City updated:', cityId);
        } catch (error) {
            console.error('Error updating city:', error);
            throw error;
        }
    }

    /**
     * Toggle city active status
     */
    async toggleCityStatus(cityId: string, isActive: boolean): Promise<void> {
        await this.updateCity(cityId, { isActive });
    }

    // ========================================
    // COURIER ASSIGNMENT MANAGEMENT
    // ========================================

    /**
     * Assign courier to a city using batch writes for atomic operations
     * @throws Error if user is not an admin
     */
    async assignCourierToCity(
        courierId: string,
        cityId: string,
        adminUserId?: string
    ): Promise<string> {
        try {
            // SECURITY: Verify admin access and get admin ID
            const actualAdminId = adminUserId || this.getAdminUserId();

            // Get courier details
            const courierDoc = await this.firestore
                .collection(this.USERS_COLLECTION)
                .doc(courierId)
                .get();

            if (!courierDoc.exists) {
                throw new Error('Courier not found');
            }

            const courierData = courierDoc.data();
            if (courierData.role !== 'courier') {
                throw new Error('User is not a courier');
            }

            // Get city details
            const city = await this.getCityById(cityId);
            if (!city) {
                throw new Error('City not found');
            }

            // Check if assignment already exists
            const existingAssignment = await this.getCourierAssignment(courierId, cityId);
            if (existingAssignment) {
                throw new Error('Courier is already assigned to this city');
            }

            // Use batch write for atomic operations
            const batch = this.firestore.batch();

            // 1. Create assignment document
            const assignmentRef = this.firestore
                .collection(this.COURIER_ASSIGNMENTS_COLLECTION)
                .doc();

            const assignmentData: Omit<CourierAssignment, 'id'> = {
                courierId,
                courierName: courierData.name,
                courierPhone: courierData.phoneNumber,
                cityId,
                cityName: city.name,
                countryCode: city.countryCode,
                isActive: true,
                assignedAt: new Date(),
                assignedBy: actualAdminId,
            };
            batch.set(assignmentRef, assignmentData);

            // 2. Update city using arrayUnion for concurrent safety
            const cityRef = this.firestore.collection(this.CITIES_COLLECTION).doc(cityId);
            batch.update(cityRef, {
                assignedCouriers: FieldValue.arrayUnion([courierId]),
                courierCount: FieldValue.increment(1),
                updatedAt: new Date(),
            });

            // 3. Update courier's operating cities using arrayUnion
            const courierRef = this.firestore.collection(this.USERS_COLLECTION).doc(courierId);
            batch.update(courierRef, {
                operatingCities: FieldValue.arrayUnion([cityId]),
                updatedAt: new Date(),
            });

            // Commit all operations atomically
            await batch.commit();

            console.log('Courier assigned to city:', assignmentRef.id);
            return assignmentRef.id;
        } catch (error) {
            console.error('Error assigning courier to city:', error);
            throw error;
        }
    }

    /**
     * Remove courier from a city using batch writes for atomic operations
     * @throws Error if user is not an admin
     */
    async removeCourierFromCity(courierId: string, cityId: string): Promise<void> {
        try {
            // SECURITY: Verify admin access
            this.verifyAdminAccess();

            // Find the assignment document
            const snapshot = await this.firestore
                .collection(this.COURIER_ASSIGNMENTS_COLLECTION)
                .where('courierId', '==', courierId)
                .where('cityId', '==', cityId)
                .get();

            if (snapshot.empty) {
                throw new Error('Assignment not found');
            }

            // Use batch write for atomic operations
            const batch = this.firestore.batch();

            // 1. Delete assignment document(s)
            for (const doc of snapshot.docs) {
                batch.delete(doc.ref);
            }

            // 2. Update city using arrayRemove for concurrent safety
            const cityRef = this.firestore.collection(this.CITIES_COLLECTION).doc(cityId);
            batch.update(cityRef, {
                assignedCouriers: FieldValue.arrayRemove([courierId]),
                courierCount: FieldValue.increment(-1),
                updatedAt: new Date(),
            });

            // 3. Update courier's operating cities using arrayRemove
            const courierRef = this.firestore.collection(this.USERS_COLLECTION).doc(courierId);
            batch.update(courierRef, {
                operatingCities: FieldValue.arrayRemove([cityId]),
                updatedAt: new Date(),
            });

            // Commit all operations atomically
            await batch.commit();

            console.log('Courier removed from city:', courierId, cityId);
        } catch (error) {
            console.error('Error removing courier from city:', error);
            throw error;
        }
    }

    /**
     * Get courier assignment
     */
    async getCourierAssignment(courierId: string, cityId: string): Promise<CourierAssignment | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.COURIER_ASSIGNMENTS_COLLECTION)
                .where('courierId', '==', courierId)
                .where('cityId', '==', cityId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                assignedAt: doc.data().assignedAt?.toDate?.() || doc.data().assignedAt,
            };
        } catch (error) {
            console.error('Error getting courier assignment:', error);
            throw error;
        }
    }

    /**
     * Get all couriers assigned to a city
     */
    async getCouriersInCity(cityId: string): Promise<CourierAssignment[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.COURIER_ASSIGNMENTS_COLLECTION)
                .where('cityId', '==', cityId)
                .where('isActive', '==', true)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                assignedAt: doc.data().assignedAt?.toDate?.() || doc.data().assignedAt,
            }));
        } catch (error) {
            console.error('Error getting couriers in city:', error);
            throw error;
        }
    }

    /**
     * Get all cities assigned to a courier
     */
    async getCourierCities(courierId: string): Promise<CourierAssignment[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.COURIER_ASSIGNMENTS_COLLECTION)
                .where('courierId', '==', courierId)
                .where('isActive', '==', true)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                assignedAt: doc.data().assignedAt?.toDate?.() || doc.data().assignedAt,
            }));
        } catch (error) {
            console.error('Error getting courier cities:', error);
            throw error;
        }
    }

    /**
     * Get all couriers (for admin selection)
     */
    async getAllCouriers(): Promise<any[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.USERS_COLLECTION)
                .where('role', '==', 'courier')
                .where('isActive', '==', true)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error getting all couriers:', error);
            throw error;
        }
    }

    /**
     * Get unassigned couriers (couriers not assigned to a specific city)
     */
    async getUnassignedCouriersForCity(cityId: string): Promise<any[]> {
        try {
            const allCouriers = await this.getAllCouriers();
            const assignedCouriers = await this.getCouriersInCity(cityId);
            const assignedIds = new Set(assignedCouriers.map(a => a.courierId));

            return allCouriers.filter(courier => !assignedIds.has(courier.id));
        } catch (error) {
            console.error('Error getting unassigned couriers:', error);
            throw error;
        }
    }

    // ========================================
    // STATISTICS
    // ========================================

    /**
     * Get location statistics
     */
    async getLocationStats(): Promise<{
        totalCountries: number;
        activeCountries: number;
        totalCities: number;
        activeCities: number;
        totalCouriers: number;
        totalAssignments: number;
    }> {
        try {
            const [countries, cities, couriers, assignments] = await Promise.all([
                this.getAllCountries(false),
                this.getAllCities(false),
                this.getAllCouriers(),
                this.firestore.collection(this.COURIER_ASSIGNMENTS_COLLECTION).get(),
            ]);

            return {
                totalCountries: countries.length,
                activeCountries: countries.filter(c => c.isActive).length,
                totalCities: cities.length,
                activeCities: cities.filter(c => c.isActive).length,
                totalCouriers: couriers.length,
                totalAssignments: assignments.size,
            };
        } catch (error) {
            console.error('Error getting location stats:', error);
            throw error;
        }
    }
}
