import { IGridCollection } from './GridCollection';
import { Key } from '@react-types/shared';
import { MultipleSelectionState } from '../selection/types';
import { MultipleSelectionStateProps } from '../selection/useMultipleSelectionState';
import { SelectionManager } from '../selection/SelectionManager';
export interface GridState<T, C extends IGridCollection<T>> {
    collection: C;
    /** A set of keys for rows that are disabled. */
    disabledKeys: Set<Key>;
    /** A selection manager to read and update row selection state. */
    selectionManager: SelectionManager;
    /**
     * Whether keyboard navigation is disabled, such as when the arrow keys should be handled by a
     * component within a cell.
     */
    isKeyboardNavigationDisabled: boolean;
}
export interface GridStateOptions<T, C extends IGridCollection<T>> extends MultipleSelectionStateProps {
    collection: C;
    disabledKeys?: Iterable<Key>;
    focusMode?: 'row' | 'cell';
    /** @private - Do not use unless you know what you're doing. */
    UNSAFE_selectionState?: MultipleSelectionState;
}
/**
 * Provides state management for a grid component. Handles row selection and focusing a grid cell's
 * focusable child if applicable.
 */
export declare function useGridState<T extends object, C extends IGridCollection<T>>(props: GridStateOptions<T, C>): GridState<T, C>;
