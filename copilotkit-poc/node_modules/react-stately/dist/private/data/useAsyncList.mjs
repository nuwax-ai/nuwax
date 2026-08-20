import {createListActions as $232f8dea1b0a4f2f$export$79c0c687a5963b0a} from "./useListData.mjs";
import {useReducer as $9gyWu$useReducer, useRef as $9gyWu$useRef, useEffect as $9gyWu$useEffect} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $c73d3f3d5ec90946$var$reducer(data, action) {
    let selectedKeys;
    switch(data.state){
        case 'idle':
        case 'error':
            switch(action.type){
                case 'loading':
                case 'loadingMore':
                case 'sorting':
                case 'filtering':
                    return {
                        ...data,
                        filterText: action.filterText ?? data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        sortDescriptor: action.sortDescriptor ?? data.sortDescriptor,
                        abortController: action.abortController
                    };
                case 'update':
                    return {
                        ...data,
                        ...action.updater?.(data)
                    };
                case 'success':
                case 'error':
                    return data;
                default:
                    throw new Error(`Invalid action "${action.type}" in state "${data.state}"`);
            }
        case 'loading':
        case 'sorting':
        case 'filtering':
            switch(action.type){
                case 'success':
                    // Ignore if there is a newer abortcontroller in state.
                    // This means that multiple requests were going at once.
                    // We want to take only the latest result.
                    if (action.abortController !== data.abortController) return data;
                    selectedKeys = action.selectedKeys ?? data.selectedKeys;
                    return {
                        ...data,
                        filterText: action.filterText ?? data.filterText,
                        state: 'idle',
                        items: [
                            ...action.items ?? []
                        ],
                        selectedKeys: selectedKeys === 'all' ? 'all' : new Set(selectedKeys),
                        sortDescriptor: action.sortDescriptor ?? data.sortDescriptor,
                        abortController: undefined,
                        cursor: action.cursor
                    };
                case 'error':
                    if (action.abortController !== data.abortController) return data;
                    return {
                        ...data,
                        state: 'error',
                        error: action.error,
                        abortController: undefined
                    };
                case 'loading':
                case 'loadingMore':
                case 'sorting':
                case 'filtering':
                    // We're already loading, and another load was triggered at the same time.
                    // We need to abort the previous load and start a new one.
                    data.abortController?.abort('aborting current load and starting new one');
                    return {
                        ...data,
                        filterText: action.filterText ?? data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        abortController: action.abortController
                    };
                case 'update':
                    // We're already loading, and an update happened at the same time (e.g. selectedKey changed).
                    // Update data but don't abort previous load.
                    return {
                        ...data,
                        ...action.updater?.(data)
                    };
                default:
                    throw new Error(`Invalid action "${action.type}" in state "${data.state}"`);
            }
        case 'loadingMore':
            switch(action.type){
                case 'success':
                    selectedKeys = data.selectedKeys === 'all' || action.selectedKeys === 'all' ? 'all' : new Set([
                        ...data.selectedKeys,
                        ...action.selectedKeys ?? []
                    ]);
                    // Append the new items
                    return {
                        ...data,
                        state: 'idle',
                        items: [
                            ...data.items,
                            ...action.items ?? []
                        ],
                        selectedKeys: selectedKeys,
                        sortDescriptor: action.sortDescriptor ?? data.sortDescriptor,
                        abortController: undefined,
                        cursor: action.cursor
                    };
                case 'error':
                    if (action.abortController !== data.abortController) return data;
                    return {
                        ...data,
                        state: 'error',
                        error: action.error
                    };
                case 'loading':
                case 'sorting':
                case 'filtering':
                    // We're already loading more, and another load was triggered at the same time.
                    // We need to abort the previous load more and start a new one.
                    data.abortController?.abort();
                    return {
                        ...data,
                        filterText: action.filterText ?? data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        abortController: action.abortController
                    };
                case 'loadingMore':
                    // If already loading more and another loading more is triggered, abort the new load more since
                    // it is a duplicate request since the cursor hasn't been updated.
                    // Do not overwrite the data.abortController
                    action.abortController?.abort();
                    return data;
                case 'update':
                    // We're already loading, and an update happened at the same time (e.g. selectedKey changed).
                    // Update data but don't abort previous load.
                    return {
                        ...data,
                        ...action.updater?.(data)
                    };
                default:
                    throw new Error(`Invalid action "${action.type}" in state "${data.state}"`);
            }
        default:
            throw new Error(`Invalid state "${data.state}"`);
    }
}
function $c73d3f3d5ec90946$export$bc3384a35de93d66(options) {
    const { load: load, sort: sort, initialSelectedKeys: initialSelectedKeys, initialSortDescriptor: initialSortDescriptor, getKey: getKey = (item)=>item.id || item.key, initialFilterText: initialFilterText = '' } = options;
    let [data, dispatch] = (0, $9gyWu$useReducer)($c73d3f3d5ec90946$var$reducer, {
        state: 'idle',
        error: undefined,
        items: [],
        selectedKeys: initialSelectedKeys === 'all' ? 'all' : new Set(initialSelectedKeys),
        sortDescriptor: initialSortDescriptor,
        filterText: initialFilterText
    });
    const dispatchFetch = async (action, fn)=>{
        let abortController = new AbortController();
        try {
            dispatch({
                ...action,
                abortController: abortController
            });
            let previousFilterText = action.filterText ?? data.filterText;
            let response = await fn({
                items: data.items.slice(),
                selectedKeys: data.selectedKeys,
                sortDescriptor: action.sortDescriptor ?? data.sortDescriptor,
                signal: abortController.signal,
                cursor: action.type === 'loadingMore' ? data.cursor : undefined,
                filterText: previousFilterText,
                loadingState: data.state
            });
            let filterText = response.filterText ?? previousFilterText;
            dispatch({
                type: 'success',
                ...response,
                abortController: abortController
            });
            // Fetch a new filtered list if filterText is updated via `load` response func rather than list.setFilterText
            // Only do this if not aborted (e.g. user triggers another filter action before load completes)
            if (filterText && filterText !== previousFilterText && !abortController.signal.aborted) dispatchFetch({
                type: 'filtering',
                filterText: filterText
            }, load);
        } catch (e) {
            dispatch({
                type: 'error',
                error: e,
                abortController: abortController
            });
        }
    };
    let didDispatchInitialFetch = (0, $9gyWu$useRef)(false);
    (0, $9gyWu$useEffect)(()=>{
        if (!didDispatchInitialFetch.current) {
            dispatchFetch({
                type: 'loading'
            }, load);
            didDispatchInitialFetch.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return {
        items: data.items,
        selectedKeys: data.selectedKeys,
        sortDescriptor: data.sortDescriptor,
        isLoading: data.state === 'loading' || data.state === 'loadingMore' || data.state === 'sorting' || data.state === 'filtering',
        loadingState: data.state,
        error: data.error,
        filterText: data.filterText,
        getItem (key) {
            return data.items.find((item)=>getKey(item) === key);
        },
        reload () {
            dispatchFetch({
                type: 'loading'
            }, load);
        },
        loadMore () {
            // Ignore if already loading more or if performing server side filtering.
            if (data.state === 'loading' || data.state === 'loadingMore' || data.state === 'filtering' || data.cursor == null) return;
            dispatchFetch({
                type: 'loadingMore'
            }, load);
        },
        sort (sortDescriptor) {
            dispatchFetch({
                type: 'sorting',
                sortDescriptor: sortDescriptor
            }, sort || load);
        },
        ...(0, $232f8dea1b0a4f2f$export$79c0c687a5963b0a)({
            ...options,
            getKey: getKey,
            cursor: data.cursor
        }, (fn)=>{
            dispatch({
                type: 'update',
                updater: fn
            });
        }),
        setFilterText (filterText) {
            dispatchFetch({
                type: 'filtering',
                filterText: filterText
            }, load);
        }
    };
}


export {$c73d3f3d5ec90946$export$bc3384a35de93d66 as useAsyncList};
//# sourceMappingURL=useAsyncList.mjs.map
