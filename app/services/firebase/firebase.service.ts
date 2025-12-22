import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';
import '@nativescript/firebase-firestore';
import { getFirebaseConfig } from '../../config/firebase.config';

/**
 * Firebase Service - Core Firebase Initialization
 *
 * This service initializes Firebase for the NativeScript app.
 * It should be called once when the app starts.
 *
 * Usage:
 *   import { FirebaseService } from './services/firebase/firebase.service';
 *   await FirebaseService.initialize();
 */
export class FirebaseService {
  private static isInitialized = false;

  /**
   * Initialize Firebase
   * This should be called in app.ts on app startup
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔥 Firebase already initialized');
      return;
    }

    try {
      console.log('🔥 Initializing Firebase...');

      const config = getFirebaseConfig();

      // Initialize Firebase
      await firebase().initializeApp({
        ...config
      });

      this.isInitialized = true;
      console.log('✅ Firebase initialized successfully');
      console.log(`📱 Project: ${config.projectId}`);
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  static isFirebaseInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Firebase instance
   */
  static getFirebase() {
    if (!this.isInitialized) {
      throw new Error('Firebase is not initialized. Call FirebaseService.initialize() first.');
    }
    return firebase();
  }
}
