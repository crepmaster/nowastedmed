import { Observable, Frame, Dialogs } from '@nativescript/core';
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
import { MobileMoneyProvider, getProvidersByRegion } from '../../../models/wallet.model';
import { getCountryByCode } from '../../../models/location.model';

export class AccountViewModel extends Observable {
    private authService: AuthFirebaseService;

    constructor() {
        super();
        this.authService = AuthFirebaseService.getInstance();
        this.loadUserData();
    }

    /**
     * Refresh user data (called when returning from edit profile)
     */
    refresh(): void {
        this.loadUserData();
    }

    private loadUserData(): void {
        const user = this.authService.getCurrentUser();

        if (user) {
            // Common fields
            this.set('userName', user.name || 'User');
            this.set('userEmail', user.email || '');
            this.set('phoneNumber', user.phoneNumber || 'Not set');
            this.set('userInitials', this.getInitials(user.name || 'U'));

            // Role-specific
            const role = user.role;
            this.set('isPharmacy', role === 'pharmacist');
            this.set('isCourier', role === 'courier');

            // Page title and role badge
            if (role === 'pharmacist') {
                this.set('pageTitle', 'My Account');
                this.set('roleBadge', 'Pharmacist');
                this.set('roleColor', '#3B82F6');
                this.set('pharmacyName', (user as any).pharmacyName || 'N/A');
                this.set('licenseNumber', (user as any).licenseNumber || 'N/A');
                this.set('address', (user as any).address || 'N/A');
            } else if (role === 'courier') {
                this.set('pageTitle', 'My Account');
                this.set('roleBadge', 'Courier');
                this.set('roleColor', '#10B981');
                this.set('vehicleType', (user as any).vehicleType || 'N/A');
                this.set('rating', (user as any).rating ? `${(user as any).rating}/5` : 'No ratings yet');
                this.set('totalDeliveries', (user as any).totalDeliveries || '0');
            } else {
                this.set('pageTitle', 'My Account');
                this.set('roleBadge', role || 'User');
                this.set('roleColor', '#6B7280');
            }

            // Account status
            this.set('accountStatus', user.isActive ? 'Active' : 'Inactive');
            this.set('statusClass', user.isActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold');

            // Subscription
            this.set('subscriptionStatus', user.hasActiveSubscription ? 'Active' : 'None');

            // Mobile Money Provider
            const mobileMoneyProviderName = (user as any).mobileMoneyProviderName;
            this.set('mobileMoneyProvider', mobileMoneyProviderName || 'Not configured');
            this.set('hasMobileMoneyProvider', !!mobileMoneyProviderName);

            // Location info
            const location = (user as any).location;
            if (location) {
                this.set('userCountry', location.countryName || 'N/A');
                this.set('userCity', location.cityName || 'N/A');
                this.set('userRegion', location.region || 'N/A');
            } else {
                this.set('userCountry', 'N/A');
                this.set('userCity', 'N/A');
                this.set('userRegion', 'N/A');
            }

            // Member since
            const createdAt = user.createdAt;
            if (createdAt) {
                const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
                this.set('memberSince', date.toLocaleDateString());
            } else {
                this.set('memberSince', 'N/A');
            }
        }
    }

    private getInitials(name: string): string {
        const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        const cleanName = name.trim();
        return cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase() || 'U';
    }

    onEditProfile(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/account/edit-profile-page'
        });
    }

    onChangePassword(): void {
        Dialogs.alert({
            title: 'Change Password',
            message: 'Password change will be available soon.',
            okButtonText: 'OK'
        });
    }

    onNotificationSettings(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/settings/settings-page'
        });
    }

    onChangeLanguage(): void {
        Dialogs.action({
            title: 'Select Language',
            cancelButtonText: 'Cancel',
            actions: ['Francais', 'English']
        }).then((result) => {
            if (result === 'Francais' || result === 'English') {
                // TODO: Implement language change
                Dialogs.alert({
                    title: 'Language',
                    message: `Language changed to ${result}`,
                    okButtonText: 'OK'
                });
            }
        });
    }

    onGoToWallet(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/wallet/wallet-page'
        });
    }

    onGoToSubscription(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/shared/subscription/subscription-page'
        });
    }

    onGoToEarnings(): void {
        Frame.topmost().navigate({
            moduleName: 'pages/courier/earnings/earnings-page'
        });
    }

    async onChangeMobileMoneyProvider(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const location = (user as any).location;
        const region = location?.region || 'west_africa';

        // Get available providers for user's region
        const providers = getProvidersByRegion(region);
        if (providers.length === 0) {
            Dialogs.alert({
                title: 'No Providers',
                message: 'No mobile money providers available for your region.',
                okButtonText: 'OK'
            });
            return;
        }

        const providerNames = providers.map(p => p.name);
        const result = await Dialogs.action({
            title: 'Select Mobile Money Provider',
            message: 'Choose your preferred provider for wallet operations',
            cancelButtonText: 'Cancel',
            actions: providerNames
        });

        if (result && result !== 'Cancel') {
            const selectedProvider = providers.find(p => p.name === result);
            if (selectedProvider) {
                try {
                    // Update user profile with new provider
                    await this.authService.updateUserProfile({
                        mobileMoneyProvider: selectedProvider.id,
                        mobileMoneyProviderName: selectedProvider.name
                    });

                    this.set('mobileMoneyProvider', selectedProvider.name);
                    this.set('hasMobileMoneyProvider', true);

                    Dialogs.alert({
                        title: 'Provider Updated',
                        message: `Mobile money provider changed to ${selectedProvider.name}`,
                        okButtonText: 'OK'
                    });
                } catch (error) {
                    console.error('Error updating provider:', error);
                    Dialogs.alert({
                        title: 'Error',
                        message: 'Failed to update provider. Please try again.',
                        okButtonText: 'OK'
                    });
                }
            }
        }
    }

    async onLogout(): Promise<void> {
        const result = await Dialogs.confirm({
            title: 'Logout',
            message: 'Are you sure you want to logout?',
            okButtonText: 'Logout',
            cancelButtonText: 'Cancel'
        });

        if (result) {
            await this.authService.logout();
            Frame.topmost().navigate({
                moduleName: 'pages/login/login-page',
                clearHistory: true
            });
        }
    }
}
