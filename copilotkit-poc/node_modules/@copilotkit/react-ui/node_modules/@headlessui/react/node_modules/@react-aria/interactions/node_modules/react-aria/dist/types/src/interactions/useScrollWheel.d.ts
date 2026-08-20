import { RefObject, ScrollEvents } from '@react-types/shared';
export interface ScrollWheelProps extends ScrollEvents {
    /** Whether the scroll listener should be disabled. */
    isDisabled?: boolean;
}
export declare function useScrollWheel(props: ScrollWheelProps, ref: RefObject<HTMLElement | null>): void;
