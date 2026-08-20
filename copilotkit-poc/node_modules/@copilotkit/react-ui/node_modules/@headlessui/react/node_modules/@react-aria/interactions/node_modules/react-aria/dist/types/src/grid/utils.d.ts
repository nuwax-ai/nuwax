import type { IGridCollection as GridCollection } from 'react-stately/private/grid/GridCollection';
import type { GridState } from 'react-stately/private/grid/useGridState';
import type { Key, KeyboardDelegate } from '@react-types/shared';
interface GridMapShared {
    keyboardDelegate: KeyboardDelegate;
    actions: {
        onRowAction?: (key: Key) => void;
        onCellAction?: (key: Key) => void;
    };
    shouldSelectOnPressUp?: boolean;
}
export declare const gridMap: WeakMap<GridState<unknown, GridCollection<unknown>>, GridMapShared>;
export {};
