import { ListData } from './useListData';
import { Key, LoadingState, Selection, SortDescriptor } from '@react-types/shared';
export interface AsyncListOptions<T, C> {
    /** The keys for the initially selected items. */
    initialSelectedKeys?: Iterable<Key>;
    /** The initial sort descriptor. */
    initialSortDescriptor?: SortDescriptor;
    /** The initial filter text. */
    initialFilterText?: string;
    /** A function that returns a unique key for an item object. */
    getKey?: (item: T) => Key;
    /** A function that loads the data for the items in the list. */
    load: AsyncListLoadFunction<T, C>;
    /**
     * An optional function that performs sorting. If not provided,
     * then `sortDescriptor` is passed to the `load` function.
     */
    sort?: AsyncListLoadFunction<T, C, AsyncListLoadOptions<T, C> & {
        sortDescriptor: SortDescriptor;
    }>;
}
export type AsyncListLoadFunction<T, C, S extends AsyncListLoadOptions<T, C> = AsyncListLoadOptions<T, C>> = (state: S) => AsyncListStateUpdate<T, C> | Promise<AsyncListStateUpdate<T, C>>;
export interface AsyncListLoadOptions<T, C> {
    /** The items currently in the list. */
    items: T[];
    /** The keys of the currently selected items in the list. */
    selectedKeys: Selection;
    /** The current sort descriptor for the list. */
    sortDescriptor?: SortDescriptor;
    /** An abort signal used to notify the load function that the request has been aborted. */
    signal: AbortSignal;
    /** The pagination cursor returned from the last page load. */
    cursor?: C;
    /** The current filter text used to perform server side filtering. */
    filterText?: string;
    /** The current loading state of the list. */
    loadingState?: LoadingState;
}
export interface AsyncListStateUpdate<T, C> {
    /** The new items to append to the list. */
    items: Iterable<T>;
    /** The keys to add to the selection. */
    selectedKeys?: Iterable<Key>;
    /** The sort descriptor to set. */
    sortDescriptor?: SortDescriptor;
    /** The pagination cursor to be used for the next page load. */
    cursor?: C;
    /** The updated filter text for the list. */
    filterText?: string;
}
export interface AsyncListData<T> extends ListData<T> {
    /** Whether data is currently being loaded. */
    isLoading: boolean;
    /** If loading data failed, then this contains the error that occurred. */
    error?: Error;
    /** The current sort descriptor for the list. */
    sortDescriptor?: SortDescriptor;
    /** Reloads the data in the list. */
    reload(): void;
    /** Loads the next page of data in the list. */
    loadMore(): void;
    /** Triggers sorting for the list. */
    sort(descriptor: SortDescriptor): void;
    /** The current loading state for the list. */
    loadingState: LoadingState;
}
/**
 * Manages state for an immutable async loaded list data structure, and provides convenience methods
 * to update the data over time. Manages loading and error states, pagination, and sorting.
 */
export declare function useAsyncList<T, C = string>(options: AsyncListOptions<T, C>): AsyncListData<T>;
