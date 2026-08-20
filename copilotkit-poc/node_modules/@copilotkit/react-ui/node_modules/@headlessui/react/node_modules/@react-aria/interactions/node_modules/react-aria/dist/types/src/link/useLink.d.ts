import { AriaLabelingProps, DOMAttributes, FocusableElement, FocusableProps, LinkDOMProps, PressEvents, RefObject } from '@react-types/shared';
export interface LinkProps extends PressEvents, FocusableProps {
}
export interface AriaLinkProps extends LinkProps, LinkDOMProps, AriaLabelingProps {
}
export interface AriaLinkOptions extends AriaLinkProps {
    /** Whether the link is disabled. */
    isDisabled?: boolean;
    /**
     * The HTML element used to render the link, e.g. 'a', or 'span'.
     *
     * @default 'a'
     */
    elementType?: string;
}
export interface LinkAria {
    /** Props for the link element. */
    linkProps: DOMAttributes;
    /** Whether the link is currently pressed. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a link component.
 * A link allows a user to navigate to another page or resource within a web page
 * or application.
 */
export declare function useLink(props: AriaLinkOptions, ref: RefObject<FocusableElement | null>): LinkAria;
