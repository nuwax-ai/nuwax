import { AriaLabelingProps, DOMAttributes, DOMProps } from '@react-types/shared';
import { ReactNode } from 'react';
export interface ProgressBarBaseProps {
    /**
     * The current value (controlled).
     *
     * @default 0
     */
    value?: number;
    /**
     * The smallest value allowed for the input.
     *
     * @default 0
     */
    minValue?: number;
    /**
     * The largest value allowed for the input.
     *
     * @default 100
     */
    maxValue?: number;
    /** The content to display as the label. */
    label?: ReactNode;
    /**
     * The display format of the value label.
     *
     * @default { style: 'percent' }
     */
    formatOptions?: Intl.NumberFormatOptions;
    /** The content to display as the value's label (e.g. 1 of 4). */
    valueLabel?: ReactNode;
}
export interface AriaProgressBarBaseProps extends ProgressBarBaseProps, DOMProps, AriaLabelingProps {
}
export interface ProgressBarProps extends ProgressBarBaseProps {
    /**
     * Whether presentation is indeterminate when progress isn't known.
     */
    isIndeterminate?: boolean;
}
export interface AriaProgressBarProps extends ProgressBarProps, DOMProps, AriaLabelingProps {
}
export interface ProgressBarAria {
    /** Props for the progress bar container element. */
    progressBarProps: DOMAttributes;
    /** Props for the progress bar's visual label element (if any). */
    labelProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for a progress bar component.
 * Progress bars show either determinate or indeterminate progress of an operation
 * over time.
 */
export declare function useProgressBar(props: AriaProgressBarProps): ProgressBarAria;
