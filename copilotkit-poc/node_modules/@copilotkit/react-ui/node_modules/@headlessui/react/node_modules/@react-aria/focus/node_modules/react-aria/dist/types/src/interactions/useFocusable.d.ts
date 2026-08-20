import { DOMAttributes, FocusableDOMProps, FocusableElement, FocusableProps, RefObject } from '@react-types/shared';
import React, { MutableRefObject, ReactElement, ReactNode } from 'react';
export interface FocusableOptions<T = FocusableElement> extends FocusableProps<T>, FocusableDOMProps {
    /** Whether focus should be disabled. */
    isDisabled?: boolean;
}
export interface FocusableProviderProps extends DOMAttributes {
    /** The child element to provide DOM props to. */
    children?: ReactNode;
}
interface FocusableContextValue extends FocusableProviderProps {
    ref?: MutableRefObject<FocusableElement | null>;
}
/** @private */
export declare let FocusableContext: React.Context<FocusableContextValue | null>;
/**
 * Provides DOM props to the nearest focusable child.
 */
export declare const FocusableProvider: React.ForwardRefExoticComponent<FocusableProviderProps & React.RefAttributes<FocusableElement>>;
export interface FocusableAria {
    /** Props for the focusable element. */
    focusableProps: DOMAttributes;
}
/**
 * Used to make an element focusable and capable of auto focus.
 */
export declare function useFocusable<T extends FocusableElement = FocusableElement>(props: FocusableOptions<T>, domRef: RefObject<FocusableElement | null>): FocusableAria;
export interface FocusableComponentProps extends FocusableOptions {
    children: ReactElement<DOMAttributes, string>;
}
export declare const Focusable: React.ForwardRefExoticComponent<FocusableComponentProps & React.RefAttributes<FocusableElement>>;
export {};
