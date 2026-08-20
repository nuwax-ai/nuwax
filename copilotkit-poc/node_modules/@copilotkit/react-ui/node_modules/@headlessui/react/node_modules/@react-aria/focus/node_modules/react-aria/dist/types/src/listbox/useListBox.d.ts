import { AriaLabelingProps, CollectionBase, DOMAttributes, DOMProps, FocusEvents, FocusStrategy, Key, KeyboardDelegate, LayoutDelegate, MultipleSelection, Orientation, RefObject, SelectionBehavior } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
import { ReactNode } from 'react';
export interface ListBoxProps<T> extends CollectionBase<T>, MultipleSelection, FocusEvents {
    /** Whether to auto focus the listbox or an option. */
    autoFocus?: boolean | FocusStrategy;
    /** Whether focus should wrap around when the end/start is reached. */
    shouldFocusWrap?: boolean;
}
export interface AriaListBoxPropsBase<T> extends ListBoxProps<T>, DOMProps, AriaLabelingProps {
    /**
     * Whether pressing the escape key should clear selection in the listbox or not.
     *
     * Most experiences should not modify this option as it eliminates a keyboard user's ability to
     * easily clear selection. Only use if the escape key is being handled externally or should not
     * trigger selection clearing contextually.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
}
export interface AriaListBoxProps<T> extends AriaListBoxPropsBase<T> {
    /**
     * An optional visual label for the listbox.
     */
    label?: ReactNode;
    /** How multiple selection should behave in the collection. */
    selectionBehavior?: SelectionBehavior;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** Whether options should be focused when the user hovers over them. */
    shouldFocusOnHover?: boolean;
    /**
     * Handler that is called when a user performs an action on an item. The exact user event depends
     * on the collection's `selectionBehavior` prop and the interaction modality.
     */
    onAction?: (key: Key) => void;
}
export interface ListBoxAria {
    /** Props for the listbox element. */
    listBoxProps: DOMAttributes;
    /** Props for the listbox's visual label element (if any). */
    labelProps: DOMAttributes;
}
export interface AriaListBoxOptions<T> extends Omit<AriaListBoxProps<T>, 'children'> {
    /** Whether the listbox uses virtual scrolling. */
    isVirtualized?: boolean;
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * A delegate object that provides layout information for items in the collection.
     * By default this uses the DOM, but this can be overridden to implement things like
     * virtualized scrolling.
     */
    layoutDelegate?: LayoutDelegate;
    /**
     * Whether the listbox items should use virtual focus instead of being focused directly.
     */
    shouldUseVirtualFocus?: boolean;
    /**
     * The behavior of links in the collection.
     * - 'action': link behaves like onAction.
     * - 'selection': link follows selection interactions (e.g. if URL drives selection).
     * - 'override': links override all other interactions (link items are not selectable).
     *
     * @default 'override'
     */
    linkBehavior?: 'action' | 'selection' | 'override';
    /**
     * The primary orientation of the items. Usually this is the direction that the collection
     * scrolls.
     *
     * @default 'vertical'
     */
    orientation?: Orientation;
}
/**
 * Provides the behavior and accessibility implementation for a listbox component.
 * A listbox displays a list of options and allows a user to select one or more of them.
 *
 * @param props - Props for the listbox.
 * @param state - State for the listbox, as returned by `useListState`.
 */
export declare function useListBox<T>(props: AriaListBoxOptions<T>, state: ListState<T>, ref: RefObject<HTMLElement | null>): ListBoxAria;
