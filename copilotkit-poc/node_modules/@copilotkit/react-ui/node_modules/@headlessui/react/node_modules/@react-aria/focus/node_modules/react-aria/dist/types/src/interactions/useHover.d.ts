import { DOMAttributes, HoverEvents } from '@react-types/shared';
export interface HoverProps extends HoverEvents {
    /** Whether the hover events should be disabled. */
    isDisabled?: boolean;
}
export interface HoverResult {
    /** Props to spread on the target element. */
    hoverProps: DOMAttributes;
    isHovered: boolean;
}
/**
 * Handles pointer hover interactions for an element. Normalizes behavior
 * across browsers and platforms, and ignores emulated mouse events on touch devices.
 */
export declare function useHover(props: HoverProps): HoverResult;
