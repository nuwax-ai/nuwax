import { RefObject } from '@react-types/shared';
interface SafelyMouseToSubmenuOptions {
    /** Ref for the parent menu. */
    menuRef: RefObject<Element | null>;
    /** Ref for the submenu. */
    submenuRef: RefObject<Element | null>;
    /** Whether the submenu is open. */
    isOpen: boolean;
    /** Whether this feature is disabled. */
    isDisabled?: boolean;
}
/**
 * Allows the user to move their pointer to the submenu without it closing when their mouse leaves
 * the trigger element. Prevents pointer events from going to the underlying menu if the user is
 * moving their pointer towards the sub-menu.
 */
export declare function useSafelyMouseToSubmenu(options: SafelyMouseToSubmenuOptions): void;
export {};
