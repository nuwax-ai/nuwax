import { Collection, CollectionStateBase, Key, LayoutDelegate, Node } from '@react-types/shared';
import { MultipleSelectionStateProps } from '../selection/useMultipleSelectionState';
import { SelectionManager } from '../selection/SelectionManager';
export interface ListProps<T> extends CollectionStateBase<T>, MultipleSelectionStateProps {
    /** Filter function to generate a filtered list of nodes. */
    filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>;
    /** @private */
    suppressTextValueWarning?: boolean;
    /**
     * A delegate object that provides layout information for items in the collection.
     * This can be used to override the behavior of shift selection.
     */
    layoutDelegate?: LayoutDelegate;
}
export interface ListState<T> {
    /** A collection of items in the list. */
    collection: Collection<Node<T>>;
    /** A set of items that are disabled. */
    disabledKeys: Set<Key>;
    /** A selection manager to read and update multiple selection state. */
    selectionManager: SelectionManager;
}
/**
 * Provides state management for list-like components. Handles building a collection
 * of items from props, and manages multiple selection state.
 */
export declare function useListState<T>(props: ListProps<T>): ListState<T>;
/**
 * Filters a collection using the provided filter function and returns a new ListState.
 */
export declare function UNSTABLE_useFilteredListState<T>(state: ListState<T>, filterFn: ((nodeValue: string, node: Node<T>) => boolean) | null | undefined): ListState<T>;
