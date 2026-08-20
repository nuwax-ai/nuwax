export interface DisclosureProps {
    /** Whether the disclosure is expanded (controlled). */
    isExpanded?: boolean;
    /** Whether the disclosure is expanded by default (uncontrolled). */
    defaultExpanded?: boolean;
    /** Handler that is called when the disclosure expanded state changes. */
    onExpandedChange?: (isExpanded: boolean) => void;
}
export interface DisclosureState {
    /** Whether the disclosure is currently expanded. */
    readonly isExpanded: boolean;
    /** Sets whether the disclosure is expanded. */
    setExpanded(isExpanded: boolean): void;
    /** Expand the disclosure. */
    expand(): void;
    /** Collapse the disclosure. */
    collapse(): void;
    /** Toggles the disclosure's visibility. */
    toggle(): void;
}
/**
 * Manages state for a disclosure widget. Tracks whether the disclosure is expanded, and provides
 * methods to toggle this state.
 */
export declare function useDisclosureState(props: DisclosureProps): DisclosureState;
