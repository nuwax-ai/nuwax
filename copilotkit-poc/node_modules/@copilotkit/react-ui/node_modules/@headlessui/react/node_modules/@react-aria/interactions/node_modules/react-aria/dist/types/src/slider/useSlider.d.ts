import { AriaLabelingProps, DOMAttributes, DOMProps, RefObject } from '@react-types/shared';
import { LabelHTMLAttributes, OutputHTMLAttributes } from 'react';
import { SliderProps, SliderState } from 'react-stately/useSliderState';
export interface AriaSliderProps<T = number | number[]> extends SliderProps<T>, DOMProps, AriaLabelingProps {
}
export interface SliderAria {
    /** Props for the label element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the root element of the slider component; groups slider inputs. */
    groupProps: DOMAttributes;
    /** Props for the track element. */
    trackProps: DOMAttributes;
    /** Props for the output element, displaying the value of the slider thumbs. */
    outputProps: OutputHTMLAttributes<HTMLOutputElement>;
}
/**
 * Provides the behavior and accessibility implementation for a slider component representing one or
 * more values.
 *
 * @param props Props for the slider.
 * @param state State for the slider, as returned by `useSliderState`.
 * @param trackRef Ref for the "track" element.  The width of this element provides the "length"
 *   of the track -- the span of one dimensional space that the slider thumb can be.  It also
 *   accepts click and drag motions, so that the closest thumb will follow clicks and drags on
 *   the track.
 */
export declare function useSlider<T extends number | number[]>(props: AriaSliderProps<T>, state: SliderState, trackRef: RefObject<Element | null>): SliderAria;
