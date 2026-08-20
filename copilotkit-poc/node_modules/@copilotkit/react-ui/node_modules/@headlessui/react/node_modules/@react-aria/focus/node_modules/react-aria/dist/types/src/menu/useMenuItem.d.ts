import { DOMAttributes, DOMProps, FocusableElement, FocusEvents, HoverEvents, Key, KeyboardEvents, PressEvents, RefObject } from '@react-types/shared';
import { SelectionManager } from 'react-stately/private/selection/SelectionManager';
import { TreeState } from 'react-stately/useTreeState';
export interface MenuItemAria {
    /** Props for the menu item element. */
    menuItemProps: DOMAttributes;
    /** Props for the main text element inside the menu item. */
    labelProps: DOMAttributes;
    /** Props for the description text element inside the menu item, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the keyboard shortcut text element inside the item, if any. */
    keyboardShortcutProps: DOMAttributes;
    /** Whether the item is currently focused. */
    isFocused: boolean;
    /** Whether the item is keyboard focused. */
    isFocusVisible: boolean;
    /** Whether the item is currently selected. */
    isSelected: boolean;
    /** Whether the item is currently in a pressed state. */
    isPressed: boolean;
    /** Whether the item is disabled. */
    isDisabled: boolean;
}
export interface AriaMenuItemProps extends DOMProps, PressEvents, HoverEvents, KeyboardEvents, FocusEvents {
    /**
     * Whether the menu item is disabled.
     *
     * @deprecated - pass disabledKeys to useTreeState instead.
     */
    isDisabled?: boolean;
    /**
     * Whether the menu item is selected.
     *
     * @deprecated - pass selectedKeys to useTreeState instead.
     */
    isSelected?: boolean;
    /** A screen reader only label for the menu item. */
    'aria-label'?: string;
    /** The unique key for the menu item. */
    key: Key;
    /**
     * Handler that is called when the menu should close after selecting an item.
     *
     * @deprecated - pass to the menu instead.
     */
    onClose?: () => void;
    /**
     * Whether the menu should close when the menu item is selected.
     *
     * @deprecated - use shouldCloseOnSelect instead.
     */
    closeOnSelect?: boolean;
    /** Whether the menu should close when the menu item is selected. */
    shouldCloseOnSelect?: boolean;
    /** Whether the menu item is contained in a virtual scrolling menu. */
    isVirtualized?: boolean;
    /**
     * Handler that is called when the user activates the item.
     *
     * @deprecated - pass to the menu instead.
     */
    onAction?: (key: Key) => void;
    /** What kind of popup the item opens. */
    'aria-haspopup'?: 'menu' | 'dialog';
    /** Indicates whether the menu item's popup element is expanded or collapsed. */
    'aria-expanded'?: boolean | 'true' | 'false';
    /**
     * Identifies the menu item's popup element whose contents or presence is controlled by the menu
     * item.
     */
    'aria-controls'?: string;
    /** Identifies the element(s) that describe the menu item. */
    'aria-describedby'?: string;
    /** Override of the selection manager. By default, `state.selectionManager` is used. */
    selectionManager?: SelectionManager;
}
/**
 * Provides the behavior and accessibility implementation for an item in a menu.
 * See `useMenu` for more details about menus.
 *
 * @param props - Props for the item.
 * @param state - State for the menu, as returned by `useTreeState`.
 */
export declare function useMenuItem<T>(props: AriaMenuItemProps, state: TreeState<T>, ref: RefObject<FocusableElement | null>): MenuItemAria;
