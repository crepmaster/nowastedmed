import { Observable, Frame } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';

export class UserDetailsViewModel extends Observable {
    private adminService: AdminService;
    public user: any;
    public activityHistory: any[];

    constructor(userId: string) {
        super();
        this.adminService = AdminService.getInstance();
        this.loadUserDetails(userId);
    }

    private async loadUserDetails(userId: string) {
        // TODO: Implement API call to get user details
        this.user = {
            id: userId,
            name: 'Sample User',
            role: 'pharmacy',
            email: 'user@example.com',
            phoneNumber: '+1234567890',
            status: 'active'
        };

        this.activityHistory = [
            { action: 'User logged in', timestamp: new Date() },
            { action: 'Updated profile information', timestamp: new Date(Date.now() - 86400000) },
            { action: 'Created account', timestamp: new Date(Date.now() - 172800000) }
        ];

        this.notifyPropertyChange('user', this.user);
        this.notifyPropertyChange('activityHistory', this.activityHistory);
    }

    async onToggleStatus() {
        try {
            // TODO: Implement API call to toggle user status
            this.user.status = this.user.status === 'active' ? 'inactive' : 'active';
            this.notifyPropertyChange('user', this.user);
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    }
}