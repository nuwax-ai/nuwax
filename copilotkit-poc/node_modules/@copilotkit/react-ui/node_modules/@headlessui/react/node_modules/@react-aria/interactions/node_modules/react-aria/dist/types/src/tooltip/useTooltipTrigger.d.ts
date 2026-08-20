import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { TooltipTriggerProps, TooltipTriggerState } from 'react-stately/useTooltipTriggerState';
export interface TooltipTriggerAria {
    /**
     * Props for the trigger element.
     */
    triggerProps: DOMAttributes;
    /**
     * Props for the overlay container element.
     */
    tooltipProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a tooltip trigger, e.g. a button
 * that shows a description when focused or hovered.
 */
export declare function useTooltipTrigger(props: TooltipTriggerProps, state: TooltipTriggerState, ref: RefObject<FocusableElement | null>): TooltipTriggerAria;
