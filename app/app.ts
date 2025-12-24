import { Application } from '@nativescript/core';
import { getAuthService } from './services/auth-factory.service';
import { AdminService } from './services/admin.service';
import { PermissionsService } from './services/permissions.service';
import { NavigationService } from './services/navigation.service';
import { DemoDataService } from './services/demo/demo-data.service';
import { DebugUtil } from './utils/debug.util';
import { getEnvironmentService } from './config/environment.config';

// Initialize services
getAuthService(); // Initialize appropriate auth service based on environment
AdminService.getInstance();
PermissionsService.getInstance();
NavigationService.getInstance();

// Initialize demo data only when NOT using Firebase Auth
// (Firebase users are managed in Firebase Console, not locally)
const env = getEnvironmentService();
if (!env.isFeatureEnabled('useFirebaseAuth')) {
    DemoDataService.getInstance().initializeDemoData();
    // Debug: Print registered users (only for local auth)
    DebugUtil.printRegisteredUsers();
} else {
    console.log('🔐 Using Firebase Auth - demo data initialization skipped');
    console.log('📝 Demo users should be created in Firebase Console');
}

Application.run({ moduleName: 'app-root' });