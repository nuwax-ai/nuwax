import { Direction, DropTarget, DropTargetDelegate, Node, Orientation, RefObject } from '@react-types/shared';
interface ListDropTargetDelegateOptions {
    /**
     * Whether the items are arranged in a stack or grid.
     *
     * @default 'stack'
     */
    layout?: 'stack' | 'grid';
    /**
     * The primary orientation of the items. Usually this is the
     * direction that the collection scrolls.
     *
     * @default 'vertical'
     */
    orientation?: Orientation;
    /**
     * The horizontal layout direction.
     *
     * @default 'ltr'
     */
    direction?: Direction;
}
export declare class ListDropTargetDelegate implements DropTargetDelegate {
    private collection;
    private ref;
    private layout;
    private orientation;
    protected direction: Direction;
    constructor(collection: Iterable<Node<unknown>>, ref: RefObject<HTMLElement | null>, options?: ListDropTargetDelegateOptions);
    private getPrimaryStart;
    private getPrimaryEnd;
    private getSecondaryStart;
    private getSecondaryEnd;
    private getFlowStart;
    private getFlowEnd;
    private getFlowSize;
    getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget;
}
export {};
