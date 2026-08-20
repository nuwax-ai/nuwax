import { DOMAttributes, RefObject } from '@react-types/shared';
import type { ListState } from 'react-stately/useListState';
export interface AriaGridListSectionProps {
    /** An accessibility label for the section. Required if `heading` is not present. */
    'aria-label'?: string;
}
export interface GridListSectionAria {
    /** Props for the wrapper list item. */
    rowProps: DOMAttributes;
    /** Props for the heading element, if any. */
    rowHeaderProps: DOMAttributes;
    /** Props for the grid's row group element. */
    rowGroupProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a section in a grid list.
 * See `useGridList` for more details about grid list.
 *
 * @param props - Props for the section.
 */
export declare function useGridListSection<T>(props: AriaGridListSectionProps, state: ListState<T>, ref: RefObject<HTMLElement | null>): GridListSectionAria;
