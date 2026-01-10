import { Observable, Frame } from '@nativescript/core';
import { AuthFirebaseService } from '../../services/firebase/auth-firebase.service';

export class RegistrationSuccessViewModel extends Observable {
    private authService: AuthFirebaseService;

    // View bindings
    private _isPharmacy: boolean = false;
    private _showPendingMessage: boolean = true;

    constructor() {
        super();
        this.authService = AuthFirebaseService.getInstance();
        this.checkUserRole();
    }

    get isPharmacy(): boolean { return this._isPharmacy; }
    set isPharmacy(value: boolean) {
        if (this._isPharmacy !== value) {
            this._isPharmacy = value;
            this.notifyPropertyChange('isPharmacy', value);
        }
    }

    get showPendingMessage(): boolean { return this._showPendingMessage; }
    set showPendingMessage(value: boolean) {
        if (this._showPendingMessage !== value) {
            this._showPendingMessage = value;
            this.notifyPropertyChange('showPendingMessage', value);
        }
    }

    private checkUserRole(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.isPharmacy = user.role === 'pharmacist';
            // Pharmacies go to choose plan, couriers wait for approval
            this.showPendingMessage = user.role !== 'pharmacist';
        }
    }

    onChoosePlan(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/subscription/choose-plan-page',
            clearHistory: true,
            transition: {
                name: 'slide',
                duration: 200
            }
        });
    }

    onBackToLogin(): void {
        // Logout first to clear session
        this.authService.logout();
        Frame.topmost().navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true,
            transition: {
                name: 'fade',
                duration: 200
            }
        });
    }
}