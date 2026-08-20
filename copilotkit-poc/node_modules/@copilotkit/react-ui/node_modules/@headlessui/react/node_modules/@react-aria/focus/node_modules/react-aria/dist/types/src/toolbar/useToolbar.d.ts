import { AriaLabelingProps, Orientation, RefObject } from '@react-types/shared';
import { HTMLAttributes } from 'react';
export interface AriaToolbarProps extends AriaLabelingProps {
    /**
     * The orientation of the entire toolbar.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
}
export interface ToolbarAria {
    /**
     * Props for the toolbar container.
     */
    toolbarProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a toolbar.
 * A toolbar is a container for a set of interactive controls with arrow key navigation.
 *
 * @param props - Props to be applied to the toolbar.
 * @param ref - A ref to a DOM element for the toolbar.
 */
export declare function useToolbar(props: AriaToolbarProps, ref: RefObject<HTMLElement | null>): ToolbarAria;
