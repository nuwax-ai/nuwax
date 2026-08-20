import { AriaLabelingProps, CollectionBase, DisabledBehavior, DOMAttributes, DOMProps, FocusStrategy, Key, KeyboardDelegate, LayoutDelegate, MultipleSelection, RefObject } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
export interface GridListProps<T> extends CollectionBase<T>, MultipleSelection {
    /** Whether to auto focus the gridlist or an option. */
    autoFocus?: boolean | FocusStrategy;
    /**
     * Handler that is called when a user performs an action on an item. The exact user event depends
     * on the collection's `selectionBehavior` prop and the interaction modality.
     */
    onAction?: (key: Key) => void;
    /**
     * Whether `disabledKeys` applies to all interactions, or only selection.
     *
     * @default 'all'
     */
    disabledBehavior?: DisabledBehavior;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
}
export interface AriaGridListProps<T> extends GridListProps<T>, DOMProps, AriaLabelingProps {
    /**
     * Whether keyboard navigation to focusable elements within grid list items is
     * via the left/right arrow keys or the tab key.
     *
     * @default 'arrow'
     */
    keyboardNavigationBehavior?: 'arrow' | 'tab';
    /**
     * Whether pressing the escape key should clear selection in the grid list or not.
     *
     * Most experiences should not modify this option as it eliminates a keyboard user's ability to
     * easily clear selection. Only use if the escape key is being handled externally or should not
     * trigger selection clearing contextually.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
}
export interface AriaGridListOptions<T> extends Omit<AriaGridListProps<T>, 'children'> {
    /** Whether the list uses virtual scrolling. */
    isVirtualized?: boolean;
    /**
     * Whether typeahead navigation is disabled.
     *
     * @default false
     */
    disallowTypeAhead?: boolean;
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
     * Whether focus should wrap around when the end/start is reached.
     *
     * @default false
     */
    shouldFocusWrap?: boolean;
    /**
     * The behavior of links in the collection.
     * - 'action': link behaves like onAction.
     * - 'selection': link follows selection interactions (e.g. if URL drives selection).
     * - 'override': links override all other interactions (link items are not selectable).
     *
     * @default 'action'
     */
    linkBehavior?: 'action' | 'selection' | 'override';
}
export interface GridListAria {
    /** Props for the grid element. */
    gridProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a list component with interactive
 * children. A grid list displays data in a single column and enables a user to navigate its
 * contents via directional navigation keys.
 *
 * @param props - Props for the list.
 * @param state - State for the list, as returned by `useListState`.
 * @param ref - The ref attached to the list element.
 */
export declare function useGridList<T>(props: AriaGridListOptions<T>, state: ListState<T>, ref: RefObject<HTMLElement | null>): GridListAria;
