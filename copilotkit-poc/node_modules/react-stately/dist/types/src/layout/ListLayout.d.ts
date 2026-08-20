import { Collection, DropTarget, DropTargetDelegate, ItemDropTarget, Key, Node, Orientation } from '@react-types/shared';
import { InvalidationContext } from '../virtualizer/types';
import { Layout } from '../virtualizer/Layout';
import { LayoutInfo } from '../virtualizer/LayoutInfo';
import { Rect } from '../virtualizer/Rect';
import { Size } from '../virtualizer/Size';
export interface ListLayoutOptions {
    /**
     * The primary orientation of the items. Usually this is the direction that the collection
     * scrolls.
     *
     * @default 'vertical'
     */
    orientation?: Orientation;
    /**
     * The fixed size of a row in px with respect to the applied orientation.
     *
     * @default 48
     */
    rowSize?: number;
    /**
     * The estimated size of a row in px with respect to the applied orientation, when row sizes are
     * variable.
     */
    estimatedRowSize?: number;
    /**
     * The fixed size of a section header in px with respect to the applied orientation.
     *
     * @default 48
     */
    headingSize?: number;
    /**
     * The estimated size of a section header in px with respect to the applied orientation, when
     * heading sizes are variable.
     */
    estimatedHeadingSize?: number;
    /**
     * The fixed size of a loader element in px with respect to the applied orientation. This loader
     * is specifically for "load more" elements rendered when loading more rows at the root level or
     * inside nested row/sections.
     *
     * @default 48
     */
    loaderSize?: number;
    /**
     * The thickness of the drop indicator.
     *
     * @default 2
     */
    dropIndicatorThickness?: number;
    /**
     * The gap between items.
     *
     * @default 0
     */
    gap?: number;
    /**
     * The padding around the list.
     *
     * @default 0
     */
    padding?: number;
    /**
     * The fixed height of a row in px.
     *
     * @deprecated Use `rowSize` instead.
     * @default 48
     */
    rowHeight?: number;
    /**
     * The estimated height of a row, when row heights are variable.
     *
     * @deprecated Use `estimatedRowSize` instead.
     */
    estimatedRowHeight?: number;
    /**
     * The fixed height of a section header in px.
     *
     * @deprecated Use `headingSize` instead.
     * @default 48
     */
    headingHeight?: number;
    /**
     * The estimated height of a section header, when the height is variable.
     *
     * @deprecated Use `estimatedHeadingSize` instead.
     */
    estimatedHeadingHeight?: number;
    /**
     * The fixed height of a loader element in px. This loader is specifically for "load more"
     * elements rendered when loading more rows at the root level or inside nested row/sections.
     *
     * @deprecated Use `loaderSize` instead.
     * @default 48
     */
    loaderHeight?: number;
}
export interface LayoutNode {
    node?: Node<unknown>;
    layoutInfo: LayoutInfo;
    children?: LayoutNode[];
    validRect: Rect;
    index?: number;
}
/**
 * ListLayout is a virtualizer Layout implementation
 * that arranges its items in a stack along its applied orientation.
 * It supports both fixed and variable size items.
 */
export declare class ListLayout<T, O extends ListLayoutOptions = ListLayoutOptions> extends Layout<Node<T>, O> implements DropTargetDelegate {
    protected rowSize: number | null;
    protected orientation: Orientation;
    protected estimatedRowSize: number | null;
    protected headingSize: number | null;
    protected estimatedHeadingSize: number | null;
    protected loaderSize: number | null;
    protected dropIndicatorThickness: number;
    protected gap: number;
    protected padding: number;
    protected layoutNodes: Map<Key, LayoutNode>;
    protected contentSize: Size;
    protected lastCollection: Collection<Node<T>> | null;
    protected rootNodes: LayoutNode[];
    private invalidateEverything;
    /** The rectangle containing currently valid layout infos. */
    protected validRect: Rect;
    /** The rectangle of requested layout infos so far. */
    protected requestedRect: Rect;
    /**
     * Creates a new ListLayout with options. See the list of properties below for a description
     * of the options that can be provided.
     */
    constructor(options?: ListLayoutOptions);
    protected get collection(): Collection<Node<T>>;
    /** @deprecated Use `rowSize` instead. */
    protected get rowHeight(): number | null;
    /** @deprecated Use `estimatedRowSize` instead. */
    protected get estimatedRowHeight(): number | null;
    /** @deprecated Use `headingSize` instead. */
    protected get headingHeight(): number | null;
    /** @deprecated Use `estimatedHeadingSize` instead. */
    protected get estimatedHeadingHeight(): number | null;
    /** @deprecated Use `loaderSize` instead. */
    protected get loaderHeight(): number | null;
    getLayoutInfo(key: Key): LayoutInfo | null;
    getVisibleLayoutInfos(rect: Rect): LayoutInfo[];
    protected layoutIfNeeded(rect: Rect): void;
    private ensureLayoutInfo;
    protected isVisible(node: LayoutNode, rect: Rect): boolean;
    protected shouldInvalidateEverything(invalidationContext: InvalidationContext<O>): boolean;
    shouldInvalidateLayoutOptions(newOptions: O, oldOptions: O): boolean;
    update(invalidationContext: InvalidationContext<O>): void;
    protected buildCollection(offset?: number): LayoutNode[];
    protected isValid(node: Node<T>, offset: number): boolean;
    protected buildChild(node: Node<T>, x: number, y: number, parentKey: Key | null): LayoutNode;
    protected buildNode(node: Node<T>, x: number, y: number): LayoutNode;
    protected buildLoader(node: Node<T>, x: number, y: number): LayoutNode;
    protected buildSection(node: Node<T>, x: number, y: number): LayoutNode;
    protected buildSectionHeader(node: Node<T>, x: number, y: number): LayoutNode;
    protected buildItem(node: Node<T>, x: number, y: number): LayoutNode;
    updateItemSize(key: Key, size: Size): boolean;
    private updateLayoutNode;
    getContentSize(): Size;
    getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget | null;
    getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo;
}
