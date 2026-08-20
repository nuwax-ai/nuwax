import { AriaMenuItemProps } from './useMenuItem';
import { AriaMenuOptions } from './useMenu';
import type { AriaPopoverProps } from '../overlays/usePopover';
import { FocusableElement, Node, RefObject } from '@react-types/shared';
import type { OverlayProps } from '../overlays/Overlay';
import type { SubmenuTriggerState } from 'react-stately/useMenuTriggerState';
export interface AriaSubmenuTriggerProps {
    /**
     * An object representing the submenu trigger menu item. Contains all the relevant information
     * that makes up the menu item.
     *
     * @deprecated
     */
    node?: Node<unknown>;
    /** Whether the submenu trigger is disabled. */
    isDisabled?: boolean;
    /** The type of the contents that the submenu trigger opens. */
    type?: 'dialog' | 'menu';
    /** Ref of the menu that contains the submenu trigger. */
    parentMenuRef: RefObject<HTMLElement | null>;
    /** Ref of the submenu opened by the submenu trigger. */
    submenuRef: RefObject<HTMLElement | null>;
    /**
     * The delay time in milliseconds for the submenu to appear after hovering over the trigger.
     *
     * @default 200
     */
    delay?: number;
    /** Whether the submenu trigger uses virtual focus. */
    shouldUseVirtualFocus?: boolean;
}
interface SubmenuTriggerProps extends Omit<AriaMenuItemProps, 'key' | 'onAction'> {
    /** Whether the submenu trigger is in an expanded state. */
    isOpen: boolean;
}
interface SubmenuProps<T> extends AriaMenuOptions<T> {
    /** The level of the submenu. */
    submenuLevel: number;
}
export interface SubmenuTriggerAria<T> {
    /** Props for the submenu trigger menu item. */
    submenuTriggerProps: SubmenuTriggerProps;
    /** Props for the submenu controlled by the submenu trigger menu item. */
    submenuProps: SubmenuProps<T>;
    /** Props for the submenu's popover container. */
    popoverProps: Pick<AriaPopoverProps, 'isNonModal' | 'shouldCloseOnInteractOutside'> & Pick<OverlayProps, 'disableFocusManagement'>;
}
/**
 * Provides the behavior and accessibility implementation for a submenu trigger and its associated
 * submenu.
 *
 * @param props - Props for the submenu trigger and refs attach to its submenu and parent menu.
 * @param state - State for the submenu trigger.
 * @param ref - Ref to the submenu trigger element.
 */
export declare function useSubmenuTrigger<T>(props: AriaSubmenuTriggerProps, state: SubmenuTriggerState, ref: RefObject<FocusableElement | null>): SubmenuTriggerAria<T>;
export {};
