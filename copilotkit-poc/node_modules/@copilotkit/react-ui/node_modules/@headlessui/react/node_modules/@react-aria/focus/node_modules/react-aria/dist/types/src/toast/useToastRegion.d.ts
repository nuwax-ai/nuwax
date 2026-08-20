import { AriaLabelingProps, DOMAttributes, RefObject } from '@react-types/shared';
import { ToastState } from 'react-stately/useToastState';
export interface AriaToastRegionProps extends AriaLabelingProps {
    /**
     * An accessibility label for the toast region.
     *
     * @default 'Notifications'
     */
    'aria-label'?: string;
}
export interface ToastRegionAria {
    /** Props for the landmark region element. */
    regionProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a toast region containing one or more
 * toasts. Toasts display brief, temporary notifications of actions, errors, or other events in an
 * application.
 */
export declare function useToastRegion<T>(props: AriaToastRegionProps, state: ToastState<T>, ref: RefObject<HTMLElement | null>): ToastRegionAria;
