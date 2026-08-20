import { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, HTMLAttributes, InputHTMLAttributes, JSXElementConstructor, ReactNode, RefObject } from 'react';
import { AriaLabelingProps, DOMAttributes, FocusableDOMProps, FocusableProps, PressEvents } from '@react-types/shared';
export interface ButtonProps extends PressEvents, FocusableProps {
    /** Whether the button is disabled. */
    isDisabled?: boolean;
    /** The content to display in the button. */
    children?: ReactNode;
}
export interface AriaBaseButtonProps extends FocusableDOMProps, AriaLabelingProps {
    /** Indicates whether the element is disabled to users of assistive technology. */
    'aria-disabled'?: boolean | 'true' | 'false';
    /**
     * Indicates whether the element, or another grouping element it controls, is currently expanded
     * or collapsed.
     */
    'aria-expanded'?: boolean | 'true' | 'false';
    /**
     * Indicates the availability and type of interactive popup element, such as menu or dialog, that
     * can be triggered by an element.
     */
    'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'true' | 'false';
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current
     * element.
     */
    'aria-controls'?: string;
    /** Indicates the current "pressed" state of toggle buttons. */
    'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
    /**
     * Indicates whether this element represents the current item within a container or set of related
     * elements.
     */
    'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
    /**
     * The behavior of the button when used in an HTML form.
     *
     * @default 'button'
     */
    type?: 'button' | 'submit' | 'reset';
    /**
     * Whether to prevent focus from moving to the button when pressing it.
     *
     * Caution, this can make the button inaccessible and should only be used when alternative
     * keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's
     * increment/decrement control.
     */
    preventFocusOnPress?: boolean;
    /**
     * The `<form>` element to associate the button with.
     * The value of this attribute must be the id of a `<form>` in the same document.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#form).
     */
    form?: string;
    /**
     * The URL that processes the information submitted by the button.
     * Overrides the action attribute of the button's form owner.
     */
    formAction?: ButtonHTMLAttributes<HTMLButtonElement>['formAction'];
    /** Indicates how to encode the form data that is submitted. */
    formEncType?: string;
    /** Indicates the HTTP method used to submit the form. */
    formMethod?: string;
    /** Indicates that the form is not to be validated when it is submitted. */
    formNoValidate?: boolean;
    /** Overrides the target attribute of the button's form owner. */
    formTarget?: string;
    /** Submitted as a pair with the button's value as part of the form data. */
    name?: string;
    /** The value associated with the button's name when it's submitted with the form data. */
    value?: string;
}
export interface AriaButtonElementTypeProps<T extends ElementType = 'button'> {
    /**
     * The HTML element or React element used to render the button, e.g. 'div', 'a', or `RouterLink`.
     *
     * @default 'button'
     */
    elementType?: T | JSXElementConstructor<any>;
}
export interface LinkButtonProps<T extends ElementType = 'button'> extends AriaButtonElementTypeProps<T> {
    /** A URL to link to if elementType="a". */
    href?: string;
    /** The target window for the link. */
    target?: string;
    /**
     * The relationship between the linked resource and the current page. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel).
     */
    rel?: string;
}
export interface AriaButtonProps<T extends ElementType = 'button'> extends ButtonProps, LinkButtonProps<T>, AriaBaseButtonProps {
}
export interface AriaButtonOptions<E extends ElementType> extends Omit<AriaButtonProps<E>, 'children'> {
}
export interface ButtonAria<T> {
    /** Props for the button element. */
    buttonProps: T;
    /** Whether the button is currently pressed. */
    isPressed: boolean;
}
export declare function useButton(props: AriaButtonOptions<'button'>, ref: RefObject<HTMLButtonElement | null>): ButtonAria<ButtonHTMLAttributes<HTMLButtonElement>>;
export declare function useButton(props: AriaButtonOptions<'a'>, ref: RefObject<HTMLAnchorElement | null>): ButtonAria<AnchorHTMLAttributes<HTMLAnchorElement>>;
export declare function useButton(props: AriaButtonOptions<'div'>, ref: RefObject<HTMLDivElement | null>): ButtonAria<HTMLAttributes<HTMLDivElement>>;
export declare function useButton(props: AriaButtonOptions<'input'>, ref: RefObject<HTMLInputElement | null>): ButtonAria<InputHTMLAttributes<HTMLInputElement>>;
export declare function useButton(props: AriaButtonOptions<'span'>, ref: RefObject<HTMLSpanElement | null>): ButtonAria<HTMLAttributes<HTMLSpanElement>>;
export declare function useButton(props: AriaButtonOptions<ElementType>, ref: RefObject<Element | null>): ButtonAria<DOMAttributes>;
