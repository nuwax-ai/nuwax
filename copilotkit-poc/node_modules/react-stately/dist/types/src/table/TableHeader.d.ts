import { CollectionBuilderContext } from './useTableState';
import { ColumnElement, ColumnRenderer } from './Column';
import { PartialNode } from '../collections/types';
import { JSX, ReactElement } from 'react';
export interface TableHeaderProps<T> {
    /** A list of table columns. */
    columns?: readonly T[];
    /**
     * A list of `Column(s)` or a function. If the latter, a list of columns must be provided using
     * the `columns` prop.
     */
    children: ColumnElement<T> | ColumnElement<T>[] | ColumnRenderer<T>;
}
declare function TableHeader<T>(props: TableHeaderProps<T>): ReactElement | null;
declare namespace TableHeader {
    var getCollectionNode: <T>(props: TableHeaderProps<T>, context: CollectionBuilderContext<T>) => Generator<PartialNode<T>, void, any>;
}
/**
 * A TableHeader is a container for the Column elements in a Table. Columns can be statically
 * defined as children, or generated dynamically using a function based on the data passed to the
 * `columns` prop.
 */
declare let _TableHeader: <T>(props: TableHeaderProps<T>) => JSX.Element;
export { _TableHeader as TableHeader };
