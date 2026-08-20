import { NumberFormatOptions } from '@internationalized/number';
/**
 * Provides localized number formatting for the current locale. Automatically updates when the
 * locale changes, and handles caching of the number formatter for performance.
 *
 * @param options - Formatting options.
 */
export declare function useNumberFormatter(options?: NumberFormatOptions): Intl.NumberFormat;
