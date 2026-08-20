import { DOMAttributes, FocusableElement, Key, RefObject } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
import { SelectableItemStates } from '../selection/useSelectableItem';
export interface OptionAria extends SelectableItemStates {
    /** Props for the option element. */
    optionProps: DOMAttributes;
    /** Props for the main text element inside the option. */
    labelProps: DOMAttributes;
    /** Props for the description text element inside the option, if any. */
    descriptionProps: DOMAttributes;
    /** Whether the option is currently focused. */
    isFocused: boolean;
    /** Whether the option is keyboard focused. */
    isFocusVisible: boolean;
}
export interface AriaOptionProps {
    /**
     * Whether the option is disabled.
     *
     * @deprecated
     */
    isDisabled?: boolean;
    /**
     * Whether the option is selected.
     *
     * @deprecated
     */
    isSelected?: boolean;
    /** A screen reader only label for the option. */
    'aria-label'?: string;
    /** The unique key for the option. */
    key: Key;
    /**
     * Whether selection should occur on press up instead of press down.
     *
     * @deprecated
     */
    shouldSelectOnPressUp?: boolean;
    /**
     * Whether the option should be focused when the user hovers over it.
     *
     * @deprecated
     */
    shouldFocusOnHover?: boolean;
    /**
     * Whether the option is contained in a virtual scrolling listbox.
     *
     * @deprecated
     */
    isVirtualized?: boolean;
    /**
     * Whether the option should use virtual focus instead of being focused directly.
     *
     * @deprecated
     */
    shouldUseVirtualFocus?: boolean;
}
/**
 * Provides the behavior and accessibility implementation for an option in a listbox.
 * See `useListBox` for more details about listboxes.
 *
 * @param props - Props for the option.
 * @param state - State for the listbox, as returned by `useListState`.
 */
export declare function useOption<T>(props: AriaOptionProps, state: ListState<T>, ref: RefObject<FocusableElement | null>): OptionAria;
