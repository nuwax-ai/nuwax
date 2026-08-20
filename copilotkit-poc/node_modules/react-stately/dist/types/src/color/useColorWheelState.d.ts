import { Color } from './types';
import { ValueBase } from '@react-types/shared';
export interface ColorWheelProps extends Omit<ValueBase<string | Color>, 'onChange'> {
    /** Whether the ColorWheel is disabled. */
    isDisabled?: boolean;
    /** Handler that is called when the value changes, as the user drags. */
    onChange?: (value: Color) => void;
    /** Handler that is called when the user stops dragging. */
    onChangeEnd?: (value: Color) => void;
    /**
     * The default value (uncontrolled).
     *
     * @default 'hsl(0, 100%, 50%)'
     */
    defaultValue?: string | Color;
}
export interface ColorWheelState {
    /** The current color value represented by the color wheel. */
    readonly value: Color;
    /** The default color value. */
    readonly defaultValue: Color;
    /** Sets the color value represented by the color wheel, and triggers `onChange`. */
    setValue(value: string | Color): void;
    /** The current value of the hue channel displayed by the color wheel. */
    readonly hue: number;
    /** Sets the hue channel of the current color value and triggers `onChange`. */
    setHue(value: number): void;
    /**
     * Sets the hue channel of the current color value based on the given coordinates and radius of
     * the color wheel, and triggers `onChange`.
     */
    setHueFromPoint(x: number, y: number, radius: number): void;
    /** Returns the coordinates of the thumb relative to the center point of the color wheel. */
    getThumbPosition(radius: number): {
        x: number;
        y: number;
    };
    /** Increments the hue by the given amount (defaults to 1). */
    increment(stepSize?: number): void;
    /** Decrements the hue by the given amount (defaults to 1). */
    decrement(stepSize?: number): void;
    /** Whether the color wheel is currently being dragged. */
    readonly isDragging: boolean;
    /** Sets whether the color wheel is being dragged. */
    setDragging(value: boolean): void;
    /** Returns the color that should be displayed in the color wheel instead of `value`. */
    getDisplayColor(): Color;
    /** The step value of the hue channel, used when incrementing and decrementing. */
    step: number;
    /** The page step value of the hue channel, used when incrementing and decrementing. */
    pageStep: number;
    /** Whether the color wheel is disabled. */
    readonly isDisabled: boolean;
}
/**
 * Provides state management for a color wheel component.
 * Color wheels allow users to adjust the hue of an HSL or HSB color value on a circular track.
 */
export declare function useColorWheelState(props: ColorWheelProps): ColorWheelState;
