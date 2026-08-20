export interface Filter {
    /** Returns whether a string starts with a given substring. */
    startsWith: (string: string, substring: string) => boolean;
    /** Returns whether a string ends with a given substring. */
    endsWith: (string: string, substring: string) => boolean;
    /** Returns whether a string contains a given substring. */
    contains: (string: string, substring: string) => boolean;
}
/**
 * Provides localized string search functionality that is useful for filtering or matching items in
 * a list. Options can be provided to adjust the sensitivity to case, diacritics, and other
 * parameters.
 */
export declare function useFilter(options?: Intl.CollatorOptions): Filter;
