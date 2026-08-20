import {createListActions as $edd711f2f244e14b$export$79c0c687a5963b0a} from "./useListData.js";
import {useReducer as $lJhEB$useReducer, useRef as $lJhEB$useRef, useEffect as $lJhEB$useEffect} from "react";

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

function $ea3e5f1954bb0c9f$var$reducer(data, action) {
    let selectedKeys;
    switch(data.state){
        case 'idle':
        case 'error':
            switch(action.type){
                case 'loading':
                case 'loadingMore':
                case 'sorting':
                case 'filtering':
                    var _action_filterText, _action_sortDescriptor;
                    return {
                        ...data,
                        filterText: (_action_filterText = action.filterText) !== null && _action_filterText !== void 0 ? _action_filterText : data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        sortDescriptor: (_action_sortDescriptor = action.sortDescriptor) !== null && _action_sortDescriptor !== void 0 ? _action_sortDescriptor : data.sortDescriptor,
                        abortController: action.abortController
                    };
                case 'update':
                    var _action_updater;
                    return {
                        ...data,
                        ...(_action_updater = action.updater) === null || _action_updater === void 0 ? void 0 : _action_updater.call(action, data)
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
                    var _action_selectedKeys;
                    selectedKeys = (_action_selectedKeys = action.selectedKeys) !== null && _action_selectedKeys !== void 0 ? _action_selectedKeys : data.selectedKeys;
                    var _action_filterText1, _action_items, _action_sortDescriptor1;
                    return {
                        ...data,
                        filterText: (_action_filterText1 = action.filterText) !== null && _action_filterText1 !== void 0 ? _action_filterText1 : data.filterText,
                        state: 'idle',
                        items: [
                            ...(_action_items = action.items) !== null && _action_items !== void 0 ? _action_items : []
                        ],
                        selectedKeys: selectedKeys === 'all' ? 'all' : new Set(selectedKeys),
                        sortDescriptor: (_action_sortDescriptor1 = action.sortDescriptor) !== null && _action_sortDescriptor1 !== void 0 ? _action_sortDescriptor1 : data.sortDescriptor,
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
                    var // We're already loading, and another load was triggered at the same time.
                    // We need to abort the previous load and start a new one.
                    _data_abortController;
                    (_data_abortController = data.abortController) === null || _data_abortController === void 0 ? void 0 : _data_abortController.abort('aborting current load and starting new one');
                    var _action_filterText2;
                    return {
                        ...data,
                        filterText: (_action_filterText2 = action.filterText) !== null && _action_filterText2 !== void 0 ? _action_filterText2 : data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        abortController: action.abortController
                    };
                case 'update':
                    var _action_updater1;
                    // We're already loading, and an update happened at the same time (e.g. selectedKey changed).
                    // Update data but don't abort previous load.
                    return {
                        ...data,
                        ...(_action_updater1 = action.updater) === null || _action_updater1 === void 0 ? void 0 : _action_updater1.call(action, data)
                    };
                default:
                    throw new Error(`Invalid action "${action.type}" in state "${data.state}"`);
            }
        case 'loadingMore':
            switch(action.type){
                case 'success':
                    var _action_selectedKeys1;
                    selectedKeys = data.selectedKeys === 'all' || action.selectedKeys === 'all' ? 'all' : new Set([
                        ...data.selectedKeys,
                        ...(_action_selectedKeys1 = action.selectedKeys) !== null && _action_selectedKeys1 !== void 0 ? _action_selectedKeys1 : []
                    ]);
                    var _action_items1, _action_sortDescriptor2;
                    // Append the new items
                    return {
                        ...data,
                        state: 'idle',
                        items: [
                            ...data.items,
                            ...(_action_items1 = action.items) !== null && _action_items1 !== void 0 ? _action_items1 : []
                        ],
                        selectedKeys: selectedKeys,
                        sortDescriptor: (_action_sortDescriptor2 = action.sortDescriptor) !== null && _action_sortDescriptor2 !== void 0 ? _action_sortDescriptor2 : data.sortDescriptor,
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
                    var // We're already loading more, and another load was triggered at the same time.
                    // We need to abort the previous load more and start a new one.
                    _data_abortController1;
                    (_data_abortController1 = data.abortController) === null || _data_abortController1 === void 0 ? void 0 : _data_abortController1.abort();
                    var _action_filterText3;
                    return {
                        ...data,
                        filterText: (_action_filterText3 = action.filterText) !== null && _action_filterText3 !== void 0 ? _action_filterText3 : data.filterText,
                        state: action.type,
                        // Reset items to an empty list if loading, but not when sorting.
                        items: action.type === 'loading' ? [] : data.items,
                        abortController: action.abortController
                    };
                case 'loadingMore':
                    var // If already loading more and another loading more is triggered, abort the new load more since
                    // it is a duplicate request since the cursor hasn't been updated.
                    // Do not overwrite the data.abortController
                    _action_abortController;
                    (_action_abortController = action.abortController) === null || _action_abortController === void 0 ? void 0 : _action_abortController.abort();
                    return data;
                case 'update':
                    var _action_updater2;
                    // We're already loading, and an update happened at the same time (e.g. selectedKey changed).
                    // Update data but don't abort previous load.
                    return {
                        ...data,
                        ...(_action_updater2 = action.updater) === null || _action_updater2 === void 0 ? void 0 : _action_updater2.call(action, data)
                    };
                default:
                    throw new Error(`Invalid action "${action.type}" in state "${data.state}"`);
            }
        default:
            throw new Error(`Invalid state "${data.state}"`);
    }
}
function $ea3e5f1954bb0c9f$export$bc3384a35de93d66(options) {
    const { load: load, sort: sort, initialSelectedKeys: initialSelectedKeys, initialSortDescriptor: initialSortDescriptor, getKey: getKey = (item)=>item.id || item.key, initialFilterText: initialFilterText = '' } = options;
    let [data, dispatch] = (0, $lJhEB$useReducer)($ea3e5f1954bb0c9f$var$reducer, {
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
            var _action_filterText;
            let previousFilterText = (_action_filterText = action.filterText) !== null && _action_filterText !== void 0 ? _action_filterText : data.filterText;
            var _action_sortDescriptor;
            let response = await fn({
                items: data.items.slice(),
                selectedKeys: data.selectedKeys,
                sortDescriptor: (_action_sortDescriptor = action.sortDescriptor) !== null && _action_sortDescriptor !== void 0 ? _action_sortDescriptor : data.sortDescriptor,
                signal: abortController.signal,
                cursor: action.type === 'loadingMore' ? data.cursor : undefined,
                filterText: previousFilterText,
                loadingState: data.state
            });
            var _response_filterText;
            let filterText = (_response_filterText = response.filterText) !== null && _response_filterText !== void 0 ? _response_filterText : previousFilterText;
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
    let didDispatchInitialFetch = (0, $lJhEB$useRef)(false);
    (0, $lJhEB$useEffect)(()=>{
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
        ...(0, $edd711f2f244e14b$export$79c0c687a5963b0a)({
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


export {$ea3e5f1954bb0c9f$export$bc3384a35de93d66 as useAsyncList};
//# sourceMappingURL=useAsyncList.js.map
