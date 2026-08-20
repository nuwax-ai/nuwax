import { DOMAttributes, RefObject } from '@react-types/shared';
import { GridRowProps } from '../grid/useGridRow';
import { TableState } from 'react-stately/useTableState';
export interface TableHeaderRowAria {
    /** Props for the grid row element. */
    rowProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a header row in a table.
 *
 * @param props - Props for the row.
 * @param state - State of the table, as returned by `useTableState`.
 */
export declare function useTableHeaderRow<T>(props: GridRowProps<T>, state: TableState<T>, ref: RefObject<Element | null>): TableHeaderRowAria;
