import { AriaLabelingProps, DOMProps } from '@react-types/shared';
import { JSX } from 'react';
export interface DismissButtonProps extends AriaLabelingProps, DOMProps {
    /** Called when the dismiss button is activated. */
    onDismiss?: () => void;
}
/**
 * A visually hidden button that can be used to allow screen reader
 * users to dismiss a modal or popup when there is no visual
 * affordance to do so.
 */
export declare function DismissButton(props: DismissButtonProps): JSX.Element;
