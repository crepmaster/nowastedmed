import { firebase } from '@nativescript/firebase-core';
import { Auth } from '@nativescript/firebase-auth';
import { Firestore } from '@nativescript/firebase-firestore';
import { Observable } from '@nativescript/core';
import { FirestoreService } from './firestore.service';
import { User, UserRole } from '../../models/user.model';

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
        console.log('🔐 User logged in:', firebaseUser.uid);
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
   */
  async register(email: string, password: string, userData: any): Promise<boolean> {
    try {
      console.log('🔐 Registering user with Firebase Auth...');

      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = result.user;

      console.log('✅ Firebase Auth user created:', firebaseUser.uid);

      const userRole = userData.role as UserRole;
      const collectionName = this.getCollectionName(userRole);

      const profileData = {
        email,
        role: userRole,
        name: userData.pharmacyName || userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        isActive: true,
        createdAt: new Date(),
        ...(userRole === 'pharmacist' && {
          pharmacyName: userData.pharmacyName || '',
          address: userData.address || '',
          license: userData.license || ''
        }),
        ...(userRole === 'courier' && {
          vehicleType: userData.vehicleType || '',
          licenseNumber: userData.licenseNumber || ''
        }),
        hasActiveSubscription: false,
        subscriptionStatus: 'pendingPayment'
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

      console.log('✅ Login successful:', firebaseUser.uid);
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
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      let userData = await this.firestoreService.getDocument('pharmacies', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'pharmacist' as UserRole };
        this.notifyPropertyChange('currentUser', this.currentUser);
        return;
      }

      userData = await this.firestoreService.getDocument('couriers', uid);
      if (userData) {
        this.currentUser = { ...userData, role: 'courier' as UserRole };
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
}
