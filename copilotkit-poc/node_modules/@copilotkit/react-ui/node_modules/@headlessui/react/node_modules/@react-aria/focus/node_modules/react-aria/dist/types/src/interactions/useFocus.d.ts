import { DOMAttributes, FocusableElement, FocusEvents } from '@react-types/shared';
export interface FocusProps<Target = FocusableElement> extends FocusEvents<Target> {
    /** Whether the focus events should be disabled. */
    isDisabled?: boolean;
}
export interface FocusResult<Target = FocusableElement> {
    /** Props to spread onto the target element. */
    focusProps: DOMAttributes<Target>;
}
/**
 * Handles focus events for the immediate target.
 * Focus events on child elements will be ignored.
 */
export declare function useFocus<Target extends FocusableElement = FocusableElement>(props: FocusProps<Target>): FocusResult<Target>;
