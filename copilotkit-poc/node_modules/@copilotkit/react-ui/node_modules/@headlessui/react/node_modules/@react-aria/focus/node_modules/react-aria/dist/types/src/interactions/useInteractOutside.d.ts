import { RefObject } from '@react-types/shared';
export interface InteractOutsideProps {
    ref: RefObject<Element | null>;
    onInteractOutside?: (e: PointerEvent) => void;
    onInteractOutsideStart?: (e: PointerEvent) => void;
    /** Whether the interact outside events should be disabled. */
    isDisabled?: boolean;
}
/**
 * Example, used in components like Dialogs and Popovers so they can close
 * when a user clicks outside them.
 */
export declare function useInteractOutside(props: InteractOutsideProps): void;
