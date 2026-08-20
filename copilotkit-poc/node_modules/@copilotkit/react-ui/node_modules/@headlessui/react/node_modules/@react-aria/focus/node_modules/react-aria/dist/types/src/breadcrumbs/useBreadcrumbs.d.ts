import { AriaLabelingProps, DOMAttributes, DOMProps } from '@react-types/shared';
export interface AriaBreadcrumbsProps extends DOMProps, AriaLabelingProps {
}
export interface BreadcrumbsAria {
    /** Props for the breadcrumbs navigation element. */
    navProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a breadcrumbs component.
 * Breadcrumbs display a hierarchy of links to the current page or resource in an application.
 */
export declare function useBreadcrumbs(props: AriaBreadcrumbsProps): BreadcrumbsAria;
