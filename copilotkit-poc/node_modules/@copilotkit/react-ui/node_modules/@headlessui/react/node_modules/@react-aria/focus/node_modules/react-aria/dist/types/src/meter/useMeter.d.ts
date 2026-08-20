import { AriaProgressBarBaseProps, ProgressBarBaseProps } from '../progress/useProgressBar';
import { DOMAttributes } from '@react-types/shared';
export type MeterProps = ProgressBarBaseProps;
export interface AriaMeterProps extends AriaProgressBarBaseProps {
}
export interface MeterAria {
    /** Props for the meter container element. */
    meterProps: DOMAttributes;
    /** Props for the meter's visual label (if any). */
    labelProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for a meter component.
 * Meters represent a quantity within a known range, or a fractional value.
 */
export declare function useMeter(props: AriaMeterProps): MeterAria;
