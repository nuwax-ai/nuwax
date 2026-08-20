import { DOMAttributes } from '@react-types/shared';
import { ReactNode } from 'react';
export interface AriaListBoxSectionProps {
    /** The heading for the section. */
    heading?: ReactNode;
    /** An accessibility label for the section. Required if `heading` is not present. */
    'aria-label'?: string;
}
export interface ListBoxSectionAria {
    /** Props for the wrapper list item. */
    itemProps: DOMAttributes;
    /** Props for the heading element, if any. */
    headingProps: DOMAttributes;
    /** Props for the group element. */
    groupProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a section in a listbox.
 * See `useListBox` for more details about listboxes.
 *
 * @param props - Props for the section.
 */
export declare function useListBoxSection(props: AriaListBoxSectionProps): ListBoxSectionAria;
