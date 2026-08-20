import { AriaGridSelectionCheckboxProps, GridSelectionCheckboxAria } from '../grid/useGridSelectionCheckbox';
import type { ListState } from 'react-stately/useListState';
/**
 * Provides the behavior and accessibility implementation for a selection checkbox in a grid list.
 *
 * @param props - Props for the selection checkbox.
 * @param state - State of the list, as returned by `useListState`.
 */
export declare function useGridListSelectionCheckbox<T>(props: AriaGridSelectionCheckboxProps, state: ListState<T>): GridSelectionCheckboxAria;
