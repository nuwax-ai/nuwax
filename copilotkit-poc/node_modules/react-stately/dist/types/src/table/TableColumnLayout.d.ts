import { ColumnSize } from './Column';
import { GridNode } from '../grid/GridCollection';
import { Key } from '@react-types/shared';
import { ITableCollection as TableCollection } from './TableCollection';
export interface TableColumnLayoutOptions<T> {
    getDefaultWidth?: (column: GridNode<T>) => ColumnSize | null | undefined;
    getDefaultMinWidth?: (column: GridNode<T>) => ColumnSize | null | undefined;
}
export declare class TableColumnLayout<T> {
    getDefaultWidth: (column: GridNode<T>) => ColumnSize | null | undefined;
    getDefaultMinWidth: (column: GridNode<T>) => ColumnSize | null | undefined;
    columnWidths: Map<Key, number>;
    columnMinWidths: Map<Key, number>;
    columnMaxWidths: Map<Key, number>;
    constructor(options: TableColumnLayoutOptions<T>);
    /**
     * Takes an array of columns and splits it into 2 maps of columns with controlled and columns with
     * uncontrolled widths.
     */
    splitColumnsIntoControlledAndUncontrolled(columns: Array<GridNode<T>>): [Map<Key, GridNode<T>>, Map<Key, GridNode<T>>];
    /** Takes uncontrolled and controlled widths and joins them into a single Map. */
    recombineColumns(columns: Array<GridNode<T>>, uncontrolledWidths: Map<Key, ColumnSize>, uncontrolledColumns: Map<Key, GridNode<T>>, controlledColumns: Map<Key, GridNode<T>>): Map<Key, ColumnSize>;
    /** Used to make an initial Map of the uncontrolled widths based on default widths. */
    getInitialUncontrolledWidths(uncontrolledColumns: Map<Key, GridNode<T>>): Map<Key, ColumnSize>;
    getColumnWidth(key: Key): number;
    getColumnMinWidth(key: Key): number;
    getColumnMaxWidth(key: Key): number;
    resizeColumnWidth(collection: TableCollection<T>, uncontrolledWidths: Map<Key, ColumnSize>, col: Key, width: number): Map<Key, ColumnSize>;
    buildColumnWidths(tableWidth: number, collection: TableCollection<T>, widths: Map<Key, ColumnSize>): Map<Key, number>;
}
