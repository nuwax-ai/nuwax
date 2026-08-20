import { AriaLabelingProps, DOMAttributes, DOMProps, Orientation } from '@react-types/shared';
export interface SeparatorProps extends DOMProps, AriaLabelingProps {
    /**
     * The orientation of the separator.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /** The HTML element type that will be used to render the separator. */
    elementType?: string;
}
export interface SeparatorAria {
    /** Props for the separator element. */
    separatorProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for a separator.
 * A separator is a visual divider between two groups of content,
 * e.g. groups of menu items or sections of a page.
 */
export declare function useSeparator(props: SeparatorProps): SeparatorAria;
