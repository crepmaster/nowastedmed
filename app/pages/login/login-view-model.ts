import { Observable } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';

export class LoginViewModel extends Observable {
    private authService: AuthService;
    private navigationService: NavigationService;
    
    public email: string = '';
    public password: string = '';
    public errorMessage: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
    }

    async onLogin() {
        try {
            if (!this.validateInput()) return;

            const success = await this.authService.login(this.email, this.password);
            if (!success) {
                this.set('errorMessage', 'Invalid credentials');
                return;
            }

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User data not found');
                return;
            }

            let targetPage = '';
            switch (user.role) {
                case 'admin':
                    targetPage = 'pages/admin/dashboard/admin-dashboard-page';
                    break;
                case 'pharmacist':
                    targetPage = 'pages/pharmacy/dashboard/pharmacy-dashboard-page';
                    break;
                case 'courier':
                    targetPage = 'pages/courier/dashboard/courier-dashboard-page';
                    break;
                default:
                    this.set('errorMessage', 'Invalid user role');
                    return;
            }

            this.navigationService.navigate({
                moduleName: targetPage,
                clearHistory: true,
                animated: true,
                transition: {
                    name: 'fade',
                    duration: 200
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            this.set('errorMessage', 'An error occurred during login');
        }
    }

    private validateInput(): boolean {
        if (!this.email || !this.password) {
            this.set('errorMessage', 'Please enter both email and password');
            return false;
        }
        return true;
    }

    onRegister() {
        this.navigationService.navigate({
            moduleName: 'pages/registration/registration-page'
        });
    }
}