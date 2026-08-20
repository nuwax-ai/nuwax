import { AriaLabelingProps, RefObject } from '@react-types/shared';
import { ColorChannelFieldProps, ColorChannelFieldState } from 'react-stately/useColorFieldState';
import { NumberFieldAria } from '../numberfield/useNumberField';
export interface AriaColorChannelFieldProps extends ColorChannelFieldProps, AriaLabelingProps {
}
export interface ColorChannelFieldAria extends NumberFieldAria {
}
/**
 * Provides the behavior and accessibility implementation for a color channel field, allowing users
 * to edit the value of an individual color channel.
 */
export declare function useColorChannelField(props: AriaColorChannelFieldProps, state: ColorChannelFieldState, inputRef: RefObject<HTMLInputElement | null>): ColorChannelFieldAria;
