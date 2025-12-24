import { Observable } from '@nativescript/core';
import { FirestoreService } from './firestore.service';
import { Medicine } from '../../models/medicine.model';

/**
 * Firebase-backed Medicine Service
 * Handles medicine inventory operations with Firestore
 */
export class MedicineFirebaseService extends Observable {
    private static instance: MedicineFirebaseService;
    private firestoreService: FirestoreService;
    private readonly COLLECTION = 'pharmacy_inventory';

    private constructor() {
        super();
        this.firestoreService = FirestoreService.getInstance();
    }

    static getInstance(): MedicineFirebaseService {
        if (!MedicineFirebaseService.instance) {
            MedicineFirebaseService.instance = new MedicineFirebaseService();
        }
        return MedicineFirebaseService.instance;
    }

    /**
     * Get all medicines for a pharmacy
     */
    async getMedicinesByPharmacy(pharmacyId: string): Promise<Medicine[]> {
        try {
            const medicines = await this.firestoreService.queryDocuments(
                this.COLLECTION,
                'pharmacyId',
                '==',
                pharmacyId
            );
            return medicines.map(m => this.transformFromFirestore(m));
        } catch (error) {
            console.error('Error getting medicines:', error);
            return [];
        }
    }

    /**
     * Get medicines available for exchange (from other pharmacies)
     */
    async getAvailableForExchange(excludePharmacyId: string): Promise<Medicine[]> {
        try {
            const medicines = await this.firestoreService.queryDocuments(
                this.COLLECTION,
                'availableForExchange',
                '==',
                true
            );
            return medicines
                .filter(m => m.pharmacyId !== excludePharmacyId)
                .map(m => this.transformFromFirestore(m));
        } catch (error) {
            console.error('Error getting available medicines:', error);
            return [];
        }
    }

    /**
     * Add a new medicine to inventory
     */
    async addMedicine(medicine: Partial<Medicine>): Promise<string> {
        try {
            const docId = await this.firestoreService.addDocument(this.COLLECTION, {
                name: medicine.name,
                batchNumber: medicine.batchNumber,
                quantity: medicine.quantity || 0,
                expiryDate: medicine.expiryDate,
                pharmacyId: medicine.pharmacyId,
                pharmacyName: medicine.pharmacyName,
                category: medicine.category || 'general',
                price: medicine.price || 0,
                availableForExchange: false,
                exchangeQuantity: 0,
                status: 'available'
            });
            console.log('✅ Medicine added to Firestore:', docId);
            return docId;
        } catch (error) {
            console.error('Error adding medicine:', error);
            throw error;
        }
    }

    /**
     * Update medicine details
     */
    async updateMedicine(medicineId: string, updates: Partial<Medicine>): Promise<void> {
        try {
            await this.firestoreService.updateDocument(this.COLLECTION, medicineId, updates);
            console.log('✅ Medicine updated:', medicineId);
        } catch (error) {
            console.error('Error updating medicine:', error);
            throw error;
        }
    }

    /**
     * Make medicine available for exchange
     */
    async makeAvailableForExchange(medicineId: string, quantity: number): Promise<boolean> {
        try {
            await this.firestoreService.updateDocument(this.COLLECTION, medicineId, {
                availableForExchange: true,
                exchangeQuantity: quantity,
                status: 'for_exchange'
            });
            console.log('✅ Medicine marked for exchange:', medicineId);
            return true;
        } catch (error) {
            console.error('Error making medicine available:', error);
            return false;
        }
    }

    /**
     * Subscribe to real-time updates for pharmacy inventory
     */
    subscribeToPharmacyInventory(
        pharmacyId: string,
        callback: (medicines: Medicine[]) => void
    ): () => void {
        return this.firestoreService.subscribeToCollection(
            this.COLLECTION,
            (data) => {
                const medicines = data
                    .filter(m => m.pharmacyId === pharmacyId)
                    .map(m => this.transformFromFirestore(m));
                callback(medicines);
            },
            { field: 'pharmacyId', operator: '==', value: pharmacyId }
        );
    }

    /**
     * Transform Firestore document to Medicine model
     */
    private transformFromFirestore(doc: any): Medicine {
        return {
            id: doc.id,
            // Database reference
            databaseId: doc.databaseId,
            // Medicine identification
            inn: doc.inn || doc.name || 'Unknown',
            name: doc.name,
            brandName: doc.brandName,
            // Medicine details
            form: doc.form || 'tablet',
            dosage: doc.dosage || '',
            category: doc.category || 'other',
            // Pharmacy listing details
            batchNumber: doc.batchNumber,
            quantity: doc.quantity,
            expiryDate: doc.expiryDate?.toDate?.() || new Date(doc.expiryDate),
            pharmacyId: doc.pharmacyId,
            pharmacyName: doc.pharmacyName,
            exchangeQuantity: doc.exchangeQuantity,
            price: doc.price,
            currency: doc.currency,
            // Listing status
            status: doc.status,
            availableForExchange: doc.availableForExchange,
            availableForSale: doc.availableForSale,
            // Storage and handling
            storageConditions: doc.storageConditions,
            prescriptionRequired: doc.prescriptionRequired,
            // Custom entry
            isCustomEntry: doc.isCustomEntry,
            pendingDatabaseReview: doc.pendingDatabaseReview,
            // Timestamps
            createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
            updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
        };
    }
}
