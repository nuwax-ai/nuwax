/**
 * A NumberParser can be used to perform locale-aware parsing of numbers from Unicode strings,
 * as well as validation of partial user input. It automatically detects the numbering system
 * used in the input, and supports parsing decimals, percentages, currency values, and units
 * according to the locale.
 */
export declare class NumberParser {
    private locale;
    private options;
    constructor(locale: string, options?: Intl.NumberFormatOptions);
    /**
     * Parses the given string to a number. Returns NaN if a valid number could not be parsed.
     */
    parse(value: string): number;
    /**
     * Returns whether the given string could potentially be a valid number. This should be used to
     * validate user input as the user types. If a `minValue` or `maxValue` is provided, the validity
     * of the minus/plus sign characters can be checked.
     */
    isValidPartialNumber(value: string, minValue?: number, maxValue?: number): boolean;
    /**
     * Returns a numbering system for which the given string is valid in the current locale.
     * If no numbering system could be detected, the default numbering system for the current
     * locale is returned.
     */
    getNumberingSystem(value: string): string;
}
