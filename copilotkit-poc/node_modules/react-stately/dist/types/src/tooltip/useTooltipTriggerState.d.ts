import { OverlayTriggerProps } from '../overlays/useOverlayTriggerState';
export interface TooltipTriggerProps extends OverlayTriggerProps {
    /**
     * Whether the tooltip should be disabled, independent from the trigger.
     */
    isDisabled?: boolean;
    /**
     * The delay time for the tooltip to show up. [See
     * guidelines](https://spectrum.adobe.com/page/tooltip/#Immediate-or-delayed-appearance).
     *
     * @default 1500
     */
    delay?: number;
    /**
     * The delay time for the tooltip to close. [See
     * guidelines](https://spectrum.adobe.com/page/tooltip/#Warmup-and-cooldown).
     *
     * @default 500
     */
    closeDelay?: number;
    /**
     * By default, opens for both focus and hover. Can be made to open only for focus.
     *
     * @default 'hover'
     */
    trigger?: 'hover' | 'focus';
    /**
     * Whether the tooltip should close when the trigger is pressed.
     *
     * @default true
     */
    shouldCloseOnPress?: boolean;
}
export interface TooltipTriggerState {
    /** Whether the tooltip is currently showing. */
    isOpen: boolean;
    /**
     * Shows the tooltip. By default, the tooltip becomes visible after a delay
     * depending on a global warmup timer. The `immediate` option shows the
     * tooltip immediately instead.
     */
    open(immediate?: boolean): void;
    /** Hides the tooltip. */
    close(immediate?: boolean): void;
}
/**
 * Manages state for a tooltip trigger. Tracks whether the tooltip is open, and provides
 * methods to toggle this state. Ensures only one tooltip is open at a time and controls
 * the delay for showing a tooltip.
 */
export declare function useTooltipTriggerState(props?: TooltipTriggerProps): TooltipTriggerState;
