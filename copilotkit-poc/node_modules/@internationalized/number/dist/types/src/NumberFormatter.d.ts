export interface NumberFormatOptions extends Intl.NumberFormatOptions {
    /** Overrides default numbering system for the current locale. */
    numberingSystem?: string;
}
interface NumberRangeFormatPart extends Intl.NumberFormatPart {
    source: 'startRange' | 'endRange' | 'shared';
}
/**
 * A wrapper around Intl.NumberFormat providing additional options, polyfills, and caching for
 * performance.
 */
export declare class NumberFormatter implements Intl.NumberFormat {
    private numberFormatter;
    private options;
    constructor(locale: string, options?: NumberFormatOptions);
    /**
     * Formats a number value as a string, according to the locale and options provided to the
     * constructor.
     */
    format(value: number): string;
    /** Formats a number to an array of parts such as separators, digits, punctuation, and more. */
    formatToParts(value: number): Intl.NumberFormatPart[];
    /** Formats a number range as a string. */
    formatRange(start: number, end: number): string;
    /** Formats a number range as an array of parts. */
    formatRangeToParts(start: number, end: number): NumberRangeFormatPart[];
    /** Returns the resolved formatting options based on the values passed to the constructor. */
    resolvedOptions(): Intl.ResolvedNumberFormatOptions;
}
/** @private - Exported for tests */
export declare function numberFormatSignDisplayPolyfill(numberFormat: Intl.NumberFormat, signDisplay: string, num: number): string;
export {};
