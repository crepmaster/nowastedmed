/**
 * Delivery Firebase Service
 *
 * Handles delivery tracking and courier operations with Firebase
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
} from '../../models/delivery.model';

export class DeliveryFirebaseService {
    private static instance: DeliveryFirebaseService;
    private firestore: any;
    private readonly DELIVERIES_COLLECTION = 'deliveries';
    private readonly EXCHANGES_COLLECTION = 'exchanges';

    private constructor() {
        this.firestore = firebase().firestore();
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
     */
    async getPendingDeliveries(limit: number = 20): Promise<Delivery[]> {
        try {
            const snapshot = await this.firestore
                .collection(this.DELIVERIES_COLLECTION)
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc: any) => this.transformDelivery(doc));
        } catch (error) {
            console.error('Error getting pending deliveries:', error);
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
     */
    async acceptDelivery(deliveryId: string, courierId: string, courierName: string, courierPhone: string): Promise<void> {
        try {
            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
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
     */
    async confirmPickup(
        deliveryId: string,
        courierId: string,
        verificationData: { signature?: string; photo?: string; notes?: string }
    ): Promise<void> {
        try {
            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
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
     */
    async confirmDelivery(
        deliveryId: string,
        courierId: string,
        verificationData: { signature?: string; photo?: string; notes?: string }
    ): Promise<void> {
        try {
            const delivery = await this.getDelivery(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
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
            fromPharmacyId: data.fromPharmacyId,
            fromPharmacyName: data.fromPharmacyName,
            fromAddress: data.fromAddress,
            fromPhone: data.fromPhone,
            toPharmacyId: data.toPharmacyId,
            toPharmacyName: data.toPharmacyName,
            toAddress: data.toAddress,
            toPhone: data.toPhone,
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
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    }
}
