import { Observable } from '@nativescript/core';
import { getAuthSessionService, AuthSessionService } from '../../services/auth-session.service';
import { NavigationService } from '../../services/navigation.service';

export class RegistrationSuccessViewModel extends Observable {
    private authSession: AuthSessionService;
    private navigationService: NavigationService;

    // View bindings
    private _isPharmacy: boolean = false;
    private _showPendingMessage: boolean = true;

    constructor() {
        super();
        this.authSession = getAuthSessionService();
        this.navigationService = NavigationService.getInstance();
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
        const user = this.authSession.currentUser;
        if (user) {
            this.isPharmacy = user.role === 'pharmacist';
            // Pharmacies go to choose plan, couriers wait for approval
            this.showPendingMessage = user.role !== 'pharmacist';
        }
    }

    onChoosePlan(): void {
        this.navigationService.navigate({
            moduleName: 'pages/shared/subscription/choose-plan-page',
            clearHistory: true,
            transition: {
                name: 'slide',
                duration: 200
            }
        });
    }

    async onBackToLogin(): Promise<void> {
        // Logout first to clear session
        await this.authSession.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true,
            transition: {
                name: 'fade',
                duration: 200
            }
        });
    }
}
