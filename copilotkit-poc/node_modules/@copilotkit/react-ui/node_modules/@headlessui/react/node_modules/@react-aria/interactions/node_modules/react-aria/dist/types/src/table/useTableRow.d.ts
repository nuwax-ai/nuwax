import { AriaButtonProps } from '../button/useButton';
import { FocusableElement, RefObject } from '@react-types/shared';
import { GridRowAria, GridRowProps } from '../grid/useGridRow';
import { TableState } from 'react-stately/useTableState';
import { TreeGridState } from 'react-stately/private/table/useTreeGridState';
export interface TableRowAria extends GridRowAria {
    expandButtonProps: AriaButtonProps;
}
/**
 * Provides the behavior and accessibility implementation for a row in a table.
 *
 * @param props - Props for the row.
 * @param state - State of the table, as returned by `useTableState`.
 */
export declare function useTableRow<T>(props: GridRowProps<T>, state: TableState<T> | TreeGridState<T>, ref: RefObject<FocusableElement | null>): TableRowAria;
