import { AriaButtonProps } from '../button/useButton';
import { AriaLabelingProps, DOMAttributes, DOMProps, FocusableDOMProps, KeyboardDelegate, RefObject, ValidationResult } from '@react-types/shared';
import { AriaListBoxOptions } from '../listbox/useListBox';
import { HiddenSelectProps } from './HiddenSelect';
import { SelectionMode, SelectProps, SelectState } from 'react-stately/useSelectState';
export interface AriaSelectProps<T, M extends SelectionMode = 'single'> extends SelectProps<T, M>, DOMProps, AriaLabelingProps, FocusableDOMProps {
    /**
     * Describes the type of autocomplete functionality the input should provide if any. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete).
     */
    autoComplete?: string;
    /**
     * The name of the input, used when submitting an HTML form.
     */
    name?: string;
    /**
     * The `<form>` element to associate the input with.
     * The value of this attribute must be the id of a `<form>` in the same document.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form).
     */
    form?: string;
}
export interface AriaSelectOptions<T, M extends SelectionMode = 'single'> extends Omit<AriaSelectProps<T, M>, 'children'> {
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
}
export interface SelectAria<T, M extends SelectionMode = 'single'> extends ValidationResult {
    /** Props for the label element. */
    labelProps: DOMAttributes;
    /** Props for the popup trigger element. */
    triggerProps: AriaButtonProps;
    /** Props for the element representing the selected value. */
    valueProps: DOMAttributes;
    /** Props for the popup. */
    menuProps: AriaListBoxOptions<T>;
    /** Props for the select's description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the select's error message element, if any. */
    errorMessageProps: DOMAttributes;
    /** Props for the hidden select element. */
    hiddenSelectProps: HiddenSelectProps<T, M>;
}
interface SelectData {
    isDisabled?: boolean;
    isRequired?: boolean;
    name?: string;
    form?: string;
    validationBehavior?: 'aria' | 'native';
}
export declare const selectData: WeakMap<SelectState<any, any>, SelectData>;
/**
 * Provides the behavior and accessibility implementation for a select component.
 * A select displays a collapsible list of options and allows a user to select one of them.
 *
 * @param props - Props for the select.
 * @param state - State for the select, as returned by `useListState`.
 */
export declare function useSelect<T, M extends SelectionMode = 'single'>(props: AriaSelectOptions<T, M>, state: SelectState<T, M>, ref: RefObject<HTMLElement | null>): SelectAria<T, M>;
export {};
