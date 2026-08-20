import { DOMAttributes } from '@react-types/shared';
import { JSX, JSXElementConstructor, ReactNode } from 'react';
export interface VisuallyHiddenProps extends DOMAttributes {
    /** The content to visually hide. */
    children?: ReactNode;
    /**
     * The element type for the container.
     *
     * @default 'div'
     */
    elementType?: string | JSXElementConstructor<any>;
    /** Whether the element should become visible on focus, for example skip links. */
    isFocusable?: boolean;
}
export interface VisuallyHiddenAria {
    visuallyHiddenProps: DOMAttributes;
}
/**
 * Provides props for an element that hides its children visually
 * but keeps content visible to assistive technology.
 */
export declare function useVisuallyHidden(props?: VisuallyHiddenProps): VisuallyHiddenAria;
/**
 * VisuallyHidden hides its children visually, while keeping content visible
 * to screen readers.
 */
export declare function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element;
