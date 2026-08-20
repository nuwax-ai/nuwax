import { JSX, ReactElement, ReactNode } from 'react';
import { Key } from '@react-types/shared';
import { PartialNode } from '../collections/types';
export interface CellProps {
    /** The contents of the cell. */
    children: ReactNode;
    /** A string representation of the cell's contents, used for features like typeahead. */
    textValue?: string;
    /** Indicates how many columns the data cell spans. */
    colSpan?: number;
}
export type CellElement = ReactElement<CellProps>;
export type CellRenderer = (columnKey: Key) => CellElement;
declare function Cell(props: CellProps): ReactElement | null;
declare namespace Cell {
    var getCollectionNode: <T>(props: CellProps) => Generator<PartialNode<T>, any, any>;
}
/**
 * A Cell represents the value of a single Column within a Table Row.
 */
declare let _Cell: (props: CellProps) => JSX.Element;
export { _Cell as Cell };
