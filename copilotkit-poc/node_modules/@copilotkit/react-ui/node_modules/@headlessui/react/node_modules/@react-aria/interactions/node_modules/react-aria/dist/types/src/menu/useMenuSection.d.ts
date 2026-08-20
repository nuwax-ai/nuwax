import { DOMAttributes } from '@react-types/shared';
import { ReactNode } from 'react';
export interface AriaMenuSectionProps {
    /** The heading for the section. */
    heading?: ReactNode;
    /** An accessibility label for the section. Required if `heading` is not present. */
    'aria-label'?: string;
}
export interface MenuSectionAria {
    /** Props for the wrapper list item. */
    itemProps: DOMAttributes;
    /** Props for the heading element, if any. */
    headingProps: DOMAttributes;
    /** Props for the group element. */
    groupProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a section in a menu.
 * See `useMenu` for more details about menus.
 *
 * @param props - Props for the section.
 */
export declare function useMenuSection(props: AriaMenuSectionProps): MenuSectionAria;
