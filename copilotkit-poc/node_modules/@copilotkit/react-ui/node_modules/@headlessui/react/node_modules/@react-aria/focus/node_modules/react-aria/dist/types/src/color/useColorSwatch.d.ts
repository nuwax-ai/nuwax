import { AriaLabelingProps, DOMProps } from '@react-types/shared';
import { Color } from 'react-stately/Color';
import { HTMLAttributes } from 'react';
export interface AriaColorSwatchProps extends AriaLabelingProps, DOMProps {
    /** The color value to display in the swatch. */
    color?: string | Color;
    /**
     * A localized accessible name for the color.
     * By default, a description is generated from the color value,
     * but this can be overridden if you have a more specific color
     * name (e.g. Pantone colors).
     */
    colorName?: string;
}
export interface ColorSwatchAria {
    /** Props for the color swatch element. */
    colorSwatchProps: HTMLAttributes<HTMLElement>;
    /** The parsed color value of the swatch. */
    color: Color;
}
/**
 * Provides the accessibility implementation for a color swatch component.
 * A color swatch displays a preview of a selected color.
 */
export declare function useColorSwatch(props: AriaColorSwatchProps): ColorSwatchAria;
