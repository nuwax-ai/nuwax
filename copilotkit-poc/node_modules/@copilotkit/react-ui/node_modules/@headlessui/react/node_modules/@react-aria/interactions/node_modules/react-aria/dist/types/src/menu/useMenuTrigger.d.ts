import { AriaButtonProps } from '../button/useButton';
import { AriaMenuOptions } from './useMenu';
import { RefObject } from '@react-types/shared';
import { MenuTriggerState, MenuTriggerType } from 'react-stately/useMenuTriggerState';
export interface AriaMenuTriggerProps {
    /** The type of menu that the menu trigger opens. */
    type?: 'menu' | 'listbox';
    /** Whether menu trigger is disabled. */
    isDisabled?: boolean;
    /** How menu is triggered. */
    trigger?: MenuTriggerType;
}
export interface MenuTriggerAria<T> {
    /** Props for the menu trigger element. */
    menuTriggerProps: AriaButtonProps;
    /** Props for the menu. */
    menuProps: AriaMenuOptions<T>;
}
/**
 * Provides the behavior and accessibility implementation for a menu trigger.
 *
 * @param props - Props for the menu trigger.
 * @param state - State for the menu trigger.
 * @param ref - Ref to the HTML element trigger for the menu.
 */
export declare function useMenuTrigger<T>(props: AriaMenuTriggerProps, state: MenuTriggerState, ref: RefObject<Element | null>): MenuTriggerAria<T>;
