import { AriaLinkProps } from '../link/useLink';
import { DOMAttributes, DOMProps, FocusableElement, LinkDOMProps, RefObject } from '@react-types/shared';
import { ReactNode } from 'react';
export interface BreadcrumbItemProps extends AriaLinkProps, LinkDOMProps {
    /** Whether the breadcrumb item represents the current page. */
    isCurrent?: boolean;
    /**
     * The type of current location the breadcrumb item represents, if `isCurrent` is true.
     *
     * @default 'page'
     */
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean | 'true' | 'false';
    /** Whether the breadcrumb item is disabled. */
    isDisabled?: boolean;
    /** The contents of the breadcrumb item. */
    children: ReactNode;
}
export interface AriaBreadcrumbItemProps extends BreadcrumbItemProps, DOMProps {
    /**
     * The HTML element used to render the breadcrumb link, e.g. 'a', or 'span'.
     *
     * @default 'a'
     */
    elementType?: string;
}
export interface BreadcrumbItemAria {
    /** Props for the breadcrumb item link element. */
    itemProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for an in a breadcrumbs component.
 * See `useBreadcrumbs` for details about breadcrumbs.
 */
export declare function useBreadcrumbItem(props: AriaBreadcrumbItemProps, ref: RefObject<FocusableElement | null>): BreadcrumbItemAria;
