import {useState as $3Jrml$useState, useMemo as $3Jrml$useMemo} from "react";

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
function $232f8dea1b0a4f2f$export$762f73dccccd255d(options) {
    let { initialItems: initialItems = [], initialSelectedKeys: initialSelectedKeys, getKey: getKey = (item)=>item.id ?? item.key, filter: filter, initialFilterText: initialFilterText = '' } = options;
    // Store both items and filteredItems in state so we can go back to the unfiltered list
    let [state, setState] = (0, $3Jrml$useState)({
        items: initialItems,
        selectedKeys: initialSelectedKeys === 'all' ? 'all' : new Set(initialSelectedKeys || []),
        filterText: initialFilterText
    });
    let filteredItems = (0, $3Jrml$useMemo)(()=>filter ? state.items.filter((item)=>filter(item, state.filterText)) : state.items, [
        state.items,
        state.filterText,
        filter
    ]);
    return {
        ...state,
        items: filteredItems,
        ...$232f8dea1b0a4f2f$export$79c0c687a5963b0a({
            getKey: getKey
        }, setState),
        getItem (key) {
            return state.items.find((item)=>getKey(item) === key);
        }
    };
}
function $232f8dea1b0a4f2f$export$79c0c687a5963b0a(opts, dispatch) {
    let { cursor: cursor, getKey: getKey } = opts;
    return {
        setSelectedKeys (selectedKeys) {
            dispatch((state)=>({
                    ...state,
                    selectedKeys: selectedKeys
                }));
        },
        addKeysToSelection (selectedKeys) {
            dispatch((state)=>{
                if (state.selectedKeys === 'all') return state;
                if (selectedKeys === 'all') return {
                    ...state,
                    selectedKeys: 'all'
                };
                return {
                    ...state,
                    selectedKeys: new Set([
                        ...state.selectedKeys,
                        ...selectedKeys
                    ])
                };
            });
        },
        removeKeysFromSelection (selectedKeys) {
            dispatch((state)=>{
                if (selectedKeys === 'all') return {
                    ...state,
                    selectedKeys: new Set()
                };
                let selection = state.selectedKeys === 'all' ? new Set(state.items.map(getKey)) : new Set(state.selectedKeys);
                for (let key of selectedKeys)selection.delete(key);
                return {
                    ...state,
                    selectedKeys: selection
                };
            });
        },
        setFilterText (filterText) {
            dispatch((state)=>({
                    ...state,
                    filterText: filterText
                }));
        },
        insert (index, ...values) {
            dispatch((state)=>$232f8dea1b0a4f2f$var$insert(state, index, ...values));
        },
        insertBefore (key, ...values) {
            dispatch((state)=>{
                let index = state.items.findIndex((item)=>getKey?.(item) === key);
                if (index === -1) {
                    if (state.items.length === 0) index = 0;
                    else return state;
                }
                return $232f8dea1b0a4f2f$var$insert(state, index, ...values);
            });
        },
        insertAfter (key, ...values) {
            dispatch((state)=>{
                let index = state.items.findIndex((item)=>getKey?.(item) === key);
                if (index === -1) {
                    if (state.items.length === 0) index = 0;
                    else return state;
                }
                return $232f8dea1b0a4f2f$var$insert(state, index + 1, ...values);
            });
        },
        prepend (...values) {
            dispatch((state)=>$232f8dea1b0a4f2f$var$insert(state, 0, ...values));
        },
        append (...values) {
            dispatch((state)=>$232f8dea1b0a4f2f$var$insert(state, state.items.length, ...values));
        },
        remove (...keys) {
            dispatch((state)=>{
                let keySet = new Set(keys);
                let items = state.items.filter((item)=>!keySet.has(getKey(item)));
                let selection = 'all';
                if (state.selectedKeys !== 'all') {
                    selection = new Set(state.selectedKeys);
                    for (let key of keys)selection.delete(key);
                }
                if (cursor == null && items.length === 0) selection = new Set();
                return {
                    ...state,
                    items: items,
                    selectedKeys: selection
                };
            });
        },
        removeSelectedItems () {
            dispatch((state)=>{
                if (state.selectedKeys === 'all') return {
                    ...state,
                    items: [],
                    selectedKeys: new Set()
                };
                let selectedKeys = state.selectedKeys;
                let items = state.items.filter((item)=>!selectedKeys.has(getKey(item)));
                return {
                    ...state,
                    items: items,
                    selectedKeys: new Set()
                };
            });
        },
        move (key, toIndex) {
            dispatch((state)=>{
                let index = state.items.findIndex((item)=>getKey(item) === key);
                if (index === -1) return state;
                let copy = state.items.slice();
                let [item] = copy.splice(index, 1);
                copy.splice(toIndex, 0, item);
                return {
                    ...state,
                    items: copy
                };
            });
        },
        moveBefore (key, keys) {
            dispatch((state)=>{
                let toIndex = state.items.findIndex((item)=>getKey(item) === key);
                if (toIndex === -1) return state;
                // Find indices of keys to move. Sort them so that the order in the list is retained.
                let keyArray = Array.isArray(keys) ? keys : [
                    ...keys
                ];
                let indices = keyArray.map((key)=>state.items.findIndex((item)=>getKey(item) === key)).sort((a, b)=>a - b);
                return $232f8dea1b0a4f2f$var$move(state, indices, toIndex);
            });
        },
        moveAfter (key, keys) {
            dispatch((state)=>{
                let toIndex = state.items.findIndex((item)=>getKey(item) === key);
                if (toIndex === -1) return state;
                let keyArray = Array.isArray(keys) ? keys : [
                    ...keys
                ];
                let indices = keyArray.map((key)=>state.items.findIndex((item)=>getKey(item) === key)).sort((a, b)=>a - b);
                return $232f8dea1b0a4f2f$var$move(state, indices, toIndex + 1);
            });
        },
        update (key, newValue) {
            dispatch((state)=>{
                let index = state.items.findIndex((item)=>getKey(item) === key);
                if (index === -1) return state;
                let updatedValue;
                if (typeof newValue === 'function') updatedValue = newValue(state.items[index]);
                else updatedValue = newValue;
                return {
                    ...state,
                    items: [
                        ...state.items.slice(0, index),
                        updatedValue,
                        ...state.items.slice(index + 1)
                    ]
                };
            });
        }
    };
}
function $232f8dea1b0a4f2f$var$insert(state, index, ...values) {
    return {
        ...state,
        items: [
            ...state.items.slice(0, index),
            ...values,
            ...state.items.slice(index)
        ]
    };
}
function $232f8dea1b0a4f2f$var$move(state, indices, toIndex) {
    // Shift the target down by the number of items being moved from before the target
    toIndex -= indices.filter((index)=>index < toIndex).length;
    let moves = indices.map((from)=>({
            from: from,
            to: toIndex++
        }));
    // Shift later from indices down if they have a larger index
    for(let i = 0; i < moves.length; i++){
        let a = moves[i].from;
        for(let j = i; j < moves.length; j++){
            let b = moves[j].from;
            if (b > a) moves[j].from--;
        }
    }
    // Interleave the moves so they can be applied one by one rather than all at once
    for(let i = 0; i < moves.length; i++){
        let a = moves[i];
        for(let j = moves.length - 1; j > i; j--){
            let b = moves[j];
            if (b.from < a.to) a.to++;
            else b.from++;
        }
    }
    let copy = state.items.slice();
    for (let move of moves){
        let [item] = copy.splice(move.from, 1);
        copy.splice(move.to, 0, item);
    }
    return {
        ...state,
        items: copy
    };
}


export {$232f8dea1b0a4f2f$export$762f73dccccd255d as useListData, $232f8dea1b0a4f2f$export$79c0c687a5963b0a as createListActions};
//# sourceMappingURL=useListData.mjs.map
