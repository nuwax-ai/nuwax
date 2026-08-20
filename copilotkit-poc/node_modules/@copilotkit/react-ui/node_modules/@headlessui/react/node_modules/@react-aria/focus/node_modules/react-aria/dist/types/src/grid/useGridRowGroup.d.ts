import { DOMAttributes } from '@react-types/shared';
export interface GridRowGroupAria {
    /** Props for the row group element. */
    rowGroupProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for a row group in a grid.
 */
export declare function useGridRowGroup(): GridRowGroupAria;
