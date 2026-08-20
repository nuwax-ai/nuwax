import { AriaLabelingProps, DOMAttributes, DOMProps, InputDOMProps, RefObject } from '@react-types/shared';
import { ColorSliderProps, ColorSliderState } from 'react-stately/useColorSliderState';
import { InputHTMLAttributes } from 'react';
export interface AriaColorSliderProps extends ColorSliderProps, InputDOMProps, DOMProps, AriaLabelingProps {
}
export interface AriaColorSliderOptions extends AriaColorSliderProps {
    /** A ref for the track element. */
    trackRef: RefObject<Element | null>;
    /** A ref for the input element. */
    inputRef: RefObject<HTMLInputElement | null>;
}
export interface ColorSliderAria {
    /** Props for the label element. */
    labelProps: DOMAttributes;
    /** Props for the track element. */
    trackProps: DOMAttributes;
    /** Props for the thumb element. */
    thumbProps: DOMAttributes;
    /** Props for the visually hidden range input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the output element, displaying the value of the color slider. */
    outputProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a color slider component.
 * Color sliders allow users to adjust an individual channel of a color value.
 */
export declare function useColorSlider(props: AriaColorSliderOptions, state: ColorSliderState): ColorSliderAria;
