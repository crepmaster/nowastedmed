import { Observable, Frame, Dialogs, ApplicationSettings } from '@nativescript/core';
import { t, setLanguage, getCurrentLanguage, getI18nService, LANGUAGE_DISPLAY_NAMES } from '../../../i18n';
import { SupportedLanguage } from '../../../data/medicine-database.model';
import { getEnvironmentService } from '../../../config/environment.config';
import { getAuthService } from '../../../services/auth-factory.service';

export class SettingsViewModel extends Observable {
    private _showLanguageOptions: boolean = false;
    private _pushNotificationsEnabled: boolean = true;
    private _exchangeNotificationsEnabled: boolean = true;
    private _deliveryNotificationsEnabled: boolean = true;

    constructor() {
        super();
        this.loadSettings();
        this.updateLabels();

        // Listen for language changes to update UI
        getI18nService().on('languageChanged', () => {
            this.updateLabels();
        });
    }

    /**
     * Load saved settings
     */
    private loadSettings(): void {
        this._pushNotificationsEnabled = ApplicationSettings.getBoolean('push_notifications', true);
        this._exchangeNotificationsEnabled = ApplicationSettings.getBoolean('exchange_notifications', true);
        this._deliveryNotificationsEnabled = ApplicationSettings.getBoolean('delivery_notifications', true);
    }

    /**
     * Update all UI labels based on current language
     */
    private updateLabels(): void {
        // Page title
        this.notifyPropertyChange('pageTitle', t('settings.title'));

        // Language section
        this.notifyPropertyChange('languageSectionTitle', t('settings.language'));
        this.notifyPropertyChange('languageLabel', t('settings.selectLanguage'));
        this.notifyPropertyChange('currentLanguageName', LANGUAGE_DISPLAY_NAMES[getCurrentLanguage()]);
        this.notifyPropertyChange('currentLanguage', getCurrentLanguage());

        // Notifications section
        this.notifyPropertyChange('notificationsSectionTitle', t('settings.notifications'));
        this.notifyPropertyChange('pushNotificationsLabel', t('settings.pushNotifications'));
        this.notifyPropertyChange('exchangeNotificationsLabel', t('settings.exchangeNotifications'));
        this.notifyPropertyChange('deliveryNotificationsLabel', t('settings.deliveryNotifications'));

        // Account section
        this.notifyPropertyChange('accountSectionTitle', t('settings.account'));
        this.notifyPropertyChange('changePasswordLabel', t('settings.changePassword'));
        this.notifyPropertyChange('editProfileLabel', t('profile.editProfile'));

        // About section
        this.notifyPropertyChange('aboutSectionTitle', t('nav.about'));
        this.notifyPropertyChange('versionLabel', 'Version');
        this.notifyPropertyChange('helpLabel', t('nav.help'));

        // Actions
        this.notifyPropertyChange('logoutLabel', t('auth.logout'));

        // Demo mode
        this.notifyPropertyChange('demoModeLabel', t('demo.demoMode'));
        this.notifyPropertyChange('demoModeDescription', t('demo.demoModeActive'));
    }

    // === Getters ===

    get pageTitle(): string {
        return t('settings.title');
    }

    get languageSectionTitle(): string {
        return t('settings.language');
    }

    get languageLabel(): string {
        return t('settings.selectLanguage');
    }

    get currentLanguageName(): string {
        return LANGUAGE_DISPLAY_NAMES[getCurrentLanguage()];
    }

    get currentLanguage(): SupportedLanguage {
        return getCurrentLanguage();
    }

    get showLanguageOptions(): boolean {
        return this._showLanguageOptions;
    }

    get notificationsSectionTitle(): string {
        return t('settings.notifications');
    }

    get pushNotificationsLabel(): string {
        return t('settings.pushNotifications');
    }

    get exchangeNotificationsLabel(): string {
        return t('settings.exchangeNotifications');
    }

    get deliveryNotificationsLabel(): string {
        return t('settings.deliveryNotifications');
    }

    get pushNotificationsEnabled(): boolean {
        return this._pushNotificationsEnabled;
    }

    set pushNotificationsEnabled(value: boolean) {
        if (this._pushNotificationsEnabled !== value) {
            this._pushNotificationsEnabled = value;
            ApplicationSettings.setBoolean('push_notifications', value);
            this.notifyPropertyChange('pushNotificationsEnabled', value);
        }
    }

    get exchangeNotificationsEnabled(): boolean {
        return this._exchangeNotificationsEnabled;
    }

    set exchangeNotificationsEnabled(value: boolean) {
        if (this._exchangeNotificationsEnabled !== value) {
            this._exchangeNotificationsEnabled = value;
            ApplicationSettings.setBoolean('exchange_notifications', value);
            this.notifyPropertyChange('exchangeNotificationsEnabled', value);
        }
    }

    get deliveryNotificationsEnabled(): boolean {
        return this._deliveryNotificationsEnabled;
    }

    set deliveryNotificationsEnabled(value: boolean) {
        if (this._deliveryNotificationsEnabled !== value) {
            this._deliveryNotificationsEnabled = value;
            ApplicationSettings.setBoolean('delivery_notifications', value);
            this.notifyPropertyChange('deliveryNotificationsEnabled', value);
        }
    }

    get accountSectionTitle(): string {
        return t('settings.account');
    }

    get changePasswordLabel(): string {
        return t('settings.changePassword');
    }

    get editProfileLabel(): string {
        return t('profile.editProfile');
    }

    get aboutSectionTitle(): string {
        return t('nav.about');
    }

    get versionLabel(): string {
        return 'Version';
    }

    get helpLabel(): string {
        return t('nav.help');
    }

    get logoutLabel(): string {
        return t('auth.logout');
    }

    get isDemoMode(): boolean {
        return getEnvironmentService().getConfig().features.enableDemoMode;
    }

    get demoModeLabel(): string {
        return t('demo.demoMode');
    }

    get demoModeDescription(): string {
        return t('demo.demoModeActive');
    }

    // === Actions ===

    onLanguageSelect(): void {
        this._showLanguageOptions = !this._showLanguageOptions;
        this.notifyPropertyChange('showLanguageOptions', this._showLanguageOptions);
    }

    selectLanguage(language: SupportedLanguage): void {
        if (language === 'pt' || language === 'es') {
            // Not yet supported
            Dialogs.alert({
                title: 'Coming Soon',
                message: 'This language will be available soon.',
                okButtonText: 'OK'
            });
            return;
        }

        setLanguage(language);
        this._showLanguageOptions = false;
        this.notifyPropertyChange('showLanguageOptions', this._showLanguageOptions);
        this.updateLabels();

        // Show confirmation
        Dialogs.alert({
            title: t('common.success'),
            message: t('settings.settingsSaved'),
            okButtonText: t('common.ok')
        });
    }

    onChangePassword(): void {
        Dialogs.alert({
            title: t('settings.changePassword'),
            message: 'Password change functionality coming soon.',
            okButtonText: t('common.ok')
        });
    }

    onEditProfile(): void {
        Dialogs.alert({
            title: t('profile.editProfile'),
            message: 'Profile editing functionality coming soon.',
            okButtonText: t('common.ok')
        });
    }

    onOpenHelp(): void {
        Dialogs.alert({
            title: t('nav.help'),
            message: 'Help & Support functionality coming soon.',
            okButtonText: t('common.ok')
        });
    }

    async onLogout(): Promise<void> {
        const result = await Dialogs.confirm({
            title: t('auth.logout'),
            message: t('confirm.logout'),
            okButtonText: t('common.yes'),
            cancelButtonText: t('common.no')
        });

        if (result) {
            try {
                await getAuthService().logout();
                Frame.topmost().navigate({
                    moduleName: 'pages/login/login-page',
                    clearHistory: true
                });
            } catch (error) {
                console.error('[Settings] Logout error:', error);
                Dialogs.alert({
                    title: t('common.error'),
                    message: t('errors.generic'),
                    okButtonText: t('common.ok')
                });
            }
        }
    }
}
