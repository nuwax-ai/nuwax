import { CollectionBase, Key, SingleSelection } from '@react-types/shared';
import { SingleSelectListState } from '../list/useSingleSelectListState';
export interface StepListProps<T> extends CollectionBase<T>, Omit<SingleSelection, 'onSelectionChange'> {
    /** The key of the last completed step (controlled). */
    lastCompletedStep?: Key;
    /** The key of the initially last completed step (uncontrolled). */
    defaultLastCompletedStep?: Key;
    /** Callback for when the last completed step changes. */
    onLastCompletedStepChange?: (key: Key | null) => void;
    /** Whether the step list is disabled. Steps will not be focusable or interactive. */
    isDisabled?: boolean;
    /** Whether the step list is read only. Steps will be focusable but non-interactive. */
    isReadOnly?: boolean;
    /** Handler that is called when the selection changes. */
    onSelectionChange?: (key: Key) => void;
}
export interface StepListState<T> extends SingleSelectListState<T> {
    readonly lastCompletedStep?: Key;
    setLastCompletedStep(key: Key): void;
    isCompleted(key: Key): boolean;
    isSelectable(key: Key): boolean;
}
export declare function useStepListState<T extends object>(props: StepListProps<T>): StepListState<T>;
