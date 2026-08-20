import { AriaLabelingProps, AriaValidationProps, DOMAttributes, FocusableDOMProps, FocusableProps, HelpTextProps, InputBase, LabelableProps, TextInputBase, TextInputDOMProps, Validation, ValidationResult, ValueBase } from '@react-types/shared';
import { HTMLAttributes, type JSX, LabelHTMLAttributes, RefObject } from 'react';
/**
 * A map of HTML element names and their interface types.
 * For example `'a'` -> `HTMLAnchorElement`.
 */
type IntrinsicHTMLElements = {
    [K in keyof IntrinsicHTMLAttributes]: IntrinsicHTMLAttributes[K] extends HTMLAttributes<infer T> ? T : never;
};
/**
 * A map of HTML element names and their attribute interface types.
 * For example `'a'` -> `AnchorHTMLAttributes<HTMLAnchorElement>`.
 */
type IntrinsicHTMLAttributes = JSX.IntrinsicElements;
type DefaultElementType = 'input';
/**
 * The intrinsic HTML element names that `useTextField` supports; e.g. `input`,
 * `textarea`.
 */
type TextFieldIntrinsicElements = keyof Pick<IntrinsicHTMLElements, 'input' | 'textarea'>;
/**
 * The HTML element interfaces that `useTextField` supports based on what is
 * defined for `TextFieldIntrinsicElements`; e.g. `HTMLInputElement`,
 * `HTMLTextAreaElement`.
 */
type TextFieldHTMLElementType = Pick<IntrinsicHTMLElements, TextFieldIntrinsicElements>;
/**
 * The HTML attributes interfaces that `useTextField` supports based on what
 * is defined for `TextFieldIntrinsicElements`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldHTMLAttributesType = Pick<IntrinsicHTMLAttributes, TextFieldIntrinsicElements>;
/**
 * The type of `inputProps` returned by `useTextField`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldInputProps<T extends TextFieldIntrinsicElements> = TextFieldHTMLAttributesType[T];
export interface TextFieldProps<T = HTMLInputElement> extends InputBase, Validation<string>, HelpTextProps, FocusableProps<T>, TextInputBase, ValueBase<string>, LabelableProps {
}
export interface AriaTextFieldProps<T = HTMLInputElement> extends TextFieldProps<T>, AriaLabelingProps, FocusableDOMProps, TextInputDOMProps<T>, AriaValidationProps {
    /**
     * Identifies the currently active element when DOM focus is on a composite widget, textbox,
     * group, or application.
     */
    'aria-activedescendant'?: string;
    /**
     * Indicates whether inputting text could trigger display of one or more predictions of the user's
     * intended value for an input and specifies how predictions would be presented if they are made.
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    /**
     * Indicates the availability and type of interactive popup element, such as menu or dialog, that
     * can be triggered by an element.
     */
    'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current
     * element.
     */
    'aria-controls'?: string;
    /**
     * An enumerated attribute that defines what action label or icon to preset for the enter key on
     * virtual keyboards. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint).
     */
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}
export interface AriaTextFieldOptions<T extends TextFieldIntrinsicElements> extends AriaTextFieldProps<TextFieldHTMLElementType[T]> {
    /**
     * The HTML element used to render the input, e.g. 'input', or 'textarea'. It determines whether
     * certain HTML attributes will be included in `inputProps`. For example,
     * [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-type).
     *
     * @default 'input'
     */
    inputElementType?: T;
    /**
     * Controls whether inputted text is automatically capitalized and, if so, in what manner.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize).
     */
    autoCapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
    /**
     * An enumerated attribute that defines what action label or icon to preset for the enter key on
     * virtual keyboards. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint).
     */
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}
/**
 * The type of `ref` object that can be passed to `useTextField` based on the given
 * intrinsic HTML element name; e.g.`RefObject<HTMLInputElement>`,
 * `RefObject<HTMLTextAreaElement>`.
 */
type TextFieldRefObject<T extends TextFieldIntrinsicElements> = RefObject<TextFieldHTMLElementType[T] | null>;
export interface TextFieldAria<T extends TextFieldIntrinsicElements = DefaultElementType> extends ValidationResult {
    /** Props for the input element. */
    inputProps: TextFieldInputProps<T>;
    /** Props for the text field's visible label element, if any. */
    labelProps: DOMAttributes | LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the text field's description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the text field's error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a text field.
 *
 * @param props - Props for the text field.
 * @param ref - Ref to the HTML input or textarea element.
 */
export declare function useTextField<T extends TextFieldIntrinsicElements = DefaultElementType>(props: AriaTextFieldOptions<T>, ref: TextFieldRefObject<T>): TextFieldAria<T>;
export {};
