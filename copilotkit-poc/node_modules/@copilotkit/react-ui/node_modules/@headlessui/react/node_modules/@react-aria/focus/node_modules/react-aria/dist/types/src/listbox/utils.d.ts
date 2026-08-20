import { Key } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
interface ListData {
    id?: string;
    shouldSelectOnPressUp?: boolean;
    shouldFocusOnHover?: boolean;
    shouldUseVirtualFocus?: boolean;
    isVirtualized?: boolean;
    onAction?: (key: Key) => void;
    linkBehavior?: 'action' | 'selection' | 'override';
}
export declare const listData: WeakMap<ListState<unknown>, ListData>;
export declare function getItemId<T>(state: ListState<T>, itemKey: Key): string;
export {};
