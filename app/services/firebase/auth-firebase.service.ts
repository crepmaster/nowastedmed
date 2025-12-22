import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';
import { Observable } from '@nativescript/core';
import { FirestoreService } from './firestore.service';
import { User, UserRole } from '../../auth/types/auth.types';

/**
 * Firebase Authentication Service
 *
 * Handles user authentication with Firebase Auth
 * and retrieves user profiles from Firestore.
 *
 * This replaces the local AuthService for production use.
 */
export class AuthFirebaseService extends Observable {
  private static instance: AuthFirebaseService;
  private auth: any;
  private firestoreService: FirestoreService;
  private currentUser: User | null = null;

  private constructor() {
    super();
    this.auth = firebase().auth();
    this.firestoreService = FirestoreService.getInstance();

    // Listen to auth state changes
    this.auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        console.log('🔐 User logged in:', firebaseUser.uid);
        // Load user profile from Firestore
        await this.loadUserProfile(firebaseUser.uid);
      } else {
        console.log('🔓 User logged out');
        this.currentUser = null;
        this.notifyPropertyChange('currentUser', null);
      }
    });
  }

  static getInstance(): AuthFirebaseService {
    if (!AuthFirebaseService.instance) {
      AuthFirebaseService.instance = new AuthFirebaseService();
    }
    return AuthFirebaseService.instance;
  }

  /**
   * Register a new user with Firebase Auth
   * Note: User profile creation is handled by Cloud Functions
   */
  async register(email: string, password: string, userData: any): Promise<boolean> {
    try {
      console.log('🔐 Registering user with Firebase Auth...');

      // Create Firebase Auth user
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = result.user;

      console.log('✅ Firebase Auth user created:', firebaseUser.uid);

      // The Cloud Function (createPharmacyUser/createCourierUser) should be called
      // separately to create the Firestore profile
      // For now, we'll create the profile directly

      const userRole = userData.role as UserRole;
      const collectionName = this.getCollectionName(userRole);

      const profileData = {
        email,
        role: userRole,
        name: userData.pharmacyName || userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        // Add role-specific fields
        ...(userRole === 'pharmacist' && {
          pharmacyName: userData.pharmacyName || '',
          address: userData.address || '',
          license: userData.license || ''
        }),
        ...(userRole === 'courier' && {
          vehicleType: userData.vehicleType || '',
          licenseNumber: userData.licenseNumber || ''
        }),
        // Initialize subscription fields
        hasActiveSubscription: false,
        subscriptionStatus: 'pendingPayment',
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null
      };

      // Save profile to Firestore
      await firebase().firestore()
        .collection(collectionName)
        .doc(firebaseUser.uid)
        .set(profileData);

      console.log('✅ User profile created in Firestore');

      // Load the created profile
      await this.loadUserProfile(firebaseUser.uid);

      return true;
    } catch (error: any) {
      console.error('❌ Registration error:', error.message);
      return false;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 Logging in with Firebase Auth...');

      const result = await this.auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = result.user;

      console.log('✅ Login successful:', firebaseUser.uid);

      // User profile will be loaded by onAuthStateChanged listener
      return true;
    } catch (error: any) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
      this.currentUser = null;
      this.notifyPropertyChange('currentUser', null);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current Firebase user
   */
  getCurrentFirebaseUser() {
    return this.auth.currentUser;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent to:', email);
      return true;
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const collectionName = this.getCollectionName(this.currentUser.role);

      await this.firestoreService.updateDocument(
        collectionName,
        this.currentUser.id,
        updates
      );

      // Update local user object
      this.currentUser = { ...this.currentUser, ...updates };
      this.notifyPropertyChange('currentUser', this.currentUser);

      console.log('✅ Profile updated');
      return true;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return false;
    }
  }

  /**
   * Load user profile from Firestore
   * Checks pharmacies, couriers, and admins collections
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      // Try pharmacies collection
      let userData = await this.firestoreService.getDocument('pharmacies', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'pharmacist' };
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      // Try couriers collection
      userData = await this.firestoreService.getDocument('couriers', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'courier' };
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      // Try admins collection
      userData = await this.firestoreService.getDocument('admins', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'admin' };
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      console.error('❌ User profile not found in any collection');
      throw new Error('User profile not found');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      throw error;
    }
  }

  /**
   * Get collection name for user role
   */
  private getCollectionName(role: UserRole): string {
    const collections = {
      pharmacist: 'pharmacies',
      courier: 'couriers',
      admin: 'admins'
    };
    return collections[role];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }
}
