import type { LocalizedString } from './LocalizedStringFormatter';
export type LocalizedStrings<K extends string, T extends LocalizedString> = {
    [lang: string]: Record<K, T>;
};
/**
 * Stores a mapping of localized strings. Can be used to find the
 * closest available string for a given locale.
 */
export declare class LocalizedStringDictionary<K extends string = string, T extends LocalizedString = string> {
    private strings;
    private defaultLocale;
    constructor(messages: LocalizedStrings<K, T>, defaultLocale?: string);
    /** Returns a localized string for the given key and locale. */
    getStringForLocale(key: K, locale: string): T;
    /** Returns all localized strings for the given locale. */
    getStringsForLocale(locale: string): Record<K, T>;
    static getGlobalDictionaryForPackage<K extends string = string, T extends LocalizedString = string>(packageName: string): LocalizedStringDictionary<K, T> | null;
}
