import { AriaCheckboxProps } from '../checkbox/useCheckbox';
import { Key } from '@react-types/shared';
import { TableState } from 'react-stately/useTableState';
export interface AriaTableSelectionCheckboxProps {
    /** A unique key for the checkbox. */
    key: Key;
}
export interface TableSelectionCheckboxAria {
    /** Props for the row selection checkbox element. */
    checkboxProps: AriaCheckboxProps;
}
export interface TableSelectAllCheckboxAria {
    /** Props for the select all checkbox element. */
    checkboxProps: AriaCheckboxProps;
}
/**
 * Provides the behavior and accessibility implementation for a selection checkbox in a table.
 *
 * @param props - Props for the selection checkbox.
 * @param state - State of the table, as returned by `useTableState`.
 */
export declare function useTableSelectionCheckbox<T>(props: AriaTableSelectionCheckboxProps, state: TableState<T>): TableSelectionCheckboxAria;
/**
 * Provides the behavior and accessibility implementation for the select all checkbox in a table.
 *
 * @param props - Props for the select all checkbox.
 * @param state - State of the table, as returned by `useTableState`.
 */
export declare function useTableSelectAllCheckbox<T>(state: TableState<T>): TableSelectAllCheckboxAria;
