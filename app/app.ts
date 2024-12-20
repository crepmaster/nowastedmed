import { Application } from '@nativescript/core';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { PermissionsService } from './services/permissions.service';
import { NavigationService } from './services/navigation.service';

// Initialize services
AuthService.getInstance();
AdminService.getInstance();
PermissionsService.getInstance();
NavigationService.getInstance();

Application.run({ moduleName: 'app-root' });