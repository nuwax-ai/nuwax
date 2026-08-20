import { AriaButtonProps } from '../button/useButton';
import { AriaLabelingProps, DOMAttributes, DOMProps, InputDOMProps, KeyboardDelegate, LayoutDelegate, RefObject, ValidationResult } from '@react-types/shared';
import { AriaListBoxOptions } from '../listbox/useListBox';
import { ComboBoxProps, ComboBoxState, SelectionMode } from 'react-stately/useComboBoxState';
import { InputHTMLAttributes } from 'react';
export interface AriaComboBoxProps<T, M extends SelectionMode = 'single'> extends ComboBoxProps<T, M>, DOMProps, InputDOMProps, AriaLabelingProps {
    /** Whether keyboard navigation is circular. */
    shouldFocusWrap?: boolean;
}
export interface AriaComboBoxOptions<T, M extends SelectionMode = 'single'> extends Omit<AriaComboBoxProps<T, M>, 'children'> {
    /** The ref for the input element. */
    inputRef: RefObject<HTMLInputElement | null>;
    /** The ref for the list box popover. */
    popoverRef: RefObject<Element | null>;
    /** The ref for the list box. */
    listBoxRef: RefObject<HTMLElement | null>;
    /** The ref for the optional list box popup trigger button. */
    buttonRef?: RefObject<Element | null>;
    /** An optional keyboard delegate implementation, to override the default. */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * A delegate object that provides layout information for items in the collection.
     * By default this uses the DOM, but this can be overridden to implement things like
     * virtualized scrolling.
     */
    layoutDelegate?: LayoutDelegate;
}
export interface ComboBoxAria<T> extends ValidationResult {
    /** Props for the label element. */
    labelProps: DOMAttributes;
    /** Props for the combo box input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the list box, to be passed to `useListBox`. */
    listBoxProps: AriaListBoxOptions<T>;
    /** Props for the optional trigger button, to be passed to `useButton`. */
    buttonProps: AriaButtonProps;
    /** Props for the element representing the selected value. */
    valueProps: DOMAttributes;
    /** Props for the combo box description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the combo box error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a combo box component. A combo box
 * combines a text input with a listbox, allowing users to filter a list of options to items
 * matching a query.
 *
 * @param props - Props for the combo box.
 * @param state - State for the select, as returned by `useComboBoxState`.
 */
export declare function useComboBox<T, M extends SelectionMode = 'single'>(props: AriaComboBoxOptions<T, M>, state: ComboBoxState<T, M>): ComboBoxAria<T>;
