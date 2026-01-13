import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth'; // Augments firebase() with auth()
import { Auth } from '@nativescript/firebase-auth';
import '@nativescript/firebase-firestore'; // Augments firebase() with firestore()
import { Observable } from '@nativescript/core';
import { FirestoreService } from './firestore.service';
import type { User, UserRole } from '../../models/user.model';
import { getProvidersByRegion } from '../../models/wallet.model';

/**
 * Firebase Authentication Service
 *
 * Handles user authentication with Firebase Auth
 * and retrieves user profiles from Firestore.
 */
export class AuthFirebaseService extends Observable {
  private static instance: AuthFirebaseService;
  private auth: Auth;
  private firestoreService: FirestoreService;
  private currentUser: User | null = null;

  private constructor() {
    super();
    this.auth = firebase().auth();
    this.firestoreService = FirestoreService.getInstance();

    // Listen to auth state changes
    this.auth.addAuthStateChangeListener(async (firebaseUser: any) => {
      if (firebaseUser) {
        console.log('🔐 User authenticated');
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
   * @param userData - Contains email, password, and all user profile data
   */
  async register(userData: any): Promise<boolean> {
    try {
      console.log('🔐 Registering user with Firebase Auth...');

      const { email, password } = userData;
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = result.user;

      console.log('✅ Firebase Auth user created');

      const userRole = userData.role as UserRole;
      const collectionName = this.getCollectionName(userRole);

      const profileData = {
        email,
        role: userRole,
        name: userData.pharmacyName || userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        isActive: true,
        createdAt: new Date(),
        location: userData.location || null,
        // Mobile money provider for wallet operations
        mobileMoneyProvider: userData.mobileMoneyProvider || null,
        mobileMoneyProviderName: userData.mobileMoneyProviderName || null,
        ...(userRole === 'pharmacist' && {
          pharmacyName: userData.pharmacyName || '',
          address: userData.address || '',
          licenseNumber: userData.licenseNumber || ''
        }),
        ...(userRole === 'courier' && {
          vehicleType: userData.vehicleType || '',
          operatingCities: userData.operatingCities || []
        }),
        hasActiveSubscription: userData.hasActiveSubscription ?? false,
        subscriptionStatus: userData.subscriptionStatus || 'pendingPayment',
        subscriptionPlanId: userData.subscriptionPlanId || null,
        subscriptionPlanType: userData.subscriptionPlanType || null
      };

      await firebase().firestore()
        .collection(collectionName)
        .doc(firebaseUser.uid)
        .set(profileData);

      console.log('✅ User profile created in Firestore');
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

      console.log('✅ Login successful, loading user profile...');

      // Wait for user profile to load before returning
      await this.loadUserProfile(firebaseUser.uid);

      if (this.currentUser) {
        console.log('✅ User profile loaded:', this.currentUser.role);
        return true;
      } else {
        console.error('❌ User profile not found after login');
        return false;
      }
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
      console.log('✅ Password reset email sent');
      return true;
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return false;
    }
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      let userData = await this.firestoreService.getDocument('pharmacies', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'pharmacist' as UserRole };
        // Migrate old users with missing fields
        await this.migrateUserIfNeeded(uid, 'pharmacies', userData);
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      userData = await this.firestoreService.getDocument('couriers', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'courier' as UserRole };
        // Migrate old users with missing fields
        await this.migrateUserIfNeeded(uid, 'couriers', userData);
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      userData = await this.firestoreService.getDocument('admins', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'admin' as UserRole };
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      console.error('❌ User profile not found');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    }
  }

  /**
   * Migrate old users by adding default values for missing fields
   * This runs on login for users registered before certain features were added
   */
  private async migrateUserIfNeeded(uid: string, collection: string, userData: any): Promise<void> {
    const updates: Record<string, any> = {};

    // Migration: Mobile Money Provider
    // Default to first available provider for user's region
    if (!userData.mobileMoneyProvider) {
      const region = userData.location?.region || 'west_africa_xof';
      const providers = getProvidersByRegion(region);
      if (providers.length > 0) {
        updates.mobileMoneyProvider = providers[0].id;
        updates.mobileMoneyProviderName = providers[0].name;
        console.log(`🔄 Migration: Setting default mobile money provider to ${providers[0].name}`);
      }
    }

    // Migration: Subscription fields (for pharmacies only)
    if (collection === 'pharmacies') {
      if (!userData.subscriptionPlanId) {
        updates.subscriptionPlanId = 'plan_free';
        updates.subscriptionPlanType = 'free';
        console.log('🔄 Migration: Setting default subscription plan to Free');
      }
      if (userData.subscriptionStatus === undefined) {
        updates.subscriptionStatus = 'active';
        console.log('🔄 Migration: Setting subscription status to active');
      }
      if (userData.hasActiveSubscription === undefined) {
        updates.hasActiveSubscription = true;
        console.log('🔄 Migration: Setting hasActiveSubscription to true');
      }
    }

    // Apply migrations if any updates needed
    if (Object.keys(updates).length > 0) {
      try {
        updates.migratedAt = new Date();
        await firebase().firestore()
          .collection(collection)
          .doc(uid)
          .update(updates);

        // Update local user object with migrated values
        this.currentUser = { ...this.currentUser, ...updates } as User;
        console.log('✅ User migration completed');
      } catch (error) {
        console.error('❌ Migration error (non-blocking):', error);
        // Non-blocking - user can still use the app
      }
    }
  }

  /**
   * Get collection name for user role
   */
  private getCollectionName(role: UserRole): string {
    const collections: Record<UserRole, string> = {
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
   * Update current user's profile
   * @param updates - Fields to update
   */
  async updateUserProfile(updates: Partial<User> & Record<string, any>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        console.error('❌ No user logged in');
        return false;
      }

      const firebaseUser = this.auth.currentUser;
      if (!firebaseUser) {
        console.error('❌ No Firebase user');
        return false;
      }

      const collectionName = this.getCollectionName(this.currentUser.role);

      await firebase().firestore()
        .collection(collectionName)
        .doc(firebaseUser.uid)
        .update({
          ...updates,
          updatedAt: new Date()
        });

      // Update local user object
      this.currentUser = { ...this.currentUser, ...updates };
      this.notifyPropertyChange('currentUser', this.currentUser);

      console.log('✅ User profile updated');
      return true;
    } catch (error: any) {
      console.error('❌ Update profile error:', error.message);
      return false;
    }
  }
}
