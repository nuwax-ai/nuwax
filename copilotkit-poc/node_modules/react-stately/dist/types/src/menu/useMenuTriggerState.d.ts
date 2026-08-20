import { FocusStrategy, Key } from '@react-types/shared';
import { OverlayTriggerProps, OverlayTriggerState } from '../overlays/useOverlayTriggerState';
export type MenuTriggerType = 'press' | 'longPress';
export interface MenuTriggerProps extends OverlayTriggerProps {
    /**
     * How the menu is triggered.
     *
     * @default 'press'
     */
    trigger?: MenuTriggerType;
}
export interface MenuTriggerState extends OverlayTriggerState {
    /** Controls which item will be auto focused when the menu opens. */
    readonly focusStrategy: FocusStrategy | null;
    /** Opens the menu. */
    open(focusStrategy?: FocusStrategy | null): void;
    /** Toggles the menu. */
    toggle(focusStrategy?: FocusStrategy | null): void;
}
export interface RootMenuTriggerState extends MenuTriggerState {
    /** Opens a specific submenu tied to a specific menu item at a specific level. */
    openSubmenu: (triggerKey: Key, level: number) => void;
    /** Closes a specific submenu tied to a specific menu item at a specific level. */
    closeSubmenu: (triggerKey: Key, level: number) => void;
    /**
     * An array of open submenu trigger keys within the menu tree.
     * The index of key within array matches the submenu level in the tree.
     */
    expandedKeysStack: Key[];
    /** Closes the menu and all submenus in the menu tree. */
    close: () => void;
}
/**
 * Manages state for a menu trigger. Tracks whether the menu is currently open,
 * and controls which item will receive focus when it opens. Also tracks the open submenus within
 * the menu tree via their trigger keys.
 */
export declare function useMenuTriggerState(props: MenuTriggerProps): RootMenuTriggerState;
