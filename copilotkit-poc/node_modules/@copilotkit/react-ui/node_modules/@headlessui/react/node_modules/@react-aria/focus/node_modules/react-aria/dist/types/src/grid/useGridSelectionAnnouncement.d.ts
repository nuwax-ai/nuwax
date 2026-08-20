import { Collection, Key, Node } from '@react-types/shared';
import { SelectionManager } from 'react-stately/private/selection/SelectionManager';
export interface GridSelectionAnnouncementProps {
    /**
     * A function that returns the text that should be announced by assistive technology when a row is
     * added or removed from selection.
     *
     * @default (key) => state.collection.getItem(key)?.textValue
     */
    getRowText?: (key: Key) => string;
}
interface GridSelectionState<T> {
    /** A collection of items in the grid. */
    collection: Collection<Node<T>>;
    /** A set of items that are disabled. */
    disabledKeys: Set<Key>;
    /** A selection manager to read and update multiple selection state. */
    selectionManager: SelectionManager;
}
export declare function useGridSelectionAnnouncement<T>(props: GridSelectionAnnouncementProps, state: GridSelectionState<T>): void;
export {};
