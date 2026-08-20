import { Point } from './Point';
import { Size } from './Size';
export type RectCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
/**
 * Represents a rectangle.
 */
export declare class Rect {
    /** The x-coordinate of the rectangle. */
    x: number;
    /** The y-coordinate of the rectangle. */
    y: number;
    /** The width of the rectangle. */
    width: number;
    /** The height of the rectangle. */
    height: number;
    constructor(x?: number, y?: number, width?: number, height?: number);
    /**
     * The maximum x-coordinate in the rectangle.
     */
    get maxX(): number;
    /**
     * The maximum y-coordinate in the rectangle.
     */
    get maxY(): number;
    /**
     * The area of the rectangle.
     */
    get area(): number;
    /**
     * The top left corner of the rectangle.
     */
    get topLeft(): Point;
    /**
     * The top right corner of the rectangle.
     */
    get topRight(): Point;
    /**
     * The bottom left corner of the rectangle.
     */
    get bottomLeft(): Point;
    /**
     * The bottom right corner of the rectangle.
     */
    get bottomRight(): Point;
    /**
     * Returns whether this rectangle intersects another rectangle.
     *
     * @param rect - The rectangle to check.
     */
    intersects(rect: Rect): boolean;
    /**
     * Returns whether this rectangle fully contains another rectangle.
     *
     * @param rect - The rectangle to check.
     */
    containsRect(rect: Rect): boolean;
    /**
     * Returns whether the rectangle contains the given point.
     *
     * @param point - The point to check.
     */
    containsPoint(point: Point): boolean;
    /**
     * Returns the first corner of this rectangle (from top to bottom, left to right)
     * that is contained in the given rectangle, or null of the rectangles do not intersect.
     *
     * @param rect - The rectangle to check.
     */
    getCornerInRect(rect: Rect): RectCorner | null;
    equals(rect: Rect): boolean;
    pointEquals(point: Point | Rect): boolean;
    sizeEquals(size: Size | Rect): boolean;
    /**
     * Returns the union of this Rect and another.
     */
    union(other: Rect): Rect;
    /**
     * Returns the intersection of this Rect with another.
     * If the rectangles do not intersect, an all zero Rect is returned.
     */
    intersection(other: Rect): Rect;
    /**
     * Returns a copy of this rectangle.
     */
    copy(): Rect;
}
