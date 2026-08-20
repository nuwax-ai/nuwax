interface DateRangeFormatPart extends Intl.DateTimeFormatPart {
    source: 'startRange' | 'endRange' | 'shared';
}
/** A wrapper around Intl.DateTimeFormat that fixes various browser bugs, and polyfills new features. */
export declare class DateFormatter implements Intl.DateTimeFormat {
    private formatter;
    private options;
    private resolvedHourCycle;
    constructor(locale: string, options?: Intl.DateTimeFormatOptions);
    /**
     * Formats a date as a string according to the locale and format options passed to the
     * constructor.
     */
    format(value: Date): string;
    /** Formats a date to an array of parts such as separators, numbers, punctuation, and more. */
    formatToParts(value: Date): Intl.DateTimeFormatPart[];
    /** Formats a date range as a string. */
    formatRange(start: Date, end: Date): string;
    /** Formats a date range as an array of parts. */
    formatRangeToParts(start: Date, end: Date): DateRangeFormatPart[];
    /** Returns the resolved formatting options based on the values passed to the constructor. */
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions;
}
export {};
