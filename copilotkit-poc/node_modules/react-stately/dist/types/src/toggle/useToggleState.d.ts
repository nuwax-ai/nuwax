import { FocusableProps, InputBase, Validation } from '@react-types/shared';
import { ReactNode } from 'react';
export interface ToggleStateOptions extends InputBase {
    /**
     * Whether the element should be selected (uncontrolled).
     */
    defaultSelected?: boolean;
    /**
     * Whether the element should be selected (controlled).
     */
    isSelected?: boolean;
    /**
     * Handler that is called when the element's selection state changes.
     */
    onChange?: (isSelected: boolean) => void;
}
export interface ToggleProps extends ToggleStateOptions, Validation<boolean>, FocusableProps {
    /**
     * The label for the element.
     */
    children?: ReactNode;
    /**
     * The value of the input element, used when submitting an HTML form. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefvalue).
     */
    value?: string;
}
export interface ToggleState {
    /** Whether the toggle is selected. */
    readonly isSelected: boolean;
    /** Whether the toggle is selected by default. */
    readonly defaultSelected: boolean;
    /** Updates selection state. */
    setSelected(isSelected: boolean): void;
    /** Toggle the selection state. */
    toggle(): void;
}
/**
 * Provides state management for toggle components like checkboxes and switches.
 */
export declare function useToggleState(props?: ToggleStateOptions): ToggleState;
