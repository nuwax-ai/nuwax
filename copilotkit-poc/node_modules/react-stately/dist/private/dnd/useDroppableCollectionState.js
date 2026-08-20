import {useState as $hXDt9$useState, useRef as $hXDt9$useRef, useCallback as $hXDt9$useCallback} from "react";

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
function $3271431a686e5d3c$export$926850f6ecef79d0(props) {
    let { acceptedDragTypes: acceptedDragTypes = 'all', isDisabled: isDisabled, onInsert: onInsert, onRootDrop: onRootDrop, onItemDrop: onItemDrop, onReorder: onReorder, onMove: onMove, shouldAcceptItemDrop: shouldAcceptItemDrop, collection: collection, selectionManager: selectionManager, onDropEnter: onDropEnter, getDropOperation: getDropOperation, onDrop: onDrop } = props;
    let [target, setTarget] = (0, $hXDt9$useState)(null);
    let targetRef = (0, $hXDt9$useRef)(null);
    let getOppositeTarget = (target)=>{
        if (target.dropPosition === 'before') {
            let node = collection.getItem(target.key);
            return node && node.prevKey != null ? {
                type: 'item',
                key: node.prevKey,
                dropPosition: 'after'
            } : null;
        } else if (target.dropPosition === 'after') {
            let node = collection.getItem(target.key);
            return node && node.nextKey != null ? {
                type: 'item',
                key: node.nextKey,
                dropPosition: 'before'
            } : null;
        }
        return null;
    };
    let defaultGetDropOperation = (0, $hXDt9$useCallback)((e)=>{
        let { target: target, types: types, allowedOperations: allowedOperations, isInternal: isInternal, draggingKeys: draggingKeys } = e;
        if (isDisabled || !target) return 'cancel';
        if (acceptedDragTypes === 'all' || acceptedDragTypes.some((type)=>types.has(type))) {
            let isValidInsert = onInsert && target.type === 'item' && !isInternal && (target.dropPosition === 'before' || target.dropPosition === 'after');
            let isValidReorder = onReorder && target.type === 'item' && isInternal && (target.dropPosition === 'before' || target.dropPosition === 'after') && $3271431a686e5d3c$var$isDraggingWithinParent(collection, target, draggingKeys);
            let isItemDropAllowed = target.type !== 'item' || target.dropPosition !== 'on' || !shouldAcceptItemDrop || shouldAcceptItemDrop(target, types);
            let isValidMove = onMove && target.type === 'item' && isInternal && isItemDropAllowed;
            // Feedback was that internal root drop was weird so preventing that from happening
            let isValidRootDrop = onRootDrop && target.type === 'root' && !isInternal;
            // Automatically prevent items (i.e. folders) from being dropped on themselves.
            let isValidOnItemDrop = onItemDrop && target.type === 'item' && target.dropPosition === 'on' && !(isInternal && target.key != null && draggingKeys.has(target.key)) && isItemDropAllowed;
            if (onDrop || isValidInsert || isValidReorder || isValidMove || isValidRootDrop || isValidOnItemDrop) {
                if (getDropOperation) return getDropOperation(target, types, allowedOperations);
                else return allowedOperations[0];
            }
        }
        return 'cancel';
    }, [
        isDisabled,
        collection,
        acceptedDragTypes,
        getDropOperation,
        onInsert,
        onRootDrop,
        onItemDrop,
        shouldAcceptItemDrop,
        onReorder,
        onMove,
        onDrop
    ]);
    return {
        collection: collection,
        selectionManager: selectionManager,
        isDisabled: isDisabled,
        target: target,
        setTarget (newTarget) {
            if (this.isDropTarget(newTarget)) return;
            let target = targetRef.current;
            if (target && typeof props.onDropExit === 'function') props.onDropExit({
                type: 'dropexit',
                x: 0,
                y: 0,
                target: target
            });
            if (newTarget && typeof onDropEnter === 'function') onDropEnter({
                type: 'dropenter',
                x: 0,
                y: 0,
                target: newTarget
            });
            targetRef.current = newTarget !== null && newTarget !== void 0 ? newTarget : null;
            setTarget(newTarget !== null && newTarget !== void 0 ? newTarget : null);
        },
        isDropTarget (dropTarget) {
            let target = targetRef.current;
            if (!target || !dropTarget) return false;
            if ($3271431a686e5d3c$var$isEqualDropTarget(dropTarget, target)) return true;
            // Check if the targets point at the same point between two items, one referring before, and the other after.
            if ((dropTarget === null || dropTarget === void 0 ? void 0 : dropTarget.type) === 'item' && (target === null || target === void 0 ? void 0 : target.type) === 'item' && dropTarget.key !== target.key && dropTarget.dropPosition !== target.dropPosition && dropTarget.dropPosition !== 'on' && target.dropPosition !== 'on') return $3271431a686e5d3c$var$isEqualDropTarget(getOppositeTarget(dropTarget), target) || $3271431a686e5d3c$var$isEqualDropTarget(dropTarget, getOppositeTarget(target));
            return false;
        },
        getDropOperation (e) {
            let { target: target, isInternal: isInternal, draggingKeys: draggingKeys } = e;
            // Prevent dropping items onto themselves or their descendants
            if (isInternal && target.type === 'item' && draggingKeys.size > 0) {
                if (draggingKeys.has(target.key) && target.dropPosition === 'on') return 'cancel';
                let currentKey = target.key;
                while(currentKey != null){
                    let item = collection.getItem(currentKey);
                    let parentKey = item === null || item === void 0 ? void 0 : item.parentKey;
                    if (parentKey != null && draggingKeys.has(parentKey)) return 'cancel';
                    currentKey = parentKey !== null && parentKey !== void 0 ? parentKey : null;
                }
            }
            return defaultGetDropOperation(e);
        }
    };
}
function $3271431a686e5d3c$var$isEqualDropTarget(a, b) {
    if (!a) return !b;
    switch(a.type){
        case 'root':
            return (b === null || b === void 0 ? void 0 : b.type) === 'root';
        case 'item':
            return (b === null || b === void 0 ? void 0 : b.type) === 'item' && (b === null || b === void 0 ? void 0 : b.key) === a.key && (b === null || b === void 0 ? void 0 : b.dropPosition) === a.dropPosition;
    }
}
function $3271431a686e5d3c$var$isDraggingWithinParent(collection, target, draggingKeys) {
    let targetNode = collection.getItem(target.key);
    for (let key of draggingKeys){
        let node = collection.getItem(key);
        if ((node === null || node === void 0 ? void 0 : node.parentKey) !== (targetNode === null || targetNode === void 0 ? void 0 : targetNode.parentKey)) return false;
    }
    return true;
}


export {$3271431a686e5d3c$export$926850f6ecef79d0 as useDroppableCollectionState};
//# sourceMappingURL=useDroppableCollectionState.js.map
