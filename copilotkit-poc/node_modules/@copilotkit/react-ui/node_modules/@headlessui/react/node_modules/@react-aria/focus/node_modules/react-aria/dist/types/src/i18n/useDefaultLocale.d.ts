import { Locale } from './I18nProvider';
/**
 * Gets the locale setting of the browser.
 */
export declare function getDefaultLocale(): Locale;
/**
 * Returns the current browser/system language, and updates when it changes.
 */
export declare function useDefaultLocale(): Locale;
