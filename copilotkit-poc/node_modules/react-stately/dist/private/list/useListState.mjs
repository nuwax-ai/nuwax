import {ListCollection as $f664a81d022446b5$export$d085fb9e920b5ca7} from "./ListCollection.mjs";
import {useMultipleSelectionState as $60f19cefd567a3e4$export$253fe78d46329472} from "../selection/useMultipleSelectionState.mjs";
import {SelectionManager as $4a07ac835f260f78$export$6c8a5aaad13c9852} from "../selection/SelectionManager.mjs";
import {useCollection as $d03379b88399b8c5$export$6cd28814d92fa9c9} from "../collections/useCollection.mjs";
import {useMemo as $3yt54$useMemo, useCallback as $3yt54$useCallback, useRef as $3yt54$useRef, useEffect as $3yt54$useEffect} from "react";

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




function $b14b6f590b50af39$export$2f645645f7bca764(props) {
    let { filter: filter, layoutDelegate: layoutDelegate } = props;
    let selectionState = (0, $60f19cefd567a3e4$export$253fe78d46329472)(props);
    let disabledKeys = (0, $3yt54$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let factory = (0, $3yt54$useCallback)((nodes)=>filter ? new (0, $f664a81d022446b5$export$d085fb9e920b5ca7)(filter(nodes)) : new (0, $f664a81d022446b5$export$d085fb9e920b5ca7)(nodes), [
        filter
    ]);
    let context = (0, $3yt54$useMemo)(()=>({
            suppressTextValueWarning: props.suppressTextValueWarning
        }), [
        props.suppressTextValueWarning
    ]);
    let collection = (0, $d03379b88399b8c5$export$6cd28814d92fa9c9)(props, factory, context);
    let selectionManager = (0, $3yt54$useMemo)(()=>new (0, $4a07ac835f260f78$export$6c8a5aaad13c9852)(collection, selectionState, {
            layoutDelegate: layoutDelegate
        }), [
        collection,
        selectionState,
        layoutDelegate
    ]);
    $b14b6f590b50af39$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager
    };
}
function $b14b6f590b50af39$export$ba9d38c0f1bf2b36(state, filterFn) {
    let collection = (0, $3yt54$useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
        state.collection,
        filterFn
    ]);
    let selectionManager = state.selectionManager.withCollection(collection);
    $b14b6f590b50af39$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        selectionManager: selectionManager,
        disabledKeys: state.disabledKeys
    };
}
function $b14b6f590b50af39$var$useFocusedKeyReset(collection, selectionManager) {
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $3yt54$useRef)(null);
    (0, $3yt54$useEffect)(()=>{
        if (selectionManager.focusedKey != null && !collection.getItem(selectionManager.focusedKey) && cachedCollection.current) {
            // Walk forward in the old collection to find the next key that still exists in the new collection.
            let key = cachedCollection.current.getKeyAfter(selectionManager.focusedKey);
            let nextFocusedKey = null;
            while(key != null){
                let node = collection.getItem(key);
                if (node && node.type === 'item' && !selectionManager.isDisabled(key)) {
                    nextFocusedKey = key;
                    break;
                }
                key = cachedCollection.current.getKeyAfter(key);
            }
            // If no such key exists, walk backward.
            if (nextFocusedKey == null) {
                key = cachedCollection.current.getKeyBefore(selectionManager.focusedKey);
                while(key != null){
                    let node = collection.getItem(key);
                    if (node && node.type === 'item' && !selectionManager.isDisabled(key)) {
                        nextFocusedKey = key;
                        break;
                    }
                    key = cachedCollection.current.getKeyBefore(key);
                }
            }
            selectionManager.setFocusedKey(nextFocusedKey);
        }
        cachedCollection.current = collection;
    }, [
        collection,
        selectionManager
    ]);
}


export {$b14b6f590b50af39$export$2f645645f7bca764 as useListState, $b14b6f590b50af39$export$ba9d38c0f1bf2b36 as UNSTABLE_useFilteredListState};
//# sourceMappingURL=useListState.mjs.map
