import { CellElement, CellRenderer } from './Cell';
import { CollectionBuilderContext } from './useTableState';
import { LinkDOMProps } from '@react-types/shared';
import { PartialNode } from '../collections/types';
import { JSX, ReactElement } from 'react';
export type RowElement<T> = ReactElement<RowProps<T>>;
export interface RowProps<T> extends LinkDOMProps {
    /**
     * A list of child item objects used when dynamically rendering row children. Requires the feature
     * flag to be enabled along with UNSTABLE_allowsExpandableRows, see
     * https://react-spectrum.adobe.com/react-spectrum/TableView.html#expandable-rows.
     *
     * @private
     * @version alpha
     */
    UNSTABLE_childItems?: Iterable<T>;
    /** Rendered contents of the row or row child items. */
    children: CellElement | CellElement[] | CellRenderer;
    /** A string representation of the row's contents, used for features like typeahead. */
    textValue?: string;
}
declare function Row<T>(props: RowProps<T>): ReactElement | null;
declare namespace Row {
    var getCollectionNode: <T>(props: RowProps<T>, context: CollectionBuilderContext<T>) => Generator<PartialNode<T>, any, any>;
}
/**
 * A Row represents a single item in a Table and contains Cell elements for each column.
 * Cells can be statically defined as children, or generated dynamically using a function
 * based on the columns defined in the TableHeader.
 */
declare let _Row: <T>(props: RowProps<T>) => JSX.Element;
export { _Row as Row };
