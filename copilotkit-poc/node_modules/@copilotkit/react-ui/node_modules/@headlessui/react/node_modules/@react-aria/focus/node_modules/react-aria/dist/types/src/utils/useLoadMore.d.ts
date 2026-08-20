import { RefObject } from 'react';
export interface LoadMoreProps {
    /** Whether data is currently being loaded. */
    isLoading?: boolean;
    /** Handler that is called when more items should be loaded, e.g. while scrolling near the bottom. */
    onLoadMore?: () => void;
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
    /** The data currently loaded. */
    items?: any;
}
export declare function useLoadMore(props: LoadMoreProps, ref: RefObject<HTMLElement | null>): void;
