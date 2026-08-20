import { AriaCheckboxProps } from '../checkbox/useCheckbox';
import { IGridCollection as GridCollection } from 'react-stately/private/grid/GridCollection';
import { GridState } from 'react-stately/private/grid/useGridState';
import { Key } from '@react-types/shared';
export interface AriaGridSelectionCheckboxProps {
    /** A unique key for the checkbox. */
    key: Key;
}
export interface GridSelectionCheckboxAria {
    /** Props for the row selection checkbox element. */
    checkboxProps: AriaCheckboxProps;
}
/**
 * Provides the behavior and accessibility implementation for a selection checkbox in a grid.
 *
 * @param props - Props for the selection checkbox.
 * @param state - State of the grid, as returned by `useGridState`.
 */
export declare function useGridSelectionCheckbox<T, C extends GridCollection<T>>(props: AriaGridSelectionCheckboxProps, state: GridState<T, C>): GridSelectionCheckboxAria;
