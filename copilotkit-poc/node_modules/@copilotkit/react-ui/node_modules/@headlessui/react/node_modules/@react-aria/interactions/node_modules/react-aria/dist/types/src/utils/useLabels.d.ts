import { AriaLabelingProps, DOMProps } from '@react-types/shared';
/**
 * Merges aria-label and aria-labelledby into aria-labelledby when both exist.
 *
 * @param props - Aria label props.
 * @param defaultLabel - Default value for aria-label when not present.
 */
export declare function useLabels(props: DOMProps & AriaLabelingProps, defaultLabel?: string): DOMProps & AriaLabelingProps;
