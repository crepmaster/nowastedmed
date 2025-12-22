import { Application } from '@nativescript/core';
import { FirebaseService } from './services/firebase/firebase.service';
import { AuthFirebaseService } from './services/firebase/auth-firebase.service';
import { AdminService } from './services/admin.service';
import { PermissionsService } from './services/permissions.service';
import { NavigationService } from './services/navigation.service';

/**
 * Application Entry Point with Firebase Integration
 *
 * This is the Firebase-enabled version of app.ts
 * Use this instead of app.ts when Firebase backend is ready
 *
 * To use:
 * 1. Rename app.ts to app-local.ts (keep as backup)
 * 2. Rename app-firebase.ts to app.ts
 * 3. Rebuild the app
 */

// Initialize Firebase first
FirebaseService.initialize()
  .then(() => {
    console.log('✅ Firebase initialized, starting app...');

    // Initialize Firebase-enabled services
    AuthFirebaseService.getInstance();
    AdminService.getInstance();
    PermissionsService.getInstance();
    NavigationService.getInstance();

    // Run the application
    Application.run({ moduleName: 'app-root' });
  })
  .catch((error) => {
    console.error('❌ Firebase initialization failed:', error);
    console.error('⚠️  App cannot start without Firebase');

    // Optionally show an error dialog to the user
    alert({
      title: 'Initialization Error',
      message: 'Failed to connect to Firebase. Please check your internet connection and try again.',
      okButtonText: 'OK'
    });
  });
