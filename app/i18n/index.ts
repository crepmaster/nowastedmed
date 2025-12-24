/**
 * i18n Module Index
 *
 * Usage:
 * import { t, setLanguage, getCurrentLanguage } from '~/i18n';
 *
 * // Translate a key
 * const text = t('common.save');  // "Enregistrer" (French) or "Save" (English)
 *
 * // With parameters
 * const error = t('validation.minLength', { min: 8 });  // "Must be at least 8 characters"
 *
 * // Change language
 * setLanguage('en');
 */

export {
    I18nService,
    getI18nService,
    t,
    getCurrentLanguage,
    setLanguage,
    LANGUAGE_DISPLAY_NAMES,
    TranslationKey,
} from './i18n.service';

export { FR_TRANSLATIONS } from './translations/fr';
export { EN_TRANSLATIONS } from './translations/en';
