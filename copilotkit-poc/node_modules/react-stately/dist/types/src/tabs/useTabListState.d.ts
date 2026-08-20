import { CollectionBase, CollectionStateBase, Key, SingleSelection } from '@react-types/shared';
import { SingleSelectListState } from '../list/useSingleSelectListState';
export interface TabListProps<T> extends CollectionBase<T>, Omit<SingleSelection, 'disallowEmptySelection' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'> {
    /**
     * Whether the TabList is disabled.
     * Shows that a selection exists, but is not available in that circumstance.
     */
    isDisabled?: boolean;
    /** The currently selected key in the collection (controlled). */
    selectedKey?: Key;
    /** The initial selected keys in the collection (uncontrolled). */
    defaultSelectedKey?: Key;
    /** Handler that is called when the selection changes. */
    onSelectionChange?: (key: Key) => void;
}
export interface TabListStateOptions<T> extends Omit<TabListProps<T>, 'children'>, CollectionStateBase<T> {
}
export interface TabListState<T> extends SingleSelectListState<T> {
    /** Whether the tab list is disabled. */
    isDisabled: boolean;
}
/**
 * Provides state management for a Tabs component. Tabs include a TabList which tracks
 * which tab is currently selected and displays the content associated with that Tab in a TabPanel.
 */
export declare function useTabListState<T extends object>(props: TabListStateOptions<T>): TabListState<T>;
