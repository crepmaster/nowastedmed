import { Application } from '@nativescript/core';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { PermissionsService } from './services/permissions.service';
import { NavigationService } from './services/navigation.service';
import { DemoDataService } from './services/demo/demo-data.service';
import { DebugUtil } from './utils/debug.util';

// Initialize services
AuthService.getInstance();
AdminService.getInstance();
PermissionsService.getInstance();
NavigationService.getInstance();

// Initialize demo data
DemoDataService.getInstance().initializeDemoData();

// Debug: Print registered users
DebugUtil.printRegisteredUsers();

Application.run({ moduleName: 'app-root' });