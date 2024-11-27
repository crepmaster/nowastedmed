import { Observable, Frame } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { AdminStats, UserApproval } from '../../../models/admin.model';

export class AdminDashboardViewModel extends Observable {
    private adminService: AdminService;
    private authService: AuthService;

    public stats: AdminStats = {
        totalPharmacies: 0,
        totalCouriers: 0,
        totalExchanges: 0,
        totalMedicines: 0,
        savingsAmount: 0
    };
    public analytics: any = {
        activeUsers: 0,
        weeklyGrowth: 0
    };
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
            console.log('Loading dashboard data...');
            
            // Load stats
            this.stats = await this.adminService.getStats();
            console.log('Loaded stats:', this.stats);
            this.notifyPropertyChange('stats', this.stats);

            // Load analytics
            this.analytics = await this.adminService.getUserAnalytics();
            this.notifyPropertyChange('analytics', this.analytics);

            // Load pending approvals
            this.pendingApprovals = await this.adminService.getPendingApprovals();
            this.notifyPropertyChange('pendingApprovals', this.pendingApprovals);

            // Initialize filtered users
            await this.updateFilteredUsers();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    onViewPharmacies() {
        Frame.topmost().navigate({
            moduleName: 'pages/admin/pharmacies/pharmacy-list-page',
            transition: {
                name: 'slide'
            }
        });
    }

    async onApproveUser(args: any) {
        try {
            const approval = args.object.bindingContext;
            await this.adminService.approveUser(approval.id);
            this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approval.id);
            this.notifyPropertyChange('pendingApprovals', this.pendingApprovals);
            await this.loadDashboardData();
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
            await this.loadDashboardData();
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

    private async updateFilteredUsers() {
        try {
            const pharmacies = await this.adminService.getPharmacies();
            console.log('Retrieved pharmacies for filtered users:', pharmacies);
            
            this.filteredUsers = pharmacies.map(pharmacy => ({
                id: pharmacy.id,
                name: pharmacy.pharmacyName,
                role: 'pharmacist',
                email: pharmacy.email
            })).filter(user => 
                !this.searchQuery || 
                user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
            
            console.log('Updated filtered users:', this.filteredUsers);
            this.notifyPropertyChange('filteredUsers', this.filteredUsers);
        } catch (error) {
            console.error('Error updating filtered users:', error);
        }
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