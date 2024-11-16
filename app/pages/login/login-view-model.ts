import { Observable, Frame } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';

export class LoginViewModel extends Observable {
    private authService: AuthService;
    public email: string = '';
    public password: string = '';
    public errorMessage: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
    }

    async onLogin() {
        try {
            if (!this.email || !this.password) {
                this.set('errorMessage', 'Please enter both email and password');
                return;
            }

            const success = await this.authService.login(this.email, this.password);
            
            if (success) {
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
                        targetPage = 'pages/pharmacist/dashboard/dashboard-page';
                        break;
                    case 'courier':
                        targetPage = 'pages/courier/dashboard/dashboard-page';
                        break;
                    default:
                        this.set('errorMessage', 'Invalid user role');
                        return;
                }

                Frame.topmost().navigate({
                    moduleName: targetPage,
                    clearHistory: true
                });
            } else {
                this.set('errorMessage', 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.set('errorMessage', 'An error occurred during login');
        }
    }

    onRegisterTap() {
        console.log('Attempting to navigate to registration page');
        const frame = Frame.topmost();
        if (frame) {
            frame.navigate({
                moduleName: 'pages/registration/registration-page',
                clearHistory: false,
                animated: true,
                transition: {
                    name: 'slide',
                    duration: 200,
                    curve: 'easeIn'
                }
            });
        } else {
            console.error('No frame found for navigation');
        }
    }
}