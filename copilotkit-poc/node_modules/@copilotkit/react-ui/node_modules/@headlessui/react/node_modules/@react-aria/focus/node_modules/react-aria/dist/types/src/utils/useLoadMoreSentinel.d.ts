import type { AsyncLoadable, Collection } from '@react-types/shared';
import { RefObject } from 'react';
export interface LoadMoreSentinelProps extends Omit<AsyncLoadable, 'isLoading'> {
    collection: Collection<any>;
    /**
     * The amount of offset from the bottom of your scrollable region that should trigger load more.
     * Uses a percentage value relative to the scroll body's client height. Load more is then
     * triggered when your current scroll position's distance from the bottom of the currently loaded
     * list of items is less than or equal to the provided value. (e.g. 1 = 100% of the scroll
     * region's height).
     *
     * @default 1
     */
    scrollOffset?: number;
}
export declare function useLoadMoreSentinel(props: LoadMoreSentinelProps, ref: RefObject<HTMLElement | null>): void;
