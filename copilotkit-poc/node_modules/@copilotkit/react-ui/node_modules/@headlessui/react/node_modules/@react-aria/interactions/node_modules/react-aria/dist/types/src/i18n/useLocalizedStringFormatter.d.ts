import { LocalizedString, LocalizedStringDictionary, LocalizedStringFormatter, LocalizedStrings } from '@internationalized/string';
/**
 * Returns a cached LocalizedStringDictionary for the given strings.
 */
export declare function useLocalizedStringDictionary<K extends string = string, T extends LocalizedString = string>(strings: LocalizedStrings<K, T>, packageName?: string): LocalizedStringDictionary<K, T>;
/**
 * Provides localized string formatting for the current locale. Supports interpolating variables,
 * selecting the correct pluralization, and formatting numbers. Automatically updates when the
 * locale changes.
 *
 * @param strings - A mapping of languages to localized strings by key.
 */
export declare function useLocalizedStringFormatter<K extends string = string, T extends LocalizedString = string>(strings: LocalizedStrings<K, T>, packageName?: string): LocalizedStringFormatter<K, T>;
