/**
 * Internationalization (i18n) Service
 *
 * Provides multi-language support for the NoWastedMed application.
 * Default language: French (primary market is French-speaking Africa)
 * Supported languages: French, English, Portuguese, Spanish
 */

import { Observable, ApplicationSettings } from '@nativescript/core';
import { FR_TRANSLATIONS } from './translations/fr';
import { EN_TRANSLATIONS } from './translations/en';
import { SupportedLanguage } from '../data/medicine-database.model';

// Type definitions for translations
type TranslationObject = typeof FR_TRANSLATIONS;
type NestedKeyOf<T> = T extends object
    ? { [K in keyof T]: K extends string
        ? T[K] extends object
            ? `${K}.${NestedKeyOf<T[K]>}` | K
            : K
        : never
    }[keyof T]
    : never;

export type TranslationKey = NestedKeyOf<TranslationObject>;

// Language display names
export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
    fr: 'Français',
    en: 'English',
    pt: 'Português',
    es: 'Español',
};

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

// All translations
const TRANSLATIONS: Partial<Record<SupportedLanguage, TranslationObject>> = {
    fr: FR_TRANSLATIONS,
    en: EN_TRANSLATIONS,
    // pt and es will fall back to fr or en
};

/**
 * i18n Service - Singleton
 */
export class I18nService extends Observable {
    private static instance: I18nService;
    private currentLanguage: SupportedLanguage = 'fr';
    private translations: TranslationObject;

    private constructor() {
        super();
        this.loadLanguagePreference();
        this.translations = this.getTranslationsForLanguage(this.currentLanguage);
    }

    static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    /**
     * Load saved language preference
     */
    private loadLanguagePreference(): void {
        const savedLanguage = ApplicationSettings.getString(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && this.isValidLanguage(savedLanguage)) {
            this.currentLanguage = savedLanguage as SupportedLanguage;
        }
    }

    /**
     * Save language preference
     */
    private saveLanguagePreference(): void {
        ApplicationSettings.setString(LANGUAGE_STORAGE_KEY, this.currentLanguage);
    }

    /**
     * Check if language code is valid
     */
    private isValidLanguage(lang: string): boolean {
        return ['fr', 'en', 'pt', 'es'].includes(lang);
    }

    /**
     * Get translations for a language (with fallback)
     */
    private getTranslationsForLanguage(lang: SupportedLanguage): TranslationObject {
        // Direct match
        if (TRANSLATIONS[lang]) {
            return TRANSLATIONS[lang]!;
        }

        // Fallback for pt/es to fr (French is default for African francophone)
        if (lang === 'pt' || lang === 'es') {
            console.log(`[i18n] Language ${lang} not fully supported, falling back to French`);
            return TRANSLATIONS.fr!;
        }

        // Default to French
        return TRANSLATIONS.fr!;
    }

    /**
     * Get current language
     */
    getLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    /**
     * Get current language display name
     */
    getLanguageDisplayName(): string {
        return LANGUAGE_DISPLAY_NAMES[this.currentLanguage];
    }

    /**
     * Get all available languages
     */
    getAvailableLanguages(): { code: SupportedLanguage; name: string; supported: boolean }[] {
        return [
            { code: 'fr', name: 'Français', supported: true },
            { code: 'en', name: 'English', supported: true },
            { code: 'pt', name: 'Português', supported: false }, // Coming soon
            { code: 'es', name: 'Español', supported: false }, // Coming soon
        ];
    }

    /**
     * Set current language
     */
    setLanguage(lang: SupportedLanguage): void {
        if (this.currentLanguage === lang) return;

        this.currentLanguage = lang;
        this.translations = this.getTranslationsForLanguage(lang);
        this.saveLanguagePreference();

        // Notify observers of language change
        this.notifyPropertyChange('language', lang);
        this.notify({
            eventName: 'languageChanged',
            object: this,
            language: lang,
        });

        console.log(`[i18n] Language changed to: ${lang} (${LANGUAGE_DISPLAY_NAMES[lang]})`);
    }

    /**
     * Translate a key
     * @param key Dot-notation key (e.g., 'common.save', 'auth.login')
     * @param params Optional parameters for interpolation
     */
    t(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: unknown = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                // Key not found, return key itself
                console.warn(`[i18n] Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`[i18n] Translation value is not a string: ${key}`);
            return key;
        }

        // Interpolate parameters
        if (params) {
            return this.interpolate(value, params);
        }

        return value;
    }

    /**
     * Interpolate parameters in translation string
     * Supports {paramName} syntax
     */
    private interpolate(text: string, params: Record<string, string | number>): string {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key]?.toString() ?? match;
        });
    }

    /**
     * Get a translation section (for forms, etc.)
     */
    getSection<K extends keyof TranslationObject>(section: K): TranslationObject[K] {
        return this.translations[section];
    }

    /**
     * Check if translation key exists
     */
    hasKey(key: string): boolean {
        const keys = key.split('.');
        let value: unknown = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return false;
            }
        }

        return typeof value === 'string';
    }
}

// Singleton getter
export const getI18nService = (): I18nService => I18nService.getInstance();

/**
 * Convenience function for translations
 * Usage: t('common.save') or t('validation.minLength', { min: 8 })
 */
export function t(key: string, params?: Record<string, string | number>): string {
    return I18nService.getInstance().t(key, params);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
    return I18nService.getInstance().getLanguage();
}

/**
 * Set application language
 */
export function setLanguage(lang: SupportedLanguage): void {
    I18nService.getInstance().setLanguage(lang);
}
