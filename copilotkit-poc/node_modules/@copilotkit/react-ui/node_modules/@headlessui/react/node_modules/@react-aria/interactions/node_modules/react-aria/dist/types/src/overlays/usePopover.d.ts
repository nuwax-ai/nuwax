import { AriaPositionProps, PlacementAxis } from './useOverlayPosition';
import { DOMAttributes, RefObject } from '@react-types/shared';
import { OverlayTriggerState } from 'react-stately/useOverlayTriggerState';
export interface AriaPopoverProps extends Omit<AriaPositionProps, 'isOpen' | 'onClose' | 'targetRef' | 'overlayRef'> {
    /**
     * The ref for the element which the popover positions itself with respect to.
     */
    triggerRef: RefObject<Element | null>;
    /**
     * The ref for the popover element.
     */
    popoverRef: RefObject<Element | null>;
    /** A ref for the popover arrow element. */
    arrowRef?: RefObject<Element | null>;
    /**
     * An optional ref for a group of popovers, e.g. submenus.
     * When provided, this element is used to detect outside interactions
     * and hiding elements from assistive technologies instead of the popoverRef.
     */
    groupRef?: RefObject<Element | null>;
    /**
     * Whether the popover is non-modal, i.e. elements outside the popover may be
     * interacted with by assistive technologies.
     *
     * Most popovers should not use this option as it may negatively impact the screen
     * reader experience. Only use with components such as combobox, which are designed
     * to handle this situation carefully.
     */
    isNonModal?: boolean;
    /**
     * Whether pressing the escape key to close the popover should be disabled.
     *
     * Most popovers should not use this option. When set to true, an alternative
     * way to close the popover with a keyboard must be provided.
     *
     * @default false
     */
    isKeyboardDismissDisabled?: boolean;
    /**
     * When user interacts with the argument element outside of the popover ref,
     * return true if onClose should be called. This gives you a chance to filter
     * out interaction with elements that should not dismiss the popover.
     * By default, onClose will always be called on interaction outside the popover ref.
     */
    shouldCloseOnInteractOutside?: (element: Element) => boolean;
}
export interface PopoverAria {
    /** Props for the popover element. */
    popoverProps: DOMAttributes;
    /** Props for the popover tip arrow if any. */
    arrowProps: DOMAttributes;
    /** Props to apply to the underlay element, if any. */
    underlayProps: DOMAttributes;
    /** Placement of the popover with respect to the trigger. */
    placement: PlacementAxis | null;
    /** The origin of the target in the overlay's coordinate system. Useful for animations. */
    triggerAnchorPoint: {
        x: number;
        y: number;
    } | null;
}
/**
 * Provides the behavior and accessibility implementation for a popover component.
 * A popover is an overlay element positioned relative to a trigger.
 */
export declare function usePopover(props: AriaPopoverProps, state: OverlayTriggerState): PopoverAria;
