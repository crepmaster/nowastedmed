import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import { Observable } from '@nativescript/core';

/**
 * Firestore Service - Database Operations
 *
 * Wrapper service for Firestore operations.
 * Provides type-safe methods for common database operations.
 *
 * Collections in mediexchange project:
 * - pharmacies: Pharmacy user profiles
 * - couriers: Courier user profiles
 * - admins: Admin user profiles
 * - exchanges: Exchange records
 * - exchange_proposals: Exchange proposals
 * - pharmacy_inventory: Medicine inventory
 * - deliveries: Delivery tracking
 * - wallets: User wallet balances (read-only from app)
 * - ledger: Transaction history (read-only from app)
 * - subscriptions: Subscription records (read-only from app)
 */
export class FirestoreService extends Observable {
  private static instance: FirestoreService;
  private firestore: any;

  private constructor() {
    super();
    this.firestore = firebase().firestore();
  }

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  /**
   * Get Firestore instance
   */
  getFirestore() {
    return this.firestore;
  }

  /**
   * Get a document by ID
   */
  async getDocument(collection: string, docId: string): Promise<any> {
    try {
      const doc = await this.firestore.collection(collection).doc(docId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Get all documents in a collection
   */
  async getCollection(collection: string, orderBy?: string, limit?: number): Promise<any[]> {
    try {
      let query = this.firestore.collection(collection);

      if (orderBy) {
        query = query.orderBy(orderBy, 'desc');
      }

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting collection ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Query documents with a where clause
   */
  async queryDocuments(
    collection: string,
    field: string,
    operator: string,
    value: any
  ): Promise<any[]> {
    try {
      const snapshot = await this.firestore
        .collection(collection)
        .where(field, operator, value)
        .get();

      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error querying ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Add a document to a collection
   */
  async addDocument(collection: string, data: any): Promise<string> {
    try {
      const docRef = await this.firestore.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Document added to ${collection}:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).update({
        ...data,
        updatedAt: new Date()
      });
      console.log(`✅ Document updated in ${collection}:`, docId);
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collection: string, docId: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).delete();
      console.log(`✅ Document deleted from ${collection}:`, docId);
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for a document
   */
  subscribeToDocument(
    collection: string,
    docId: string,
    callback: (data: any) => void
  ): () => void {
    const unsubscribe = this.firestore
      .collection(collection)
      .doc(docId)
      .onSnapshot((doc: any) => {
        if (doc.exists) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      });

    return unsubscribe;
  }

  /**
   * Subscribe to real-time updates for a collection
   */
  subscribeToCollection(
    collection: string,
    callback: (data: any[]) => void,
    whereClause?: { field: string; operator: string; value: any }
  ): () => void {
    let query = this.firestore.collection(collection);

    if (whereClause) {
      query = query.where(whereClause.field, whereClause.operator, whereClause.value);
    }

    const unsubscribe = query.onSnapshot((snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });

    return unsubscribe;
  }

  /**
   * Run a batch operation
   */
  async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = this.firestore.batch();

      operations.forEach(op => {
        const docRef = this.firestore.collection(op.collection).doc(op.docId);

        switch (op.type) {
          case 'set':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      console.log('✅ Batch operation completed');
    } catch (error) {
      console.error('Error in batch operation:', error);
      throw error;
    }
  }
}
