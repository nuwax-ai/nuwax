import { FocusStrategy, Key } from '@react-types/shared';
import type { OverlayTriggerState } from '../overlays/useOverlayTriggerState';
import { RootMenuTriggerState } from './useMenuTriggerState';
export interface SubmenuTriggerProps {
    /** Key of the trigger item. */
    triggerKey: Key;
}
export interface SubmenuTriggerState extends OverlayTriggerState {
    /** Whether the submenu is currently open. */
    isOpen: boolean;
    /** Controls which item will be auto focused when the submenu opens. */
    focusStrategy: FocusStrategy | null;
    /** Opens the submenu. */
    open: (focusStrategy?: FocusStrategy | null) => void;
    /** Closes the submenu. */
    close: () => void;
    /** Closes all menus and submenus in the menu tree. */
    closeAll: () => void;
    /** The level of the submenu. */
    submenuLevel: number;
    /** Toggles the submenu. */
    toggle: (focusStrategy?: FocusStrategy | null) => void;
    /** @private */
    setOpen: () => void;
}
/**
 * Manages state for a submenu trigger. Tracks whether the submenu is currently open, the level of
 * the submenu, and controls which item will receive focus when it opens.
 */
export declare function useSubmenuTriggerState(props: SubmenuTriggerProps, state: RootMenuTriggerState): SubmenuTriggerState;
