/**
 * Provides localized string collation for the current locale. Automatically updates when the locale
 * changes, and handles caching of the collator for performance.
 *
 * @param options - Collator options.
 */
export declare function useCollator(options?: Intl.CollatorOptions): Intl.Collator;
