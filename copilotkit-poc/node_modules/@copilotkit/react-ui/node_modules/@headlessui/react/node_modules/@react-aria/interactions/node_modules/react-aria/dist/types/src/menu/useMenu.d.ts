import { AriaLabelingProps, CollectionBase, DOMAttributes, DOMProps, FocusStrategy, Key, KeyboardDelegate, KeyboardEvents, MultipleSelection, RefObject } from '@react-types/shared';
import { TreeState } from 'react-stately/useTreeState';
export interface MenuProps<T> extends CollectionBase<T>, MultipleSelection {
    /** Where the focus should be set. */
    autoFocus?: boolean | FocusStrategy;
    /** Whether keyboard navigation is circular. */
    shouldFocusWrap?: boolean;
    /** Handler that is called when an item is selected. */
    onAction?: (key: Key) => void;
    /** Handler that is called when the menu should close after selecting an item. */
    onClose?: () => void;
}
export interface AriaMenuProps<T> extends MenuProps<T>, DOMProps, AriaLabelingProps {
    /**
     * Whether pressing the escape key should clear selection in the menu or not.
     *
     * Most experiences should not modify this option as it eliminates a keyboard user's ability to
     * easily clear selection. Only use if the escape key is being handled externally or should not
     * trigger selection clearing contextually.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
}
export interface MenuAria {
    /** Props for the menu element. */
    menuProps: DOMAttributes;
}
export interface AriaMenuOptions<T> extends Omit<AriaMenuProps<T>, 'children'>, KeyboardEvents {
    /** Whether the menu uses virtual scrolling. */
    isVirtualized?: boolean;
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * Whether the menu items should use virtual focus instead of being focused directly.
     */
    shouldUseVirtualFocus?: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a menu component.
 * A menu displays a list of actions or options that a user can choose.
 *
 * @param props - Props for the menu.
 * @param state - State for the menu, as returned by `useListState`.
 */
export declare function useMenu<T>(props: AriaMenuOptions<T>, state: TreeState<T>, ref: RefObject<HTMLElement | null>): MenuAria;
