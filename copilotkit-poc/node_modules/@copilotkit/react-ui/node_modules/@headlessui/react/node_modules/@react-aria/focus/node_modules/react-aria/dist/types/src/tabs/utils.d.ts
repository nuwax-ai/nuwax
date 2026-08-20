import { Key } from '@react-types/shared';
import { TabListState } from 'react-stately/useTabListState';
export declare const tabsIds: WeakMap<TabListState<unknown>, string>;
export declare function generateId<T>(state: TabListState<T> | null, key: Key | null | undefined, role: string): string;
