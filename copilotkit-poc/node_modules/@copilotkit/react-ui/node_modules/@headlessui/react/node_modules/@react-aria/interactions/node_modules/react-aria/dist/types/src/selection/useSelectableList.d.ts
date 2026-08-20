import { AriaSelectableCollectionOptions } from './useSelectableCollection';
import { Collection, DOMAttributes, Key, KeyboardDelegate, LayoutDelegate, Node, Orientation } from '@react-types/shared';
export interface AriaSelectableListOptions extends Omit<AriaSelectableCollectionOptions, 'keyboardDelegate'> {
    /**
     * State of the collection.
     */
    collection: Collection<Node<unknown>>;
    /**
     * A delegate object that implements behavior for keyboard focus movement.
     */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * A delegate object that provides layout information for items in the collection.
     * By default this uses the DOM, but this can be overridden to implement things like
     * virtualized scrolling.
     */
    layoutDelegate?: LayoutDelegate;
    /**
     * The item keys that are disabled. These items cannot be selected, focused, or otherwise
     * interacted with.
     */
    disabledKeys: Set<Key>;
    /**
     * The primary orientation of the items. Usually this is the direction that the collection
     * scrolls.
     *
     * @default 'vertical'
     */
    orientation?: Orientation;
}
export interface SelectableListAria {
    /**
     * Props for the option element.
     */
    listProps: DOMAttributes;
}
/**
 * Handles interactions with a selectable list.
 */
export declare function useSelectableList(props: AriaSelectableListOptions): SelectableListAria;
