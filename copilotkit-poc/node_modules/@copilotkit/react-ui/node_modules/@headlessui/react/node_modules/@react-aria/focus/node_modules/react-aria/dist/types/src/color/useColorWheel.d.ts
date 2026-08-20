import { AriaLabelingProps, DOMAttributes, DOMProps, InputDOMProps, RefObject } from '@react-types/shared';
import { ColorWheelProps, ColorWheelState } from 'react-stately/useColorWheelState';
import { InputHTMLAttributes } from 'react';
export interface AriaColorWheelProps extends ColorWheelProps, InputDOMProps, DOMProps, AriaLabelingProps {
}
export interface AriaColorWheelOptions extends AriaColorWheelProps {
    /** The outer radius of the color wheel. */
    outerRadius: number;
    /** The inner radius of the color wheel. */
    innerRadius: number;
}
export interface ColorWheelAria {
    /** Props for the track element. */
    trackProps: DOMAttributes;
    /** Props for the thumb element. */
    thumbProps: DOMAttributes;
    /** Props for the visually hidden range input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
}
/**
 * Provides the behavior and accessibility implementation for a color wheel component.
 * Color wheels allow users to adjust the hue of an HSL or HSB color value on a circular track.
 */
export declare function useColorWheel(props: AriaColorWheelOptions, state: ColorWheelState, inputRef: RefObject<HTMLInputElement | null>): ColorWheelAria;
