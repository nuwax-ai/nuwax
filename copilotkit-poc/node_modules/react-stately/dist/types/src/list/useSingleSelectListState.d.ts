import { CollectionStateBase, Key, Node, SingleSelection } from '@react-types/shared';
import { ListState } from './useListState';
export interface SingleSelectListProps<T> extends CollectionStateBase<T>, Omit<SingleSelection, 'disallowEmptySelection'> {
    /** Filter function to generate a filtered list of nodes. */
    filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>;
    /** @private */
    suppressTextValueWarning?: boolean;
}
export interface SingleSelectListState<T> extends ListState<T> {
    /** The key for the currently selected item. */
    readonly selectedKey: Key | null;
    /** Sets the selected key. */
    setSelectedKey(key: Key | null): void;
    /** The value of the currently selected item. */
    readonly selectedItem: Node<T> | null;
}
/**
 * Provides state management for list-like components with single selection.
 * Handles building a collection of items from props, and manages selection state.
 */
export declare function useSingleSelectListState<T extends object>(props: SingleSelectListProps<T>): SingleSelectListState<T>;
