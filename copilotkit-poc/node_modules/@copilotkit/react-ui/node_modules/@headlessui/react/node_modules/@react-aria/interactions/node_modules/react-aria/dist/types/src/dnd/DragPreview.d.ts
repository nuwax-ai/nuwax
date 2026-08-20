import { DragItem, DragPreviewRenderer } from '@react-types/shared';
import React, { JSX } from 'react';
export interface DragPreviewProps {
    /**
     * A render function which returns a preview element, or an object containing the element
     * and a custom offset. If an object is returned, the provided `x` and `y` values will be
     * used as the drag preview offset instead of the default calculation.
     */
    children: (items: DragItem[]) => JSX.Element | {
        element: JSX.Element;
        x: number;
        y: number;
    } | null;
}
export declare const DragPreview: React.ForwardRefExoticComponent<DragPreviewProps & React.RefAttributes<DragPreviewRenderer | null>>;
