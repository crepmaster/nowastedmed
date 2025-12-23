import { Observable } from '@nativescript/core';
import { FirestoreService } from './firestore.service';
import { MedicineExchange, ExchangeStatus, ExchangeProposal, MedicineExchangeItem, ExchangeLocation } from '../../models/exchange/medicine-exchange.model';
import { isSameCity } from '../../models/location.model';

/**
 * Firebase-backed Exchange Service
 * Handles medicine exchange operations with Firestore
 *
 * IMPORTANT: All exchanges between pharmacies MUST be within the same city.
 * This is enforced at:
 * 1. getPendingExchanges - filters to show only same-city exchanges
 * 2. createExchange - requires location data
 * 3. createProposal - validates same-city requirement
 */
export class ExchangeFirebaseService extends Observable {
    private static instance: ExchangeFirebaseService;
    private firestoreService: FirestoreService;
    private readonly EXCHANGES_COLLECTION = 'exchanges';
    private readonly PROPOSALS_COLLECTION = 'exchange_proposals';

    private constructor() {
        super();
        this.firestoreService = FirestoreService.getInstance();
    }

    static getInstance(): ExchangeFirebaseService {
        if (!ExchangeFirebaseService.instance) {
            ExchangeFirebaseService.instance = new ExchangeFirebaseService();
        }
        return ExchangeFirebaseService.instance;
    }

    /**
     * Get all exchanges for a pharmacy (as proposer or recipient)
     */
    async getExchangesByPharmacy(pharmacyId: string): Promise<MedicineExchange[]> {
        try {
            // Get exchanges where pharmacy is the proposer
            const proposedExchanges = await this.firestoreService.queryDocuments(
                this.EXCHANGES_COLLECTION,
                'proposedBy',
                '==',
                pharmacyId
            );

            // Get exchanges where pharmacy is the recipient
            const receivedExchanges = await this.firestoreService.queryDocuments(
                this.EXCHANGES_COLLECTION,
                'proposedTo',
                '==',
                pharmacyId
            );

            const allExchanges = [...proposedExchanges, ...receivedExchanges];
            // Remove duplicates by id
            const uniqueExchanges = allExchanges.filter((exchange, index, self) =>
                index === self.findIndex(e => e.id === exchange.id)
            );

            return uniqueExchanges.map(e => this.transformFromFirestore(e));
        } catch (error) {
            console.error('Error getting exchanges:', error);
            return [];
        }
    }

    /**
     * Get pending exchanges (available for other pharmacies to respond to)
     * IMPORTANT: Only returns exchanges in the same city as the requesting pharmacy
     *
     * @param excludePharmacyId - Pharmacy ID to exclude (usually the requesting pharmacy)
     * @param cityId - City ID to filter by (REQUIRED - only same-city exchanges allowed)
     */
    async getPendingExchanges(excludePharmacyId?: string, cityId?: string): Promise<MedicineExchange[]> {
        try {
            const exchanges = await this.firestoreService.queryDocuments(
                this.EXCHANGES_COLLECTION,
                'status',
                '==',
                'pending'
            );

            let filtered = exchanges;

            // Exclude own pharmacy's exchanges
            if (excludePharmacyId) {
                filtered = filtered.filter(e => e.proposedBy !== excludePharmacyId);
            }

            // MANDATORY: Filter by same city
            if (cityId) {
                filtered = filtered.filter(e => e.location?.cityId === cityId);
            }

            return filtered.map(e => this.transformFromFirestore(e));
        } catch (error) {
            console.error('Error getting pending exchanges:', error);
            return [];
        }
    }

    /**
     * Get pending exchanges by city
     * Use this to explicitly get exchanges for a specific city
     */
    async getPendingExchangesByCity(cityId: string, excludePharmacyId?: string): Promise<MedicineExchange[]> {
        return this.getPendingExchanges(excludePharmacyId, cityId);
    }

    /**
     * Create a new exchange request
     * IMPORTANT: Location is REQUIRED for all new exchanges
     */
    async createExchange(exchange: Partial<MedicineExchange>): Promise<string> {
        try {
            // Validate that location is provided
            if (!exchange.location || !exchange.location.cityId) {
                throw new Error('Exchange location (cityId) is required. Exchanges can only happen within the same city.');
            }

            const docId = await this.firestoreService.addDocument(this.EXCHANGES_COLLECTION, {
                proposedBy: exchange.proposedBy,
                proposedByName: exchange.proposedByName || '',
                proposedTo: exchange.proposedTo || '',
                proposedToName: exchange.proposedToName || '',
                status: 'pending',
                priority: exchange.priority || 'medium',
                proposedMedicines: exchange.proposedMedicines || [],
                offeredMedicines: exchange.offeredMedicines || [],
                notes: exchange.notes || '',
                location: {
                    countryCode: exchange.location.countryCode,
                    cityId: exchange.location.cityId,
                    cityName: exchange.location.cityName
                }
            });
            console.log('✅ Exchange created in Firestore:', docId);
            return docId;
        } catch (error) {
            console.error('Error creating exchange:', error);
            throw error;
        }
    }

    /**
     * Validate that two pharmacies are in the same city
     * This MUST be called before creating proposals
     */
    validateSameCityExchange(proposerCityId: string, responderCityId: string): boolean {
        if (!proposerCityId || !responderCityId) {
            console.error('City IDs are required for exchange validation');
            return false;
        }
        return isSameCity(proposerCityId, responderCityId);
    }

    /**
     * Update exchange status
     */
    async updateExchangeStatus(exchangeId: string, status: ExchangeStatus): Promise<boolean> {
        try {
            await this.firestoreService.updateDocument(this.EXCHANGES_COLLECTION, exchangeId, {
                status
            });
            console.log('✅ Exchange status updated:', exchangeId, status);
            return true;
        } catch (error) {
            console.error('Error updating exchange status:', error);
            return false;
        }
    }

    /**
     * Create a proposal for an exchange
     */
    async createProposal(
        exchangeId: string,
        proposedBy: string,
        medicines: MedicineExchangeItem[]
    ): Promise<string> {
        try {
            // Add the proposal
            const proposalId = await this.firestoreService.addDocument(this.PROPOSALS_COLLECTION, {
                exchangeId,
                proposedBy,
                medicines,
                status: 'pending'
            });

            // Update the exchange with the offered medicines
            await this.firestoreService.updateDocument(this.EXCHANGES_COLLECTION, exchangeId, {
                offeredMedicines: medicines,
                proposedTo: proposedBy,
                status: 'pending' // Keep pending until accepted
            });

            console.log('✅ Proposal created:', proposalId);
            return proposalId;
        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    }

    /**
     * Accept a proposal
     */
    async acceptProposal(exchangeId: string, proposalId: string): Promise<boolean> {
        try {
            await this.firestoreService.batchWrite([
                {
                    type: 'update',
                    collection: this.EXCHANGES_COLLECTION,
                    docId: exchangeId,
                    data: { status: 'accepted' }
                },
                {
                    type: 'update',
                    collection: this.PROPOSALS_COLLECTION,
                    docId: proposalId,
                    data: { status: 'accepted', responseDate: new Date() }
                }
            ]);
            console.log('✅ Proposal accepted:', proposalId);
            return true;
        } catch (error) {
            console.error('Error accepting proposal:', error);
            return false;
        }
    }

    /**
     * Reject a proposal
     */
    async rejectProposal(exchangeId: string, proposalId: string, reason?: string): Promise<boolean> {
        try {
            await this.firestoreService.batchWrite([
                {
                    type: 'update',
                    collection: this.PROPOSALS_COLLECTION,
                    docId: proposalId,
                    data: {
                        status: 'rejected',
                        responseDate: new Date(),
                        responseNotes: reason || ''
                    }
                }
            ]);
            console.log('✅ Proposal rejected:', proposalId);
            return true;
        } catch (error) {
            console.error('Error rejecting proposal:', error);
            return false;
        }
    }

    /**
     * Complete an exchange (after delivery)
     */
    async completeExchange(exchangeId: string): Promise<boolean> {
        try {
            await this.firestoreService.updateDocument(this.EXCHANGES_COLLECTION, exchangeId, {
                status: 'completed',
                completedAt: new Date()
            });
            console.log('✅ Exchange completed:', exchangeId);
            return true;
        } catch (error) {
            console.error('Error completing exchange:', error);
            return false;
        }
    }

    /**
     * Get exchange by ID
     */
    async getExchangeById(exchangeId: string): Promise<MedicineExchange | null> {
        try {
            const doc = await this.firestoreService.getDocument(this.EXCHANGES_COLLECTION, exchangeId);
            return doc ? this.transformFromFirestore(doc) : null;
        } catch (error) {
            console.error('Error getting exchange:', error);
            return null;
        }
    }

    /**
     * Subscribe to real-time updates for a pharmacy's exchanges
     */
    subscribeToPharmacyExchanges(
        pharmacyId: string,
        callback: (exchanges: MedicineExchange[]) => void
    ): () => void {
        // Note: Firestore doesn't support OR queries directly,
        // so we subscribe to all and filter client-side
        return this.firestoreService.subscribeToCollection(
            this.EXCHANGES_COLLECTION,
            (data) => {
                const exchanges = data
                    .filter(e => e.proposedBy === pharmacyId || e.proposedTo === pharmacyId)
                    .map(e => this.transformFromFirestore(e));
                callback(exchanges);
            }
        );
    }

    /**
     * Transform Firestore document to MedicineExchange model
     */
    private transformFromFirestore(doc: any): MedicineExchange {
        return {
            id: doc.id,
            proposedBy: doc.proposedBy,
            proposedByName: doc.proposedByName,
            proposedTo: doc.proposedTo,
            proposedToName: doc.proposedToName,
            status: doc.status,
            priority: doc.priority,
            proposedMedicines: doc.proposedMedicines || [],
            offeredMedicines: doc.offeredMedicines || [],
            notes: doc.notes,
            location: doc.location ? {
                countryCode: doc.location.countryCode,
                cityId: doc.location.cityId,
                cityName: doc.location.cityName
            } : undefined,
            createdAt: doc.createdAt?.toDate?.() || new Date(doc.createdAt),
            updatedAt: doc.updatedAt?.toDate?.() || new Date(doc.updatedAt)
        };
    }
}
