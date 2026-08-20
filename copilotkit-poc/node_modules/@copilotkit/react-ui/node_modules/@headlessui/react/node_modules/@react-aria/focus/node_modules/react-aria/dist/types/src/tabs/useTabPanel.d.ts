import { AriaLabelingProps, DOMAttributes, DOMProps, Key, RefObject } from '@react-types/shared';
import { TabListState } from 'react-stately/useTabListState';
export interface AriaTabPanelProps extends Omit<DOMProps, 'id'>, AriaLabelingProps {
    /** The unique id of the tab. */
    id?: Key;
}
export interface TabPanelAria {
    /** Props for the tab panel element. */
    tabPanelProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a tab panel. A tab panel is a
 * container for the contents of a tab, and is shown when the tab is selected.
 */
export declare function useTabPanel<T>(props: AriaTabPanelProps, state: TabListState<T> | null, ref: RefObject<Element | null>): TabPanelAria;
