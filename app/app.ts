import { Application } from '@nativescript/core';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { PermissionsService } from './services/permissions.service';

// Initialize services
AuthService.getInstance();
AdminService.getInstance();
PermissionsService.getInstance();

// Register pages for navigation
Application.run({ moduleName: 'app-root' });