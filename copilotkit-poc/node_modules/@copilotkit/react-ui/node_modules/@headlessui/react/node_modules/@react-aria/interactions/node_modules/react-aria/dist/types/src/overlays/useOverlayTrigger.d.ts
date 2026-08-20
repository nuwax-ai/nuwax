import { AriaButtonProps } from '../button/useButton';
import { DOMProps, RefObject } from '@react-types/shared';
import { OverlayTriggerState } from 'react-stately/useOverlayTriggerState';
export interface OverlayTriggerProps {
    /** Type of overlay that is opened by the trigger. */
    type: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
}
export interface OverlayTriggerAria {
    /** Props for the trigger element. */
    triggerProps: AriaButtonProps;
    /** Props for the overlay container element. */
    overlayProps: DOMProps;
}
/**
 * Handles the behavior and accessibility for an overlay trigger, e.g. a button
 * that opens a popover, menu, or other overlay that is positioned relative to the trigger.
 */
export declare function useOverlayTrigger(props: OverlayTriggerProps, state: OverlayTriggerState, ref?: RefObject<Element | null>): OverlayTriggerAria;
