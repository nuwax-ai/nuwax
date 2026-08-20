import { AriaButtonProps } from '../button/useButton';
import { DisclosureState } from 'react-stately/useDisclosureState';
import { HTMLAttributes, RefObject } from 'react';
export interface AriaDisclosureProps {
    /** Whether the disclosure is disabled. */
    isDisabled?: boolean;
    /** Handler that is called when the disclosure's expanded state changes. */
    onExpandedChange?: (isExpanded: boolean) => void;
    /** Whether the disclosure is expanded (controlled). */
    isExpanded?: boolean;
    /** Whether the disclosure is expanded by default (uncontrolled). */
    defaultExpanded?: boolean;
}
export interface DisclosureAria {
    /** Props for the disclosure button. */
    buttonProps: AriaButtonProps;
    /** Props for the disclosure panel. */
    panelProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a disclosure component.
 *
 * @param props - Props for the disclosure.
 * @param state - State for the disclosure, as returned by `useDisclosureState`.
 * @param ref - A ref for the disclosure panel.
 */
export declare function useDisclosure(props: AriaDisclosureProps, state: DisclosureState, ref: RefObject<HTMLElement | null>): DisclosureAria;
