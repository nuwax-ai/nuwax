import { DateFormatter } from '@internationalized/date';
export interface DateFormatterOptions extends Intl.DateTimeFormatOptions {
    calendar?: string;
}
/**
 * Provides localized date formatting for the current locale. Automatically updates when the locale
 * changes, and handles caching of the date formatter for performance.
 *
 * @param options - Formatting options.
 */
export declare function useDateFormatter(options?: DateFormatterOptions): DateFormatter;
