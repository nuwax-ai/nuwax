var $fdd8ee0c4512c304$exports = require("./ListCollection.cjs");
var $0af3d14a0ed99bae$exports = require("../selection/useMultipleSelectionState.cjs");
var $b9a23b9997e48a30$exports = require("../selection/SelectionManager.cjs");
var $346711202f17eab5$exports = require("../collections/useCollection.cjs");
var $aSOpA$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useListState", function () { return $359c8238bb510d61$export$2f645645f7bca764; });
$parcel$export(module.exports, "UNSTABLE_useFilteredListState", function () { return $359c8238bb510d61$export$ba9d38c0f1bf2b36; });
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




function $359c8238bb510d61$export$2f645645f7bca764(props) {
    let { filter: filter, layoutDelegate: layoutDelegate } = props;
    let selectionState = (0, $0af3d14a0ed99bae$exports.useMultipleSelectionState)(props);
    let disabledKeys = (0, $aSOpA$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let factory = (0, $aSOpA$react.useCallback)((nodes)=>filter ? new (0, $fdd8ee0c4512c304$exports.ListCollection)(filter(nodes)) : new (0, $fdd8ee0c4512c304$exports.ListCollection)(nodes), [
        filter
    ]);
    let context = (0, $aSOpA$react.useMemo)(()=>({
            suppressTextValueWarning: props.suppressTextValueWarning
        }), [
        props.suppressTextValueWarning
    ]);
    let collection = (0, $346711202f17eab5$exports.useCollection)(props, factory, context);
    let selectionManager = (0, $aSOpA$react.useMemo)(()=>new (0, $b9a23b9997e48a30$exports.SelectionManager)(collection, selectionState, {
            layoutDelegate: layoutDelegate
        }), [
        collection,
        selectionState,
        layoutDelegate
    ]);
    $359c8238bb510d61$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager
    };
}
function $359c8238bb510d61$export$ba9d38c0f1bf2b36(state, filterFn) {
    let collection = (0, $aSOpA$react.useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
        state.collection,
        filterFn
    ]);
    let selectionManager = state.selectionManager.withCollection(collection);
    $359c8238bb510d61$var$useFocusedKeyReset(collection, selectionManager);
    return {
        collection: collection,
        selectionManager: selectionManager,
        disabledKeys: state.disabledKeys
    };
}
function $359c8238bb510d61$var$useFocusedKeyReset(collection, selectionManager) {
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $aSOpA$react.useRef)(null);
    (0, $aSOpA$react.useEffect)(()=>{
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


//# sourceMappingURL=useListState.cjs.map
