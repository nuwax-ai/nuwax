import { Orientation } from '@react-types/shared';
import { HTMLAttributes, MutableRefObject } from 'react';
interface UseDrag1DProps {
    containerRef: MutableRefObject<HTMLElement>;
    reverse?: boolean;
    orientation?: Orientation;
    onHover?: (hovered: boolean) => void;
    onDrag?: (dragging: boolean) => void;
    onPositionChange?: (position: number) => void;
    onIncrement?: () => void;
    onDecrement?: () => void;
    onIncrementToMax?: () => void;
    onDecrementToMin?: () => void;
    onCollapseToggle?: () => void;
}
export declare function useDrag1D(props: UseDrag1DProps): HTMLAttributes<HTMLElement>;
export {};
