import {useState as $16cpX$useState, useRef as $16cpX$useRef} from "react";

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
function $b2d15a2f12e80349$export$29efd034f1d79f81(props) {
    let { getItems: getItems, isDisabled: isDisabled, collection: collection, selectionManager: selectionManager, onDragStart: onDragStart, onDragMove: onDragMove, onDragEnd: onDragEnd, preview: preview, getAllowedDropOperations: getAllowedDropOperations } = props;
    let [, setDragging] = (0, $16cpX$useState)(false);
    let draggingKeys = (0, $16cpX$useRef)(new Set());
    let draggedKey = (0, $16cpX$useRef)(null);
    let getKeys = (key)=>{
        // The clicked item is always added to the drag. If it is selected, then all of the
        // other selected items are also dragged. If it is not selected, then only the clicked
        // item is dragged. This matches native macOS behavior.
        // Additionally, we filter out any keys that are children of any of the other selected keys
        let keys = new Set();
        if (selectionManager.isSelected(key)) for (let currentKey of selectionManager.selectedKeys){
            let node = collection.getItem(currentKey);
            if (node) {
                let isChild = false;
                let parentKey = node.parentKey;
                while(parentKey != null){
                    // eslint-disable-next-line max-depth
                    if (selectionManager.selectedKeys.has(parentKey)) {
                        isChild = true;
                        break;
                    }
                    let parentNode = collection.getItem(parentKey);
                    parentKey = parentNode ? parentNode.parentKey : null;
                }
                if (!isChild) keys.add(currentKey);
            }
        }
        else keys.add(key);
        return keys;
    };
    return {
        collection: collection,
        selectionManager: selectionManager,
        get draggedKey () {
            return draggedKey.current;
        },
        get draggingKeys () {
            return draggingKeys.current;
        },
        isDragging (key) {
            return draggingKeys.current.has(key);
        },
        getKeysForDrag: getKeys,
        getItems (key) {
            let keys = getKeys(key);
            let items = [];
            for (let key of keys){
                let value = collection.getItem(key)?.value;
                if (value != null) items.push(value);
            }
            return getItems(getKeys(key), items);
        },
        isDisabled: isDisabled,
        preview: preview,
        getAllowedDropOperations: getAllowedDropOperations,
        startDrag (key, event) {
            let keys = getKeys(key);
            draggingKeys.current = keys;
            draggedKey.current = key;
            selectionManager.setFocused(false);
            setDragging(true);
            if (typeof onDragStart === 'function') onDragStart({
                ...event,
                keys: keys
            });
        },
        moveDrag (event) {
            if (typeof onDragMove === 'function') onDragMove({
                ...event,
                keys: draggingKeys.current
            });
        },
        endDrag (event) {
            let { isInternal: isInternal } = event;
            if (typeof onDragEnd === 'function') onDragEnd({
                ...event,
                keys: draggingKeys.current,
                isInternal: isInternal
            });
            draggingKeys.current = new Set();
            draggedKey.current = null;
            setDragging(false);
        }
    };
}


export {$b2d15a2f12e80349$export$29efd034f1d79f81 as useDraggableCollectionState};
//# sourceMappingURL=useDraggableCollectionState.mjs.map
