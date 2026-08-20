import { AriaLabelingProps, DOMAttributes, DOMProps, Orientation, RefObject } from '@react-types/shared';
import { TabListProps, TabListState } from 'react-stately/useTabListState';
export interface AriaTabListProps<T> extends TabListProps<T>, DOMProps, AriaLabelingProps {
    /**
     * Whether tabs are activated automatically on focus or manually.
     *
     * @default 'automatic'
     */
    keyboardActivation?: 'automatic' | 'manual';
    /**
     * The orientation of the tabs.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
}
export interface AriaTabListOptions<T> extends Omit<AriaTabListProps<T>, 'children'> {
}
export interface TabListAria {
    /** Props for the tablist container. */
    tabListProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a tab list.
 * Tabs organize content into multiple sections and allow users to navigate between them.
 */
export declare function useTabList<T>(props: AriaTabListOptions<T>, state: TabListState<T>, ref: RefObject<HTMLElement | null>): TabListAria;
