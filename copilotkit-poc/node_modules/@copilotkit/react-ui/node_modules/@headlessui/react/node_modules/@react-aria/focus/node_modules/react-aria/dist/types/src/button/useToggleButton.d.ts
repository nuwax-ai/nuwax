import { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, HTMLAttributes, InputHTMLAttributes, RefObject } from 'react';
import { AriaBaseButtonProps, AriaButtonElementTypeProps, ButtonAria, ButtonProps } from './useButton';
import { DOMAttributes } from '@react-types/shared';
import { ToggleState } from 'react-stately/useToggleState';
export interface ToggleButtonProps extends ButtonProps {
    /** Whether the element should be selected (controlled). */
    isSelected?: boolean;
    /** Whether the element should be selected (uncontrolled). */
    defaultSelected?: boolean;
    /** Handler that is called when the element's selection state changes. */
    onChange?: (isSelected: boolean) => void;
}
export interface AriaToggleButtonProps<T extends ElementType = 'button'> extends ToggleButtonProps, Omit<AriaBaseButtonProps, 'aria-current' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget' | 'name' | 'value' | 'type'>, AriaButtonElementTypeProps<T> {
}
export interface AriaToggleButtonOptions<E extends ElementType> extends Omit<AriaToggleButtonProps<E>, 'children'> {
}
export interface ToggleButtonAria<T> extends ButtonAria<T> {
    /** Whether the button is selected. */
    isSelected: boolean;
    /** Whether the button is disabled. */
    isDisabled: boolean;
}
export declare function useToggleButton(props: AriaToggleButtonOptions<'button'>, state: ToggleState, ref: RefObject<HTMLButtonElement | null>): ToggleButtonAria<ButtonHTMLAttributes<HTMLButtonElement>>;
export declare function useToggleButton(props: AriaToggleButtonOptions<'a'>, state: ToggleState, ref: RefObject<HTMLAnchorElement | null>): ToggleButtonAria<AnchorHTMLAttributes<HTMLAnchorElement>>;
export declare function useToggleButton(props: AriaToggleButtonOptions<'div'>, state: ToggleState, ref: RefObject<HTMLDivElement | null>): ToggleButtonAria<HTMLAttributes<HTMLDivElement>>;
export declare function useToggleButton(props: AriaToggleButtonOptions<'input'>, state: ToggleState, ref: RefObject<HTMLInputElement | null>): ToggleButtonAria<InputHTMLAttributes<HTMLInputElement>>;
export declare function useToggleButton(props: AriaToggleButtonOptions<'span'>, state: ToggleState, ref: RefObject<HTMLSpanElement | null>): ToggleButtonAria<HTMLAttributes<HTMLSpanElement>>;
export declare function useToggleButton(props: AriaToggleButtonOptions<ElementType>, state: ToggleState, ref: RefObject<Element | null>): ToggleButtonAria<DOMAttributes>;
