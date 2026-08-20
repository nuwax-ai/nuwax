import { AriaLabelingProps, DOMAttributes, DOMProps, LabelableProps } from '@react-types/shared';
import { ElementType, LabelHTMLAttributes } from 'react';
export interface LabelAriaProps extends LabelableProps, DOMProps, AriaLabelingProps {
    /**
     * The HTML element used to render the label, e.g. 'label', or 'span'.
     *
     * @default 'label'
     */
    labelElementType?: ElementType;
}
export interface LabelAria {
    /** Props to apply to the label container element. */
    labelProps: DOMAttributes | LabelHTMLAttributes<HTMLLabelElement>;
    /** Props to apply to the field container element being labeled. */
    fieldProps: AriaLabelingProps & DOMProps;
}
/**
 * Provides the accessibility implementation for labels and their associated elements.
 * Labels provide context for user inputs.
 *
 * @param props - The props for labels and fields.
 */
export declare function useLabel(props: LabelAriaProps): LabelAria;
