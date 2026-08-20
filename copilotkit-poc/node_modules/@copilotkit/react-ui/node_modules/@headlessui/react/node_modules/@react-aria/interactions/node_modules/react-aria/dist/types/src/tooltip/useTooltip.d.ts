import { AriaLabelingProps, DOMAttributes, DOMProps } from '@react-types/shared';
import { TooltipTriggerState } from 'react-stately/useTooltipTriggerState';
export interface TooltipProps {
    isOpen?: boolean;
}
export interface AriaTooltipProps extends TooltipProps, DOMProps, AriaLabelingProps {
}
export interface TooltipAria {
    /**
     * Props for the tooltip element.
     */
    tooltipProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for a Tooltip component.
 */
export declare function useTooltip(props: AriaTooltipProps, state?: TooltipTriggerState): TooltipAria;
