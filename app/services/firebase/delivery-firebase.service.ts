/**
 * Delivery Firebase Service
 *
 * Handles delivery tracking and courier operations with Firebase
 *
 * IMPORTANT: Deliveries are city-based. Couriers see only deliveries in their operating cities.
 * All exchanges (and thus deliveries) are between pharmacies in the SAME city.
 */

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import {
    Delivery,
    DeliveryStatus,
    DeliveryStatusChange,
    CourierStats,
    DeliveryFilter,
    DeliveryAssignment,
    DeliveryLocation,
    DeliveryPaymentStatus,
    DeliveryCoordinates,
} from '../../models/delivery.model';
import { CourierEarningsFirebaseService } from './courier-earnings-firebase.service';
import { DeliveryPaymentFirebaseService } from './delivery-payment-firebase.service';
import { AuthFirebaseService } from './auth-firebase.service';
import { GeolocationService, GeoCoordinates } from '../geolocation.service';

export class DeliveryFirebaseService {
    private static instance: DeliveryFirebaseService;
    private firestore: any;
    private authService: AuthFirebaseService;
    private earningsService: CourierEarningsFirebaseService;
    private paymentService: DeliveryPaymentFirebaseService;
    private geolocationService: GeolocationService;
    private readonly DELIVERIES_COLLECTION = 'deliveries';
    private readonly EXCHANGES_COLLECTION = 'exchanges';

    private constructor() {
        this.firestore = firebase().firestore();
        this.authService = AuthFirebaseService.getInstance();
        this.earningsService = CourierEarningsFirebaseService.getInstance();
        this.paymentService = DeliveryPaymentFirebaseService.getInstance();
        this.geolocationService = GeolocationService.getInstance();
    }

    static getInstance(): DeliveryFirebaseService {
        if (!DeliveryFirebaseService.instance) {
            DeliveryFirebaseService.instance = new DeliveryFirebaseService();
        }
        return DeliveryFirebaseService.instance;
    }

    /**
     * Get a delivery by ID
     */
    async getDelivery(deliveryId: string): Promise<Delivery | null> {
        try {
            const doc = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .get();

            if (doc.exists) {
                return this.transformDelivery(doc);
            }
            return null;
        } catch (error) {
            console.error('Error getting delivery:', error);
            throw error;
        }
    }

    /**
     * Get delivery by exchange ID
     */
    async getDeliveryByExchange(exchangeId: string): Promise<Delivery | null> {
        try {
            const snapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('exchangeId', '==', exchangeId)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return this.transformDelivery(snapshot.docs[0]);
            }
            return null;
        } catch (error) {
            console.error('Error getting delivery by exchange:', error);
            throw error;
        }
    }

    /**
     * Get deliveries for courier
     */
    async getCourierDeliveries(courierId: string, status?: DeliveryStatus | DeliveryStatus[]): Promise<Delivery[]> {
        try {
            let query = this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('courierId', '==', courierId);

            if (status) {
                if (Array.isArray(status)) {
                    query = query.where('status', 'in', status);
                } else {
                    query = query.where('status', '==', status);
                }
            }

            const snapshot = await query
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map((doc: any) => this.transformDelivery(doc));
        } catch (error) {
            console.error('Error getting courier deliveries:', error);
            throw error;
        }
    }

    /**
     * Get pending deliveries (for courier to accept)
     * IMPORTANT: Only returns deliveries where BOTH pharmacies have paid
     * Couriers should only see deliveries in their operating cities
     *
     * @param limit - Maximum number of deliveries to return
     * @param cityId - Optional city ID to filter by (recommended for couriers)
     */
    async getPendingDeliveries(limit: number = 20, cityId?: string): Promise<Delivery[]> {
        try {
            // Only get deliveries with payment_complete status (both pharmacies paid)
            const snapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('status', '==', 'pending')
                .where('paymentStatus', '==', 'payment_complete')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            let deliveries = snapshot.docs.map((doc: any) => this.transformDelivery(doc));

            // Filter by city if provided (recommended for couriers)
            if (cityId) {
                deliveries = deliveries.filter(d => d.location?.cityId === cityId);
            }

            return deliveries;
        } catch (error) {
            console.error('Error getting pending deliveries:', error);
            throw error;
        }
    }

    /**
     * Get pending deliveries for a specific city
     * Use this for couriers to see deliveries in their operating city
     */
    async getPendingDeliveriesByCity(cityId: string, limit: number = 20): Promise<Delivery[]> {
        return this.getPendingDeliveries(limit, cityId);
    }

    /**
     * Get pending deliveries for multiple cities
     * Use this for couriers who operate in multiple cities
     */
    async getPendingDeliveriesByCities(cityIds: string[], limit: number = 50): Promise<Delivery[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const deliveries = snapshot.docs
                .map((doc: any) => this.transformDelivery(doc))
                .filter((d: Delivery) => d.location?.cityId && cityIds.includes(d.location.cityId));

            return deliveries;
        } catch (error) {
            console.error('Error getting pending deliveries by cities:', error);
            throw error;
        }
    }

    /**
     * Get deliveries for pharmacy (as sender or receiver)
     */
    async getPharmacyDeliveries(pharmacyId: string): Promise<Delivery[]> {
        try {
            // Get deliveries where pharmacy is sender
            const fromSnapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('fromPharmacyId', '==', pharmacyId)
                .orderBy('createdAt', 'desc')
                .get();

            // Get deliveries where pharmacy is receiver
            const toSnapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('toPharmacyId', '==', pharmacyId)
                .orderBy('createdAt', 'desc')
                .get();

            const deliveries: Delivery[] = [];
            const seenIds = new Set<string>();

            [...fromSnapshot.docs, ...toSnapshot.docs].forEach((doc: any) => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    deliveries.push(this.transformDelivery(doc));
                }
            });

            // Sort by createdAt
            deliveries.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

            return deliveries;
        } catch (error) {
            console.error('Error getting pharmacy deliveries:', error);
            throw error;
        }
    }

    /**
     * Subscribe to courier deliveries (real-time)
     */
    subscribeToCourierDeliveries(
        courierId: string,
        callback: (deliveries: Delivery[]) => void,
        status?: DeliveryStatus | DeliveryStatus[]
    ): () => void {
        let query = this.firestore
            .collection(this.DELIVERIES_COLLECTION)
            .where('courierId', '==', courierId);

        if (status) {
            if (Array.isArray(status)) {
                query = query.where('status', 'in', status);
            } else {
                query = query.where('status', '==', status);
            }
        }

        return query
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot: any) => {
                const deliveries = snapshot.docs.map((doc: any) => this.transformDelivery(doc));
                callback(deliveries);
            }, (error: any) => {
                console.error('Delivery subscription error:', error);
                callback([]);
            });
    }

    /**
     * Subscribe to a single delivery (real-time)
     */
    subscribeToDelivery(deliveryId: string, callback: (delivery: Delivery | null) => void): () => void {
        return this.firestore
            .collection(this.DELIVERIES_COLLECTION)
            .doc(deliveryId)
            .onSnapshot((doc: any) => {
                if (doc.exists) {
                    callback(this.transformDelivery(doc));
                } else {
                    callback(null);
                }
            }, (error: any) => {
                console.error('Delivery subscription error:', error);
                callback(null);
            });
    }

    /**
     * Update delivery status
     */
    async updateDeliveryStatus(
        deliveryId: string,
        status: DeliveryStatus,
        updatedBy: string,
        note?: string,
        location?: { latitude: number; longitude: number }
    ): Promise<void> {
        try {
            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            const statusChange: DeliveryStatusChange = {
                status,
                timestamp: new Date(),
                updatedBy,
                note,
                location,
            };

            const statusHistory = [...(delivery.statusHistory || []), statusChange];

            const updateData: any = {
                status,
                statusHistory,
                updatedAt: new Date(),
            };

            // Add timestamps for specific statuses
            if (status === 'picked_up') {
                updateData.actualPickupTime = new Date();
            } else if (status === 'delivered') {
                updateData.actualDeliveryTime = new Date();
            }

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update(updateData);

            console.log('Delivery status updated:', deliveryId, status);
        } catch (error) {
            console.error('Error updating delivery status:', error);
            throw error;
        }
    }

    /**
     * Accept/assign delivery to courier
     * SECURITY: Validates that the current user is the courier accepting the delivery
     */
    async acceptDelivery(deliveryId: string, courierId: string, courierName: string, courierPhone: string): Promise<void> {
        try {
            // SECURITY: Verify current user is the courier
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('Unauthorized: User not authenticated');
            }
            if (currentUser.id !== courierId) {
                throw new Error('Unauthorized: Can only accept delivery for yourself');
            }

            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            // Verify delivery is in pending status
            if (delivery.status !== 'pending') {
                throw new Error('Delivery is not available for acceptance');
            }

            // Verify payment is complete
            if (delivery.paymentStatus !== 'payment_complete') {
                throw new Error('Delivery payment is not complete');
            }

            // Verify delivery is not already assigned
            if (delivery.courierId) {
                throw new Error('Delivery is already assigned to another courier');
            }

            const statusChange: DeliveryStatusChange = {
                status: 'assigned',
                timestamp: new Date(),
                updatedBy: courierId,
                note: 'Delivery accepted by courier',
            };

            const statusHistory = [...(delivery.statusHistory || []), statusChange];

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    courierId,
                    courierName,
                    courierPhone,
                    status: 'assigned',
                    statusHistory,
                    updatedAt: new Date(),
                });

            console.log('Delivery assigned to courier:', deliveryId, courierId);
        } catch (error) {
            console.error('Error accepting delivery:', error);
            throw error;
        }
    }

    /**
     * Confirm pickup with verification
     * SECURITY: Validates that the current user is the assigned courier
     */
    async confirmPickup(
        deliveryId: string,
        courierId: string,
        verificationData: { signature?: string; photo?: string; notes?: string }
    ): Promise<void> {
        try {
            // SECURITY: Verify current user is the courier
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('Unauthorized: User not authenticated');
            }
            if (currentUser.id !== courierId) {
                throw new Error('Unauthorized: Can only confirm pickup for yourself');
            }

            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            // SECURITY: Verify courier is assigned to this delivery
            if (delivery.courierId !== courierId) {
                throw new Error('Unauthorized: You are not assigned to this delivery');
            }

            // Verify delivery is in assigned status
            if (delivery.status !== 'assigned') {
                throw new Error('Delivery must be in assigned status to confirm pickup');
            }

            const statusChange: DeliveryStatusChange = {
                status: 'picked_up',
                timestamp: new Date(),
                updatedBy: courierId,
                note: verificationData.notes || 'Pickup confirmed',
            };

            const statusHistory = [...(delivery.statusHistory || []), statusChange];

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    status: 'picked_up',
                    actualPickupTime: new Date(),
                    pickupSignature: verificationData.signature || null,
                    pickupPhoto: verificationData.photo || null,
                    pickupNotes: verificationData.notes || null,
                    statusHistory,
                    updatedAt: new Date(),
                });

            console.log('Pickup confirmed:', deliveryId);
        } catch (error) {
            console.error('Error confirming pickup:', error);
            throw error;
        }
    }

    /**
     * Confirm delivery with verification
     * Creates earning record for the courier
     * SECURITY: Validates that the current user is the assigned courier
     */
    async confirmDelivery(
        deliveryId: string,
        courierId: string,
        verificationData: { signature?: string; photo?: string; notes?: string }
    ): Promise<void> {
        try {
            // SECURITY: Verify current user is the courier
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('Unauthorized: User not authenticated');
            }
            if (currentUser.id !== courierId) {
                throw new Error('Unauthorized: Can only confirm delivery for yourself');
            }

            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            // SECURITY: Verify courier is assigned to this delivery
            if (delivery.courierId !== courierId) {
                throw new Error('Unauthorized: You are not assigned to this delivery');
            }

            // Verify delivery is in picked_up or in_transit status
            if (delivery.status !== 'picked_up' && delivery.status !== 'in_transit') {
                throw new Error('Delivery must be picked up before confirming delivery');
            }

            const statusChange: DeliveryStatusChange = {
                status: 'delivered',
                timestamp: new Date(),
                updatedBy: courierId,
                note: verificationData.notes || 'Delivery confirmed',
            };

            const statusHistory = [...(delivery.statusHistory || []), statusChange];

            await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .doc(deliveryId)
                .update({
                    status: 'delivered',
                    actualDeliveryTime: new Date(),
                    deliverySignature: verificationData.signature || null,
                    deliveryPhoto: verificationData.photo || null,
                    deliveryNotes: verificationData.notes || null,
                    statusHistory,
                    updatedAt: new Date(),
                });

            console.log('Delivery confirmed:', deliveryId);

            // Update the related exchange status
            if (delivery.exchangeId) {
                await this.firestore
                    .collection(this.EXCHANGES_COLLECTION)
                    .doc(delivery.exchangeId)
                    .update({
                        status: 'completed',
                        updatedAt: new Date(),
                    });
            }

            // Release payment and create earning record for the courier
            try {
                // First, release the payment from escrow
                await this.paymentService.releasePaymentToCourier(deliveryId);
                console.log('Released payment to courier for delivery:', deliveryId);

                // Then create earning record
                const updatedDelivery = await this.getDelivery(deliveryId);
                if (updatedDelivery) {
                    await this.earningsService.createEarning(updatedDelivery);
                    console.log('Created earning record for delivery:', deliveryId);
                }
            } catch (earningError) {
                // Log but don't fail the delivery confirmation
                console.error('Error processing courier payment:', earningError);
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            throw error;
        }
    }

    /**
     * Get courier statistics
     */
    async getCourierStats(courierId: string): Promise<CourierStats> {
        try {
            const deliveries = await this.getCourierDeliveries(courierId);

            const stats: CourierStats = {
                totalDeliveries: deliveries.length,
                completedDeliveries: 0,
                pendingDeliveries: 0,
                inTransitDeliveries: 0,
                failedDeliveries: 0,
                averageDeliveryTime: 0,
                rating: 4.5, // Default rating
                totalEarnings: 0,
            };

            let totalDeliveryTime = 0;
            let completedWithTime = 0;

            deliveries.forEach(delivery => {
                switch (delivery.status) {
                    case 'delivered':
                        stats.completedDeliveries++;
                        stats.totalEarnings += delivery.deliveryFee || 0;

                        // Calculate delivery time
                        if (delivery.actualPickupTime && delivery.actualDeliveryTime) {
                            const pickup = new Date(delivery.actualPickupTime);
                            const delivered = new Date(delivery.actualDeliveryTime);
                            totalDeliveryTime += (delivered.getTime() - pickup.getTime()) / (1000 * 60); // minutes
                            completedWithTime++;
                        }
                        break;
                    case 'pending':
                    case 'assigned':
                        stats.pendingDeliveries++;
                        break;
                    case 'picked_up':
                    case 'in_transit':
                        stats.inTransitDeliveries++;
                        break;
                    case 'failed':
                    case 'cancelled':
                        stats.failedDeliveries++;
                        break;
                }
            });

            if (completedWithTime > 0) {
                stats.averageDeliveryTime = Math.round(totalDeliveryTime / completedWithTime);
            }

            return stats;
        } catch (error) {
            console.error('Error getting courier stats:', error);
            throw error;
        }
    }

    /**
     * Search deliveries with filters
     */
    async searchDeliveries(filter: DeliveryFilter, limit: number = 50): Promise<Delivery[]> {
        try {
            let query: any = this.firestore.collection(this.DELIVERIES_COLLECTION);

            if (filter.status) {
                if (Array.isArray(filter.status)) {
                    query = query.where('status', 'in', filter.status);
                } else {
                    query = query.where('status', '==', filter.status);
                }
            }

            if (filter.courierId) {
                query = query.where('courierId', '==', filter.courierId);
            }

            if (filter.fromPharmacyId) {
                query = query.where('fromPharmacyId', '==', filter.fromPharmacyId);
            }

            if (filter.toPharmacyId) {
                query = query.where('toPharmacyId', '==', filter.toPharmacyId);
            }

            const snapshot = await query
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            let deliveries = snapshot.docs.map((doc: any) => this.transformDelivery(doc));

            // Filter by date range (client-side since Firestore has query limitations)
            if (filter.dateFrom || filter.dateTo) {
                deliveries = deliveries.filter(d => {
                    const createdAt = d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt);
                    if (filter.dateFrom && createdAt < filter.dateFrom) return false;
                    if (filter.dateTo && createdAt > filter.dateTo) return false;
                    return true;
                });
            }

            return deliveries;
        } catch (error) {
            console.error('Error searching deliveries:', error);
            throw error;
        }
    }

    /**
     * Transform Firestore document to Delivery
     */
    private transformDelivery(doc: any): Delivery {
        const data = doc.data();
        return {
            id: doc.id,
            exchangeId: data.exchangeId,
            courierId: data.courierId,
            courierName: data.courierName,
            courierPhone: data.courierPhone,
            location: data.location ? {
                countryCode: data.location.countryCode,
                cityId: data.location.cityId,
                cityName: data.location.cityName,
            } : undefined,
            fromPharmacyId: data.fromPharmacyId,
            fromPharmacyName: data.fromPharmacyName,
            fromAddress: data.fromAddress,
            fromPhone: data.fromPhone,
            fromCoordinates: data.fromCoordinates ? {
                latitude: data.fromCoordinates.latitude,
                longitude: data.fromCoordinates.longitude,
            } : undefined,
            toPharmacyId: data.toPharmacyId,
            toPharmacyName: data.toPharmacyName,
            toAddress: data.toAddress,
            toPhone: data.toPhone,
            toCoordinates: data.toCoordinates ? {
                latitude: data.toCoordinates.latitude,
                longitude: data.toCoordinates.longitude,
            } : undefined,
            status: data.status,
            statusHistory: data.statusHistory || [],
            scheduledPickupTime: data.scheduledPickupTime?.toDate?.() || data.scheduledPickupTime,
            actualPickupTime: data.actualPickupTime?.toDate?.() || data.actualPickupTime,
            scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate?.() || data.scheduledDeliveryTime,
            actualDeliveryTime: data.actualDeliveryTime?.toDate?.() || data.actualDeliveryTime,
            estimatedDuration: data.estimatedDuration,
            pickupQRCode: data.pickupQRCode,
            deliveryQRCode: data.deliveryQRCode,
            pickupSignature: data.pickupSignature,
            deliverySignature: data.deliverySignature,
            pickupPhoto: data.pickupPhoto,
            deliveryPhoto: data.deliveryPhoto,
            medicineCount: data.medicineCount || 0,
            medicineDetails: data.medicineDetails || [],
            pickupNotes: data.pickupNotes,
            deliveryNotes: data.deliveryNotes,
            specialInstructions: data.specialInstructions,
            deliveryFee: data.deliveryFee,
            currency: data.currency || 'XOF',
            feePerPharmacy: data.feePerPharmacy,
            fromPharmacyPayment: data.fromPharmacyPayment ? {
                ...data.fromPharmacyPayment,
                paidAt: data.fromPharmacyPayment.paidAt?.toDate?.() || data.fromPharmacyPayment.paidAt,
                refundedAt: data.fromPharmacyPayment.refundedAt?.toDate?.() || data.fromPharmacyPayment.refundedAt,
            } : undefined,
            toPharmacyPayment: data.toPharmacyPayment ? {
                ...data.toPharmacyPayment,
                paidAt: data.toPharmacyPayment.paidAt?.toDate?.() || data.toPharmacyPayment.paidAt,
                refundedAt: data.toPharmacyPayment.refundedAt?.toDate?.() || data.toPharmacyPayment.refundedAt,
            } : undefined,
            paymentStatus: data.paymentStatus || 'awaiting_payment',
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    }

    // ========================================
    // NAVIGATION & GPS HELPERS
    // ========================================

    /**
     * Get Google Maps URL for pickup location
     * Opens navigation to the pickup pharmacy
     */
    getPickupNavigationUrl(delivery: Delivery): string | null {
        if (!delivery.fromCoordinates) {
            console.warn('No GPS coordinates available for pickup location');
            return null;
        }
        return this.geolocationService.getGoogleMapsUrl({
            latitude: delivery.fromCoordinates.latitude,
            longitude: delivery.fromCoordinates.longitude,
        });
    }

    /**
     * Get Google Maps URL for delivery location
     * Opens navigation to the delivery pharmacy
     */
    getDeliveryNavigationUrl(delivery: Delivery): string | null {
        if (!delivery.toCoordinates) {
            console.warn('No GPS coordinates available for delivery location');
            return null;
        }
        return this.geolocationService.getGoogleMapsUrl({
            latitude: delivery.toCoordinates.latitude,
            longitude: delivery.toCoordinates.longitude,
        });
    }

    /**
     * Get directions URL from pickup to delivery location
     */
    getFullRouteUrl(delivery: Delivery): string | null {
        if (!delivery.fromCoordinates || !delivery.toCoordinates) {
            console.warn('GPS coordinates missing for route calculation');
            return null;
        }
        return this.geolocationService.getDirectionsUrl(
            {
                latitude: delivery.fromCoordinates.latitude,
                longitude: delivery.fromCoordinates.longitude,
            },
            {
                latitude: delivery.toCoordinates.latitude,
                longitude: delivery.toCoordinates.longitude,
            }
        );
    }

    /**
     * Get directions from courier's current location to pickup
     */
    async getDirectionsToPickup(delivery: Delivery): Promise<string | null> {
        if (!delivery.fromCoordinates) {
            console.warn('No GPS coordinates available for pickup location');
            return null;
        }

        const currentLocation = await this.geolocationService.getQuickLocation();
        if (!currentLocation) {
            // Fall back to just the pickup location
            return this.getPickupNavigationUrl(delivery);
        }

        return this.geolocationService.getDirectionsUrl(currentLocation, {
            latitude: delivery.fromCoordinates.latitude,
            longitude: delivery.fromCoordinates.longitude,
        });
    }

    /**
     * Get directions from courier's current location to delivery
     */
    async getDirectionsToDelivery(delivery: Delivery): Promise<string | null> {
        if (!delivery.toCoordinates) {
            console.warn('No GPS coordinates available for delivery location');
            return null;
        }

        const currentLocation = await this.geolocationService.getQuickLocation();
        if (!currentLocation) {
            // Fall back to just the delivery location
            return this.getDeliveryNavigationUrl(delivery);
        }

        return this.geolocationService.getDirectionsUrl(currentLocation, {
            latitude: delivery.toCoordinates.latitude,
            longitude: delivery.toCoordinates.longitude,
        });
    }

    /**
     * Calculate distance between pickup and delivery locations
     * Returns distance in kilometers
     */
    getDeliveryDistance(delivery: Delivery): number | null {
        if (!delivery.fromCoordinates || !delivery.toCoordinates) {
            return null;
        }
        return this.geolocationService.calculateDistance(
            {
                latitude: delivery.fromCoordinates.latitude,
                longitude: delivery.fromCoordinates.longitude,
            },
            {
                latitude: delivery.toCoordinates.latitude,
                longitude: delivery.toCoordinates.longitude,
            }
        );
    }

    /**
     * Check if delivery has GPS coordinates for navigation
     */
    hasNavigationCoordinates(delivery: Delivery): { pickup: boolean; delivery: boolean } {
        return {
            pickup: !!delivery.fromCoordinates?.latitude && !!delivery.fromCoordinates?.longitude,
            delivery: !!delivery.toCoordinates?.latitude && !!delivery.toCoordinates?.longitude,
        };
    }
}
