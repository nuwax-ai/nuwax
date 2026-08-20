import { DisabledBehavior, MultipleSelection, SelectionBehavior } from '@react-types/shared';
import { MultipleSelectionState } from './types';
export interface MultipleSelectionStateProps extends MultipleSelection {
    /**
     * How multiple selection should behave in the collection.
     *
     * @default 'toggle'
     */
    selectionBehavior?: SelectionBehavior;
    /** Whether onSelectionChange should fire even if the new set of keys is the same as the last. */
    allowDuplicateSelectionEvents?: boolean;
    /**
     * Whether `disabledKeys` applies to all interactions, or only selection.
     *
     * @default 'all'
     */
    disabledBehavior?: DisabledBehavior;
}
/**
 * Manages state for multiple selection and focus in a collection.
 */
export declare function useMultipleSelectionState(props: MultipleSelectionStateProps): MultipleSelectionState;
