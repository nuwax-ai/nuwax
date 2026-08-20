import { Placement, PlacementAxis } from './useOverlayPosition';
interface Position {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
}
interface Dimensions {
    width: number;
    height: number;
    totalWidth: number;
    totalHeight: number;
    top: number;
    left: number;
    scroll: Position;
}
interface Offset {
    top: number;
    left: number;
    width: number;
    height: number;
}
interface PositionOpts {
    arrowSize: number;
    placement: Placement;
    targetNode: Element;
    overlayNode: Element;
    scrollNode: Element;
    padding: number;
    shouldFlip: boolean;
    boundaryElement: Element;
    offset: number;
    crossOffset: number;
    maxHeight?: number;
    arrowBoundaryOffset?: number;
}
export interface PositionResult {
    position: Position;
    arrowOffsetLeft?: number;
    arrowOffsetTop?: number;
    triggerAnchorPoint: {
        x: number;
        y: number;
    };
    maxHeight: number;
    placement: PlacementAxis;
}
export declare function calculatePositionInternal(placementInput: Placement, childOffset: Offset, overlaySize: Offset, scrollSize: Offset, margins: Position, padding: number, flip: boolean, boundaryDimensions: Dimensions, containerDimensions: Dimensions, containerOffsetWithBoundary: Offset, offset: number, crossOffset: number, isContainerPositioned: boolean, userSetMaxHeight: number | undefined, arrowSize: number, arrowBoundaryOffset: number, isContainerDescendentOfBoundary: boolean, visualViewport: VisualViewport | null): PositionResult;
/**
 * Determines where to place the overlay with regards to the target and the position of an optional
 * indicator.
 */
export declare function calculatePosition(opts: PositionOpts): PositionResult;
export declare function getRect(node: Element, ignoreScale: boolean): {
    top: number;
    left: number;
    width: number;
    height: number;
};
export {};
