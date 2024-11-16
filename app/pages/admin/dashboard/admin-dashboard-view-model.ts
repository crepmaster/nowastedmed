import { Observable, Frame } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { AdminStats, UserApproval } from '../../../models/admin.model';

export class AdminDashboardViewModel extends Observable {
    private adminService: AdminService;
    private authService: AuthService;

    public stats: AdminStats;
    public analytics: any;
    public pendingApprovals: UserApproval[] = [];
    public filteredUsers: any[] = [];
    public selectedTabIndex: number = 0;
    public searchQuery: string = '';

    constructor() {
        super();
        this.adminService = AdminService.getInstance();
        this.authService = AuthService.getInstance();
        this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            // Load stats
            this.stats = await this.adminService.getStats();
            this.notifyPropertyChange('stats', this.stats);

            // Load analytics
            this.analytics = await this.adminService.getUserAnalytics();
            this.notifyPropertyChange('analytics', this.analytics);

            // Load pending approvals
            this.pendingApprovals = await this.adminService.getPendingApprovals();
            this.notifyPropertyChange('pendingApprovals', this.pendingApprovals);

            // Initialize filtered users
            this.updateFilteredUsers();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async onApproveUser(args: any) {
        try {
            const approval = args.object.bindingContext;
            await this.adminService.approveUser(approval.id);
            this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approval.id);
            this.notifyPropertyChange('pendingApprovals', this.pendingApprovals);
        } catch (error) {
            console.error('Error approving user:', error);
        }
    }

    async onRejectUser(args: any) {
        try {
            const approval = args.object.bindingContext;
            await this.adminService.rejectUser(approval.id);
            this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approval.id);
            this.notifyPropertyChange('pendingApprovals', this.pendingApprovals);
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    }

    onSearch() {
        this.updateFilteredUsers();
    }

    onClearSearch() {
        this.searchQuery = '';
        this.updateFilteredUsers();
    }

    private updateFilteredUsers() {
        // TODO: Implement actual user filtering based on searchQuery
        this.filteredUsers = [
            { name: 'Sample Pharmacy', role: 'pharmacy', email: 'pharmacy@example.com' },
            { name: 'Sample Courier', role: 'courier', email: 'courier@example.com' }
        ].filter(user => 
            !this.searchQuery || 
            user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        this.notifyPropertyChange('filteredUsers', this.filteredUsers);
    }

    onUserDetails(args: any) {
        const user = args.object.bindingContext;
        Frame.topmost().navigate({
            moduleName: 'pages/admin/users/user-details-page',
            context: { userId: user.id }
        });
    }

    onLogout() {
        try {
            this.authService.logout();
            Frame.topmost().navigate({
                moduleName: 'pages/login/login-page',
                clearHistory: true,
                transition: {
                    name: 'fade'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}