import { AriaButtonProps } from '../button/useButton';
import { AriaTextFieldProps } from '../textfield/useTextField';
import { DOMAttributes, RefObject, ValidationResult } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { SearchFieldProps, SearchFieldState } from 'react-stately/useSearchFieldState';
export interface AriaSearchFieldProps extends SearchFieldProps, Omit<AriaTextFieldProps, 'type'> {
    /**
     * An enumerated attribute that defines what action label or icon to preset for the enter key on
     * virtual keyboards. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint).
     */
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
    /**
     * The type of input to render. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdeftype).
     *
     * @default 'search'
     */
    type?: 'text' | 'search' | 'url' | 'tel' | 'email' | 'password' | (string & {});
}
export interface SearchFieldAria extends ValidationResult {
    /** Props for the text field's visible label element (if any). */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the clear button. */
    clearButtonProps: AriaButtonProps;
    /** Props for the searchfield's description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the searchfield's error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a search field.
 *
 * @param props - Props for the search field.
 * @param state - State for the search field, as returned by `useSearchFieldState`.
 * @param inputRef - A ref to the input element.
 */
export declare function useSearchField(props: AriaSearchFieldProps, state: SearchFieldState, inputRef: RefObject<HTMLInputElement | null>): SearchFieldAria;
