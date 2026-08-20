import { DropTarget, ItemDropTarget, Key } from '@react-types/shared';
import { GridNode } from '../grid/GridCollection';
import { InvalidationContext } from '../virtualizer/types';
import { LayoutInfo } from '../virtualizer/LayoutInfo';
import { LayoutNode, ListLayout, ListLayoutOptions } from './ListLayout';
import { Rect } from '../virtualizer/Rect';
import { ITableCollection as TableCollection } from '../table/TableCollection';
export interface TableLayoutProps extends Omit<ListLayoutOptions, 'orientation' | 'rowSize' | 'estimatedRowSize' | 'headingSize' | 'estimatedHeadingSize' | 'loaderSize'> {
    /**
     * The fixed height of a row in px.
     *
     * @default 48
     */
    rowHeight?: number;
    /**
     * The estimated height of a row, when row heights are variable.
     */
    estimatedRowHeight?: number;
    /**
     * The fixed height of a section header in px.
     *
     * @default 48
     */
    headingHeight?: number;
    /**
     * The estimated height of a section header, when the height is variable.
     */
    estimatedHeadingHeight?: number;
    /**
     * The fixed height of a loader element in px. This loader is specifically for "load more"
     * elements rendered when loading more rows at the root level or inside nested row/sections.
     *
     * @default 48
     */
    loaderHeight?: number;
    columnWidths?: Map<Key, number>;
}
/**
 * TableLayout is a virtualizer Layout implementation that arranges
 * items in rows and columns.
 */
export declare class TableLayout<T, O extends TableLayoutProps = TableLayoutProps> extends ListLayout<T, O> {
    protected lastCollection: TableCollection<T> | null;
    private columnWidths;
    private stickyColumnIndices;
    private lastPersistedKeys;
    private persistedIndices;
    constructor(options?: TableLayoutProps);
    protected get collection(): TableCollection<T>;
    protected get rowHeight(): number | null;
    protected get estimatedRowHeight(): number | null;
    protected get headingHeight(): number | null;
    protected get estimatedHeadingHeight(): number | null;
    protected get loaderHeight(): number | null;
    private columnsChanged;
    shouldInvalidateLayoutOptions(newOptions: O, oldOptions: O): boolean;
    update(invalidationContext: InvalidationContext<O>): void;
    protected buildCollection(): LayoutNode[];
    protected buildTableHeader(): LayoutNode;
    protected buildHeaderRow(headerRow: GridNode<T>, x: number, y: number): LayoutNode;
    private setChildHeights;
    private getRenderedColumnWidth;
    private getEstimatedHeight;
    protected getEstimatedRowHeight(): number;
    protected buildColumn(node: GridNode<T>, x: number, y: number): LayoutNode;
    protected isStickyColumn(node: GridNode<T>): boolean;
    protected buildBody(y: number): LayoutNode;
    protected buildRowGroup(y: number, node: GridNode<T>): LayoutNode;
    protected buildLoader(node: GridNode<T>, x: number, y: number): LayoutNode;
    protected buildNode(node: GridNode<T>, x: number, y: number): LayoutNode;
    protected buildRow(node: GridNode<T>, x: number, y: number): LayoutNode;
    protected buildCell(node: GridNode<T>, x: number, y: number): LayoutNode;
    getVisibleLayoutInfos(rect: Rect): LayoutInfo[];
    private addVisibleLayoutInfos;
    private binarySearch;
    private buildPersistedIndices;
    getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget | null;
    getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo;
}
