import { AsyncLoadable, LoadingState } from '@react-types/shared';
import { PartialNode } from '../collections/types';
import { JSX, ReactElement } from 'react';
import { RowElement } from './Row';
export interface TableBodyProps<T> extends Omit<AsyncLoadable, 'isLoading'> {
    /** The contents of the table body. Supports static items or a function for dynamic rendering. */
    children: RowElement<T> | RowElement<T>[] | ((item: T) => RowElement<T>);
    /** A list of row objects in the table body used when dynamically rendering rows. */
    items?: Iterable<T>;
    /** The current loading state of the table. */
    loadingState?: LoadingState;
}
declare function TableBody<T>(props: TableBodyProps<T>): ReactElement | null;
declare namespace TableBody {
    var getCollectionNode: <T>(props: TableBodyProps<T>) => Generator<PartialNode<T>, any, any>;
}
/**
 * A TableBody is a container for the Row elements of a Table. Rows can be statically defined as
 * children, or generated dynamically using a function based on the data passed to the `items`
 * prop.
 */
declare let _TableBody: <T>(props: TableBodyProps<T>) => JSX.Element;
export { _TableBody as TableBody };
