import { CollectionBuilderContext } from './useTableState';
import { GridNode } from '../grid/GridCollection';
import { PartialNode } from '../collections/types';
import { JSX, ReactElement, ReactNode } from 'react';
/** Widths that result in a constant pixel value for the same Table width. */
export type ColumnStaticSize = number | `${number}` | `${number}%`;
/**
 * Widths that change size in relation to the remaining space and in ratio to other dynamic columns.
 * All numbers must be integers and greater than 0.
 * FR units take up remaining, if any, space in the table.
 */
export type ColumnDynamicSize = `${number}fr`;
/** All possible sizes a column can be assigned. */
export type ColumnSize = ColumnStaticSize | ColumnDynamicSize;
export type ColumnElement<T> = ReactElement<ColumnProps<T>>;
export type ColumnRenderer<T> = (item: T) => ColumnElement<T>;
export interface ColumnProps<T> {
    /** Rendered contents of the column if `children` contains child columns. */
    title?: ReactNode;
    /** Static child columns or content to render as the column header. */
    children: ReactNode | ColumnElement<T> | ColumnElement<T>[];
    /** A list of child columns used when dynamically rendering nested child columns. */
    childColumns?: T[];
    /** The width of the column. */
    width?: ColumnSize | null;
    /** The minimum width of the column. */
    minWidth?: ColumnStaticSize | null;
    /** The maximum width of the column. */
    maxWidth?: ColumnStaticSize | null;
    /** The default width of the column. */
    defaultWidth?: ColumnSize | null;
    /** Whether the column allows resizing. */
    allowsResizing?: boolean;
    /** Whether the column allows sorting. */
    allowsSorting?: boolean;
    /**
     * Whether a column is a [row header](https://www.w3.org/TR/wai-aria-1.1/#rowheader) and should be
     * announced by assistive technology during row navigation.
     */
    isRowHeader?: boolean;
    /** A string representation of the column's contents, used for accessibility announcements. */
    textValue?: string;
}
declare function Column<T>(props: ColumnProps<T>): ReactElement | null;
declare namespace Column {
    var getCollectionNode: <T>(props: ColumnProps<T>, context: CollectionBuilderContext<T>) => Generator<PartialNode<T>, void, GridNode<T>[]>;
}
/**
 * A Column represents a field of each item within a Table. Columns may also contain nested
 * Column elements to represent column groups. Nested columns can be statically defined as
 * children, or dynamically generated using a function based on the `childColumns` prop.
 */
declare let _Column: <T>(props: ColumnProps<T>) => JSX.Element;
export { _Column as Column };
