import { Observable, Dialogs } from '@nativescript/core';
import { getAuthSessionService, AuthSessionService } from '../../services/auth-session.service';
import { NavigationService } from '../../services/navigation.service';
import { InputSanitizerService } from '../../services/utils/input-sanitizer.service';
import { t, setLanguage, getCurrentLanguage, getI18nService, LANGUAGE_DISPLAY_NAMES } from '../../i18n';
import { SupportedLanguage } from '../../data/medicine-database.model';
import { getEnvironmentService } from '../../config/environment.config';

export class LoginViewModel extends Observable {
    private authSession: AuthSessionService;
    private navigationService: NavigationService;
    private sanitizer: InputSanitizerService;

    public email: string = '';
    public password: string = '';
    public errorMessage: string = '';

    constructor() {
        super();
        this.authSession = getAuthSessionService();
        this.navigationService = NavigationService.getInstance();
        this.sanitizer = InputSanitizerService.getInstance();

        // Listen for language changes
        getI18nService().on('languageChanged', () => {
            this.updateLabels();
        });
    }

    // === i18n Labels ===

    get loginTitle(): string {
        return t('auth.login');
    }

    get appTagline(): string {
        return getCurrentLanguage() === 'fr'
            ? 'Plateforme d\'échange de médicaments entre pharmacies'
            : 'Medicine exchange platform for pharmacies';
    }

    get emailLabel(): string {
        return t('auth.email');
    }

    get emailHint(): string {
        return getCurrentLanguage() === 'fr' ? 'Entrez votre email' : 'Enter your email';
    }

    get passwordLabel(): string {
        return t('auth.password');
    }

    get passwordHint(): string {
        return getCurrentLanguage() === 'fr' ? 'Entrez votre mot de passe' : 'Enter your password';
    }

    get loginButton(): string {
        return t('auth.login');
    }

    get registerButton(): string {
        return t('auth.createAccount');
    }

    get forgotPasswordLink(): string {
        return t('auth.forgotPassword');
    }

    get selectLanguageLabel(): string {
        return t('settings.selectLanguage');
    }

    get currentLanguage(): SupportedLanguage {
        return getCurrentLanguage();
    }

    get currentLanguageShort(): string {
        return getCurrentLanguage().toUpperCase();
    }

    get isDemoMode(): boolean {
        return getEnvironmentService().getConfig().features.enableDemoMode;
    }

    get demoModeTitle(): string {
        return t('demo.demoMode');
    }

    get demoPharmacyLogin(): string {
        return t('demo.loginAsPharmacy');
    }

    get demoCourierLogin(): string {
        return t('demo.loginAsCourier');
    }

    private updateLabels(): void {
        this.notifyPropertyChange('loginTitle', this.loginTitle);
        this.notifyPropertyChange('appTagline', this.appTagline);
        this.notifyPropertyChange('emailLabel', this.emailLabel);
        this.notifyPropertyChange('emailHint', this.emailHint);
        this.notifyPropertyChange('passwordLabel', this.passwordLabel);
        this.notifyPropertyChange('passwordHint', this.passwordHint);
        this.notifyPropertyChange('loginButton', this.loginButton);
        this.notifyPropertyChange('registerButton', this.registerButton);
        this.notifyPropertyChange('forgotPasswordLink', this.forgotPasswordLink);
        this.notifyPropertyChange('selectLanguageLabel', this.selectLanguageLabel);
        this.notifyPropertyChange('currentLanguage', this.currentLanguage);
        this.notifyPropertyChange('currentLanguageShort', this.currentLanguageShort);
        this.notifyPropertyChange('demoModeTitle', this.demoModeTitle);
        this.notifyPropertyChange('demoPharmacyLogin', this.demoPharmacyLogin);
        this.notifyPropertyChange('demoCourierLogin', this.demoCourierLogin);
    }

    setLanguage(lang: SupportedLanguage): void {
        setLanguage(lang);
        this.updateLabels();
    }

    onSetFrench(): void {
        this.setLanguage('fr');
    }

    onSetEnglish(): void {
        this.setLanguage('en');
    }

    onToggleLanguage(): void {
        const newLang = getCurrentLanguage() === 'fr' ? 'en' : 'fr';
        this.setLanguage(newLang);
    }

    onForgotPassword(): void {
        Dialogs.alert({
            title: t('auth.forgotPassword'),
            message: getCurrentLanguage() === 'fr'
                ? 'La fonctionnalité de réinitialisation du mot de passe sera disponible bientôt.'
                : 'Password reset functionality coming soon.',
            okButtonText: t('common.ok')
        });
    }

    async onDemoPharmacyLogin(): Promise<void> {
        // Demo pharmacy credentials
        this.set('email', 'demo-pharmacy@nowastedmed.com');
        this.set('password', 'demo123');
        await this.onLogin();
    }

    async onDemoCourierLogin(): Promise<void> {
        // Demo courier credentials
        this.set('email', 'demo-courier@nowastedmed.com');
        this.set('password', 'demo123');
        await this.onLogin();
    }

    async onLogin() {
        try {
            if (!this.validateInput()) return;

            // Sanitize email before login attempt
            const sanitizedEmail = this.sanitizer.sanitizeEmail(this.email);
            const success = await this.authSession.login(sanitizedEmail, this.password);
            if (!success) {
                this.set('errorMessage', t('auth.invalidCredentials'));
                return;
            }

            // Use AuthSessionService for role-based routing
            const targetPage = this.authSession.getDashboardRoute();
            if (!targetPage) {
                this.set('errorMessage', t('errors.unauthorized'));
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
            this.set('errorMessage', t('errors.generic'));
        }
    }

    private validateInput(): boolean {
        if (!this.email) {
            this.set('errorMessage', t('auth.emailRequired'));
            return false;
        }
        if (!this.password) {
            this.set('errorMessage', t('auth.passwordRequired'));
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