import { firebase, FirebaseApp } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';
import '@nativescript/firebase-firestore';
import { AppCheckService } from './app-check.service';
import { getEnvironment } from '../../config/environment.config';

/**
 * Firebase Service - Core Firebase Initialization
 *
 * This service initializes Firebase for the NativeScript app.
 * It should be called once when the app starts.
 */
export class FirebaseService {
  private static isInitialized = false;
  private static app: FirebaseApp | null = null;

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

      // Initialize Firebase with default app (uses google-services.json / GoogleService-Info.plist)
      this.app = await firebase().initializeApp();

      this.isInitialized = true;
      console.log('✅ Firebase initialized successfully');

      // Initialize App Check if enabled in environment config
      if (getEnvironment().getSecurityConfig().enableAppCheck) {
        try {
          const appCheckService = AppCheckService.getInstance();
          await appCheckService.initialize();
        } catch (appCheckError) {
          // App Check failure should not prevent app from working
          console.warn('⚠️ App Check initialization skipped:', appCheckError);
        }
      }
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
