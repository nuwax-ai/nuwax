import { Key } from '@react-types/shared';
import { TableState } from 'react-stately/useTableState';
export declare const gridIds: WeakMap<TableState<unknown>, string>;
export declare function getColumnHeaderId<T>(state: TableState<T>, columnKey: Key): string;
export declare function getCellId<T>(state: TableState<T>, rowKey: Key, columnKey: Key): string;
export declare function getRowLabelledBy<T>(state: TableState<T>, rowKey: Key): string;
