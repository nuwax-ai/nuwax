import { Key } from '@react-types/shared';
import type { ListState } from 'react-stately/useListState';
interface ListMapShared {
    id: string;
    onAction?: (key: Key) => void;
    linkBehavior?: 'action' | 'selection' | 'override';
    keyboardNavigationBehavior: 'arrow' | 'tab';
    shouldSelectOnPressUp?: boolean;
}
export declare const listMap: WeakMap<ListState<unknown>, ListMapShared>;
export declare function getRowId<T>(state: ListState<T>, key: Key): string;
export declare function normalizeKey(key: Key): string;
export {};
