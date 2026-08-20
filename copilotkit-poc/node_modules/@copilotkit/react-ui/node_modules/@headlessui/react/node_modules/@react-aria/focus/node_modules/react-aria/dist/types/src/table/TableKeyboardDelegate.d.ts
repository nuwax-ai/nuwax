import { GridKeyboardDelegate } from '../grid/GridKeyboardDelegate';
import { ITableCollection } from 'react-stately/private/table/TableCollection';
import { Key, Node } from '@react-types/shared';
export declare class TableKeyboardDelegate<T> extends GridKeyboardDelegate<T, ITableCollection<T>> {
    protected isCell(node: Node<T>): boolean;
    getKeyBelow(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getKeyAbove(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    private findNextColumnKey;
    private findPreviousColumnKey;
    getKeyRightOf(key: Key): Key | null;
    getKeyLeftOf(key: Key): Key | null;
    getKeyForSearch(search: string, fromKey?: Key): Key | null;
}
