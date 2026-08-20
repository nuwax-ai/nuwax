import { FocusableElement, RefObject } from '@react-types/shared';
import React, { JSX, ReactNode } from 'react';
import { SelectionMode, SelectState } from 'react-stately/useSelectState';
export interface AriaHiddenSelectProps {
    /**
     * Describes the type of autocomplete functionality the input should provide if any. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete).
     */
    autoComplete?: string;
    /** The text label for the select. */
    label?: ReactNode;
    /** HTML form input name. */
    name?: string;
    /**
     * The `<form>` element to associate the input with.
     * The value of this attribute must be the id of a `<form>` in the same document.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form).
     */
    form?: string;
    /** Sets the disabled state of the select and input. */
    isDisabled?: boolean;
}
export interface HiddenSelectProps<T, M extends SelectionMode = 'single'> extends AriaHiddenSelectProps {
    /** State for the select. */
    state: SelectState<T, M>;
    /** A ref to the trigger element. */
    triggerRef: RefObject<FocusableElement | null>;
}
export interface AriaHiddenSelectOptions extends AriaHiddenSelectProps {
    /** A ref to the hidden `<select>` element. */
    selectRef?: RefObject<HTMLSelectElement | HTMLInputElement | null>;
}
export interface HiddenSelectAria {
    /** Props for the container element. */
    containerProps: React.HTMLAttributes<FocusableElement>;
    /** Props for the hidden input element. */
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    /** Props for the hidden select element. */
    selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
}
/**
 * Provides the behavior and accessibility implementation for a hidden `<select>` element, which
 * can be used in combination with `useSelect` to support browser form autofill, mobile form
 * navigation, and native HTML form submission.
 */
export declare function useHiddenSelect<T, M extends SelectionMode = 'single'>(props: AriaHiddenSelectOptions, state: SelectState<T, M>, triggerRef: RefObject<FocusableElement | null>): HiddenSelectAria;
/**
 * Renders a hidden native `<select>` element, which can be used to support browser
 * form autofill, mobile form navigation, and native form submission.
 */
export declare function HiddenSelect<T, M extends SelectionMode = 'single'>(props: HiddenSelectProps<T, M>): JSX.Element | null;
