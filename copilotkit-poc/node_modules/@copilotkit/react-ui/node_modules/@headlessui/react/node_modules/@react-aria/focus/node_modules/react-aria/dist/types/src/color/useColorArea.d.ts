import { AriaLabelingProps, DOMAttributes, DOMProps, RefObject } from '@react-types/shared';
import { ColorAreaProps, ColorAreaState } from 'react-stately/useColorAreaState';
import { InputHTMLAttributes } from 'react';
export interface AriaColorAreaProps extends ColorAreaProps, DOMProps, AriaLabelingProps {
    /**
     * The name of the x channel input element, used when submitting an HTML form. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
     */
    xName?: string;
    /**
     * The name of the y channel input element, used when submitting an HTML form. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
     */
    yName?: string;
    /**
     * The `<form>` element to associate the ColorArea with.
     * The value of this attribute must be the id of a `<form>` in the same document.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form).
     */
    form?: string;
}
export interface ColorAreaAria {
    /** Props for the color area container element. */
    colorAreaProps: DOMAttributes;
    /** Props for the thumb element. */
    thumbProps: DOMAttributes;
    /** Props for the visually hidden horizontal range input element. */
    xInputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the visually hidden vertical range input element. */
    yInputProps: InputHTMLAttributes<HTMLInputElement>;
}
export interface AriaColorAreaOptions extends AriaColorAreaProps {
    /** A ref to the input that represents the x axis of the color area. */
    inputXRef: RefObject<HTMLInputElement | null>;
    /** A ref to the input that represents the y axis of the color area. */
    inputYRef: RefObject<HTMLInputElement | null>;
    /** A ref to the color area containing element. */
    containerRef: RefObject<Element | null>;
}
/**
 * Provides the behavior and accessibility implementation for a color area component. Color area
 * allows users to adjust two channels of an RGB, HSL or HSB color value against a two-dimensional
 * gradient background.
 */
export declare function useColorArea(props: AriaColorAreaOptions, state: ColorAreaState): ColorAreaAria;
