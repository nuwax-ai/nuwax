import { AriaOverlayProps } from './useOverlay';
import { DOMAttributes, RefObject } from '@react-types/shared';
import { OverlayTriggerState } from 'react-stately/useOverlayTriggerState';
export interface AriaModalOverlayProps extends Pick<AriaOverlayProps, 'shouldCloseOnInteractOutside'> {
    /**
     * Whether to close the modal when the user interacts outside it.
     *
     * @default false
     */
    isDismissable?: boolean;
    /**
     * Whether pressing the escape key to close the modal should be disabled.
     *
     * @default false
     */
    isKeyboardDismissDisabled?: boolean;
}
export interface ModalOverlayAria {
    /** Props for the modal element. */
    modalProps: DOMAttributes;
    /** Props for the underlay element. */
    underlayProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a modal component.
 * A modal is an overlay element which blocks interaction with elements outside it.
 */
export declare function useModalOverlay(props: AriaModalOverlayProps, state: OverlayTriggerState, ref: RefObject<HTMLElement | null>): ModalOverlayAria;
