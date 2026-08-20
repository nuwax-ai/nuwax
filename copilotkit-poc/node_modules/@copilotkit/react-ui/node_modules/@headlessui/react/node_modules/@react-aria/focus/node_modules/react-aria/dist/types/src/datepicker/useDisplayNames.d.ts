type Field = Intl.DateTimeFormatPartTypes;
interface DisplayNames {
    of(field: Field): string | undefined;
}
/** @private */
export declare function useDisplayNames(): DisplayNames;
export {};
