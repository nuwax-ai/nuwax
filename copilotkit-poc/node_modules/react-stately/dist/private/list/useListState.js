import {ListCollection as $d86244240b54e5e4$export$d085fb9e920b5ca7} from "./ListCollection.js";
import {useMultipleSelectionState as $8696e7d7c3c9007a$export$253fe78d46329472} from "../selection/useMultipleSelectionState.js";
import {SelectionManager as $60fcbaf037242b1f$export$6c8a5aaad13c9852} from "../selection/SelectionManager.js";
import {useCollection as $70601b00a8062b25$export$6cd28814d92fa9c9} from "../collections/useCollection.js";
import {useMemo as $8NGOf$useMemo, useCallback as $8NGOf$useCallback, useRef as $8NGOf$useRef, useEffect as $8NGOf$useEffect} from "react";

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




function $9148925efdde78ec$export$2f645645f7bca764(props) {
    let { filter: filter, layoutDelegate: layoutDelegate } = props;
    let selectionState = (0, $8696e7d7c3c9007a$export$253fe78d46329472)(props);
    let disabledKeys = (0, $8NGOf$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let factory = (0, $8NGOf$useCallback)((nodes)=>filter ? new (0, $d86244240b54e5e4$export$d085fb9e920b5ca7)(filter(nodes)) : new (0, $d86244240b54e5e4$export$d085fb9e920b5ca7)(nodes), [
        filter
    ]);
    let context = (0, $8NGOf$useMemo)(()=>({
            suppressTextValueWarning: props.suppressTextValueWarning
        }), [
        props.suppressTextValueWarning
    ]);
    let collection = (0, $70601b00a8062b25$export$6cd28814d92fa9c9)(props, factory, context);
    let selectionManager = (0, $8NGOf$useMemo)(()=>new (0, $60fcbaf037242b1f$export$6c8a5aaad13c9852)(collection, selectionState, {
            layoutDelegate: layoutDelegate
        }), [
        collection,
        selectionState,
        layoutDelegate
    ]);
    $9148925efdde78ec$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager
    };
}
function $9148925efdde78ec$export$ba9d38c0f1bf2b36(state, filterFn) {
    let collection = (0, $8NGOf$useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
        state.collection,
        filterFn
    ]);
    let selectionManager = state.selectionManager.withCollection(collection);
    $9148925efdde78ec$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        selectionManager: selectionManager,
        disabledKeys: state.disabledKeys
    };
}
function $9148925efdde78ec$var$useFocusedKeyReset(collection, selectionManager) {
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $8NGOf$useRef)(null);
    (0, $8NGOf$useEffect)(()=>{
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


export {$9148925efdde78ec$export$2f645645f7bca764 as useListState, $9148925efdde78ec$export$ba9d38c0f1bf2b36 as UNSTABLE_useFilteredListState};
//# sourceMappingURL=useListState.js.map
