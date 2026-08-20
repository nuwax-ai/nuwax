import { AriaButtonProps } from '../button/useButton';
import { AriaLabelingProps, DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { QueuedToast, ToastState } from 'react-stately/useToastState';
export interface AriaToastProps<T> extends AriaLabelingProps {
    /** The toast object. */
    toast: QueuedToast<T>;
}
export interface ToastAria {
    /** Props for the toast container, non-modal dialog element. */
    toastProps: DOMAttributes;
    /** Props for the toast content alert message. */
    contentProps: DOMAttributes;
    /** Props for the toast title element. */
    titleProps: DOMAttributes;
    /** Props for the toast description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the toast close button. */
    closeButtonProps: AriaButtonProps;
}
/**
 * Provides the behavior and accessibility implementation for a toast component. Toasts display
 * brief, temporary notifications of actions, errors, or other events in an application.
 */
export declare function useToast<T>(props: AriaToastProps<T>, state: ToastState<T>, ref: RefObject<FocusableElement | null>): ToastAria;
