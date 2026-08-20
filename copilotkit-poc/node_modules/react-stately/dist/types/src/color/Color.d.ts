import { ColorChannel, ColorSpace, Color as IColor } from './types';
/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export declare function parseColor(value: string): IColor;
export declare function normalizeColor(v: string | IColor): IColor;
/** Returns a list of color channels for a given color space. */
export declare function getColorChannels(colorSpace: ColorSpace): [ColorChannel, ColorChannel, ColorChannel];
/**
 * Returns the hue value normalized to the range of 0 to 360.
 */
export declare function normalizeHue(hue: number): number;
