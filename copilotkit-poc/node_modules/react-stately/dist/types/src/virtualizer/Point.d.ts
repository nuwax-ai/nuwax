export declare class Point {
    /** The x-coordinate of the point. */
    x: number;
    /** The y-coordinate of the point. */
    y: number;
    constructor(x?: number, y?: number);
    /**
     * Returns a copy of this point.
     */
    copy(): Point;
    /**
     * Checks if two points are equal.
     */
    equals(point: Point): boolean;
    /**
     * Returns true if this point is the origin.
     */
    isOrigin(): boolean;
}
