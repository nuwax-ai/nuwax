import { AriaLabelingProps, AriaValidationProps, DOMAttributes, DOMProps, FocusableDOMProps, FocusableProps, InputDOMProps, LabelableProps, Orientation, RefObject, ValidationState } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { SliderState } from 'react-stately/useSliderState';
export interface SliderThumbProps extends FocusableProps, LabelableProps {
    /**
     * The orientation of the Slider.
     *
     * @deprecated - pass to the slider instead.
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /** Whether the Thumb is disabled. */
    isDisabled?: boolean;
    /**
     * Index of the thumb within the slider.
     *
     * @default 0
     */
    index?: number;
    /** @deprecated */
    isRequired?: boolean;
    /** @deprecated */
    isInvalid?: boolean;
    /** @deprecated */
    validationState?: ValidationState;
}
export interface AriaSliderThumbProps extends SliderThumbProps, DOMProps, Omit<FocusableDOMProps, 'excludeFromTabOrder'>, InputDOMProps, AriaLabelingProps, AriaValidationProps {
}
export interface SliderThumbAria {
    /** Props for the root thumb element; handles the dragging motion. */
    thumbProps: DOMAttributes;
    /** Props for the visually hidden range input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the label element for this thumb (optional). */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Whether this thumb is currently being dragged. */
    isDragging: boolean;
    /** Whether the thumb is currently focused. */
    isFocused: boolean;
    /** Whether the thumb is disabled. */
    isDisabled: boolean;
}
export interface AriaSliderThumbOptions extends AriaSliderThumbProps {
    /** A ref to the track element. */
    trackRef: RefObject<Element | null>;
    /** A ref to the thumb input element. */
    inputRef: RefObject<HTMLInputElement | null>;
}
/**
 * Provides behavior and accessibility for a thumb of a slider component.
 *
 * @param opts Options for this Slider thumb.
 * @param state Slider state, created via `useSliderState`.
 */
export declare function useSliderThumb(opts: AriaSliderThumbOptions, state: SliderState): SliderThumbAria;
