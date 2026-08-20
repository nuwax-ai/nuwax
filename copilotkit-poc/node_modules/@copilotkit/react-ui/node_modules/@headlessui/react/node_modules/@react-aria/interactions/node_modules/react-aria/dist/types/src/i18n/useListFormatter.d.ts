/**
 * Provides localized list formatting for the current locale. Automatically updates when the locale
 * changes, and handles caching of the list formatter for performance.
 *
 * @param options - Formatting options.
 */
export declare function useListFormatter(options?: Intl.ListFormatOptions): Intl.ListFormat;
