import { AriaLabelingProps, DOMAttributes, FocusableElement, Key, RefObject } from '@react-types/shared';
import { TabListState } from 'react-stately/useTabListState';
export interface AriaTabProps extends AriaLabelingProps {
    /** The key of the tab. */
    key: Key;
    /** Whether the tab should be disabled. */
    isDisabled?: boolean;
    /** Whether the tab selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
}
export interface TabAria {
    /** Props for the tab element. */
    tabProps: DOMAttributes;
    /** Whether the tab is currently selected. */
    isSelected: boolean;
    /** Whether the tab is disabled. */
    isDisabled: boolean;
    /** Whether the tab is currently in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a tab.
 * When selected, the associated tab panel is shown.
 */
export declare function useTab<T>(props: AriaTabProps, state: TabListState<T>, ref: RefObject<FocusableElement | null>): TabAria;
