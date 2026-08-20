export declare class Size {
    width: number;
    height: number;
    constructor(width?: number, height?: number);
    /**
     * Returns a copy of this size.
     */
    copy(): Size;
    /**
     * Returns whether this size is equal to another one.
     */
    equals(other: Size): boolean;
    /**
     * The total area of the Size.
     */
    get area(): number;
}
