import { DOMAttributes, RefObject } from '@react-types/shared';
export type Placement = 'bottom' | 'bottom left' | 'bottom right' | 'bottom start' | 'bottom end' | 'top' | 'top left' | 'top right' | 'top start' | 'top end' | 'left' | 'left top' | 'left bottom' | 'start' | 'start top' | 'start bottom' | 'right' | 'right top' | 'right bottom' | 'end' | 'end top' | 'end bottom';
export type Axis = 'top' | 'bottom' | 'left' | 'right';
export type SizeAxis = 'width' | 'height';
export type PlacementAxis = Axis | 'center';
export interface PositionProps {
    /**
     * The placement of the element with respect to its anchor element.
     *
     * @default 'bottom'
     */
    placement?: Placement;
    /**
     * The placement padding that should be applied between the element and its
     * surrounding container.
     *
     * @default 12
     */
    containerPadding?: number;
    /**
     * The additional offset applied along the main axis between the element and its
     * anchor element.
     *
     * @default 0
     */
    offset?: number;
    /**
     * The additional offset applied along the cross axis between the element and its
     * anchor element.
     *
     * @default 0
     */
    crossOffset?: number;
    /**
     * Whether the element should flip its orientation (e.g. top to bottom or left to right) when
     * there is insufficient room for it to render completely.
     *
     * @default true
     */
    shouldFlip?: boolean;
    /** Whether the element is rendered. */
    isOpen?: boolean;
}
export interface AriaPositionProps extends PositionProps {
    /**
     * Cross size of the overlay arrow in pixels.
     *
     * @default 0
     */
    arrowSize?: number;
    /**
     * Element that that serves as the positioning boundary.
     *
     * @default document.body
     */
    boundaryElement?: Element;
    /**
     * The ref for the element which the overlay positions itself with respect to.
     */
    targetRef: RefObject<Element | null>;
    /**
     * The ref for the overlay element.
     */
    overlayRef: RefObject<Element | null>;
    /**
     * The ref for the arrow element.
     */
    arrowRef?: RefObject<Element | null>;
    /**
     * A ref for the scrollable region within the overlay.
     *
     * @default overlayRef
     */
    scrollRef?: RefObject<Element | null>;
    /**
     * Whether the overlay should update its position automatically.
     *
     * @default true
     */
    shouldUpdatePosition?: boolean;
    /** Handler that is called when the overlay should close. */
    onClose?: (() => void) | null;
    /**
     * The maxHeight specified for the overlay element.
     * By default, it will take all space up to the current viewport height.
     */
    maxHeight?: number;
    /**
     * The minimum distance the arrow's edge should be from the edge of the overlay element.
     *
     * @default 0
     */
    arrowBoundaryOffset?: number;
}
export interface PositionAria {
    /** Props for the overlay container element. */
    overlayProps: DOMAttributes;
    /** Props for the overlay tip arrow if any. */
    arrowProps: DOMAttributes;
    /** Placement of the overlay with respect to the overlay trigger. */
    placement: PlacementAxis | null;
    /** The origin of the target in the overlay's coordinate system. Useful for animations. */
    triggerAnchorPoint: {
        x: number;
        y: number;
    } | null;
    /** Updates the position of the overlay. */
    updatePosition(): void;
}
/**
 * Handles positioning overlays like popovers and menus relative to a trigger
 * element, and updating the position when the window resizes.
 */
export declare function useOverlayPosition(props: AriaPositionProps): PositionAria;
