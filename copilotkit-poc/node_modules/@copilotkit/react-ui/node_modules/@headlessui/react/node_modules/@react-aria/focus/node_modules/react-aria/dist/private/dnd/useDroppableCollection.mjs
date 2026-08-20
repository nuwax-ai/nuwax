import {clearGlobalDnDState as $d40e85a29b831dd6$export$70936501603e6c57, DIRECTORY_DRAG_TYPE as $d40e85a29b831dd6$export$990fced5dfac2637, droppableCollectionMap as $d40e85a29b831dd6$export$dfdf5deeaf27473f, getTypes as $d40e85a29b831dd6$export$e1d41611756c6326, globalDndState as $d40e85a29b831dd6$export$6ca6700462636d0b, isInternalDropOperation as $d40e85a29b831dd6$export$78bf638634500fa5, setDropCollectionRef as $d40e85a29b831dd6$export$dac8db29d42db9a1} from "./utils.mjs";
import {registerDropTarget as $99f1ee31a7e95d0e$export$c28d9fb4a54e471a} from "./DragManager.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {navigate as $4ba715d4c7df8887$export$ff7962acd6052c28} from "./DropTargetKeyboardNavigation.mjs";
import {setInteractionModality as $8f5a2122b0992be3$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.mjs";
import {useAutoScroll as $aa7c06e7625d1455$export$6323452ca4533ed8} from "./useAutoScroll.mjs";
import {useDrop as $f302ef02e940a6f8$export$ccdee5eaf73cf661} from "./useDrop.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useRef as $7dnNz$useRef, useCallback as $7dnNz$useCallback, useEffect as $7dnNz$useEffect} from "react";

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










function $768d61f7ff22c01a$export$f4e2f423c21f7b04(props, state, ref) {
    let localState = (0, $7dnNz$useRef)({
        props: props,
        state: state,
        nextTarget: null,
        dropOperation: null
    }).current;
    localState.props = props;
    localState.state = state;
    let defaultOnDrop = (0, $7dnNz$useCallback)(async (e)=>{
        let { onInsert: onInsert, onRootDrop: onRootDrop, onItemDrop: onItemDrop, onReorder: onReorder, onMove: onMove, acceptedDragTypes: acceptedDragTypes = 'all', shouldAcceptItemDrop: shouldAcceptItemDrop } = localState.props;
        let { draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
        let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
        let { target: target, dropOperation: dropOperation, items: items } = e;
        let filteredItems = items;
        if (acceptedDragTypes !== 'all' || shouldAcceptItemDrop) filteredItems = items.filter((item)=>{
            let itemTypes;
            if (item.kind === 'directory') itemTypes = new Set([
                (0, $d40e85a29b831dd6$export$990fced5dfac2637)
            ]);
            else itemTypes = item.kind === 'file' ? new Set([
                item.type
            ]) : item.types;
            if (acceptedDragTypes === 'all' || acceptedDragTypes.some((type)=>itemTypes.has(type))) {
                // If we are performing a on item drop, check if the item in question accepts the dropped item since the item may have heavier restrictions
                // than the droppable collection itself
                if (target.type === 'item' && target.dropPosition === 'on' && shouldAcceptItemDrop) return shouldAcceptItemDrop(target, itemTypes);
                return true;
            }
            return false;
        });
        if (filteredItems.length > 0) {
            if (target.type === 'root' && onRootDrop) await onRootDrop({
                items: filteredItems,
                dropOperation: dropOperation
            });
            if (target.type === 'item') {
                if (target.dropPosition === 'on' && onItemDrop) await onItemDrop({
                    items: filteredItems,
                    dropOperation: dropOperation,
                    isInternal: isInternal,
                    target: target
                });
                if (onMove && isInternal) await onMove({
                    keys: draggingKeys,
                    dropOperation: dropOperation,
                    target: target
                });
                if (target.dropPosition !== 'on') {
                    if (!isInternal && onInsert) await onInsert({
                        items: filteredItems,
                        dropOperation: dropOperation,
                        target: target
                    });
                    if (isInternal && onReorder) await onReorder({
                        keys: draggingKeys,
                        dropOperation: dropOperation,
                        target: target
                    });
                }
            }
        }
    }, [
        localState,
        ref
    ]);
    let autoScroll = (0, $aa7c06e7625d1455$export$6323452ca4533ed8)(ref);
    let { dropProps: dropProps } = (0, $f302ef02e940a6f8$export$ccdee5eaf73cf661)({
        ref: ref,
        onDropEnter () {
            if (localState.nextTarget != null) state.setTarget(localState.nextTarget);
        },
        onDropMove (e) {
            if (localState.nextTarget != null) state.setTarget(localState.nextTarget);
            autoScroll.move(e.x, e.y);
        },
        getDropOperationForPoint (types, allowedOperations, x, y) {
            let { draggingKeys: draggingKeys, dropCollectionRef: dropCollectionRef } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
            let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
            let isValidDropTarget = (target)=>state.getDropOperation({
                    target: target,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                }) !== 'cancel';
            let target = props.dropTargetDelegate.getDropTargetFromPoint(x, y, isValidDropTarget);
            if (!target) {
                localState.dropOperation = 'cancel';
                localState.nextTarget = null;
                return 'cancel';
            }
            localState.dropOperation = state.getDropOperation({
                target: target,
                types: types,
                allowedOperations: allowedOperations,
                isInternal: isInternal,
                draggingKeys: draggingKeys
            });
            // If the target doesn't accept the drop, see if the root accepts it instead.
            if (localState.dropOperation === 'cancel') {
                let rootTarget = {
                    type: 'root'
                };
                let dropOperation = state.getDropOperation({
                    target: rootTarget,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
                if (dropOperation !== 'cancel') {
                    target = rootTarget;
                    localState.dropOperation = dropOperation;
                }
            }
            // Only set dropCollectionRef if there is a valid drop target since we cleanup dropCollectionRef in onDropExit
            // which only runs when leaving a valid drop target or if the dropEffect become none (mouse dnd only).
            if (target && localState.dropOperation !== 'cancel' && ref?.current !== dropCollectionRef?.current) (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(ref);
            localState.nextTarget = localState.dropOperation === 'cancel' ? null : target;
            return localState.dropOperation;
        },
        onDropExit () {
            (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(undefined);
            state.setTarget(null);
            autoScroll.stop();
        },
        onDropActivate (e) {
            if (state.target?.type === 'item' && typeof props.onDropActivate === 'function') props.onDropActivate({
                type: 'dropactivate',
                x: e.x,
                y: e.y,
                target: state.target
            });
        },
        onDrop (e) {
            (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(ref);
            if (state.target) onDrop(e, state.target);
            // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
            // RSP collection and thus we don't need to preserve the global DnD state for onDragEnd
            let { draggingCollectionRef: draggingCollectionRef } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
            if (draggingCollectionRef == null) (0, $d40e85a29b831dd6$export$70936501603e6c57)();
        }
    });
    let droppingState = (0, $7dnNz$useRef)(null);
    let updateFocusAfterDrop = (0, $7dnNz$useCallback)(()=>{
        let { state: state } = localState;
        if (droppingState.current) {
            let { target: target, collection: prevCollection, selectedKeys: prevSelectedKeys, focusedKey: prevFocusedKey, isInternal: isInternal, draggingKeys: draggingKeys } = droppingState.current;
            // If an insert occurs during a drop, we want to immediately select these items to give
            // feedback to the user that a drop occurred. Only do this if the selection didn't change
            // since the drop started so we don't override if the user or application did something.
            if (state.collection.size > prevCollection.size && state.selectionManager.isSelectionEqual(prevSelectedKeys)) {
                let newKeys = new Set();
                let key = state.collection.getFirstKey();
                while(key != null){
                    let item = state.collection.getItem(key);
                    if (item?.type === 'item' && !prevCollection.getItem(item.key)) newKeys.add(item.key);
                    if (item?.hasChildNodes && state.collection.getItem(item.lastChildKey)?.type === 'item') key = item.firstChildKey;
                    else key = state.collection.getKeyAfter(key);
                }
                state.selectionManager.setSelectedKeys(newKeys);
                // If the focused item didn't change since the drop occurred, also focus the first
                // inserted item. If selection is disabled, then also show the focus ring so there
                // is some indication that items were added.
                if (state.selectionManager.focusedKey === prevFocusedKey) {
                    let first = newKeys.keys().next().value;
                    if (first != null) {
                        let item = state.collection.getItem(first);
                        let dropTarget = droppingState.current.target;
                        let isParentRowExpanded = state.collection['expandedKeys'] ? state.collection['expandedKeys'].has(item?.parentKey) : false;
                        // If this is a cell, focus the parent row.
                        // eslint-disable-next-line max-depth
                        if (item && (item?.type === 'cell' || dropTarget.type === 'item' && dropTarget.dropPosition === 'on' && !isParentRowExpanded)) first = item.parentKey;
                        // eslint-disable-next-line max-depth
                        if (first != null) state.selectionManager.setFocusedKey(first);
                        // eslint-disable-next-line max-depth
                        if (state.selectionManager.selectionMode === 'none') (0, $8f5a2122b0992be3$export$8397ddfc504fdb9a)('keyboard');
                    }
                }
            } else if (prevFocusedKey != null && state.selectionManager.focusedKey === prevFocusedKey && isInternal && target.type === 'item' && target.dropPosition !== 'on' && draggingKeys.has(state.collection.getItem(prevFocusedKey)?.parentKey)) {
                // Focus row instead of cell when reordering.
                state.selectionManager.setFocusedKey(state.collection.getItem(prevFocusedKey)?.parentKey ?? null);
                (0, $8f5a2122b0992be3$export$8397ddfc504fdb9a)('keyboard');
            } else if (state.selectionManager.focusedKey === prevFocusedKey && target.type === 'item' && target.dropPosition === 'on' && state.collection.getItem(target.key) != null) {
                // If focus didn't move already (e.g. due to an insert), and the user dropped on an item,
                // focus that item and show the focus ring to give the user feedback that the drop occurred.
                // Also show the focus ring if the focused key is not selected, e.g. in case of a reorder.
                state.selectionManager.setFocusedKey(target.key);
                (0, $8f5a2122b0992be3$export$8397ddfc504fdb9a)('keyboard');
            } else if (state.selectionManager.focusedKey != null && !state.selectionManager.isSelected(state.selectionManager.focusedKey)) (0, $8f5a2122b0992be3$export$8397ddfc504fdb9a)('keyboard');
            state.selectionManager.setFocused(true);
        }
    }, [
        localState
    ]);
    let onDrop = (0, $7dnNz$useCallback)((e, target)=>{
        let { state: state } = localState;
        // Save some state of the collection/selection before the drop occurs so we can compare later.
        droppingState.current = {
            timeout: undefined,
            focusedKey: state.selectionManager.focusedKey,
            collection: state.collection,
            selectedKeys: state.selectionManager.selectedKeys,
            draggingKeys: (0, $d40e85a29b831dd6$export$6ca6700462636d0b).draggingKeys,
            isInternal: (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref),
            target: target
        };
        let onDropFn = localState.props.onDrop || defaultOnDrop;
        onDropFn({
            type: 'drop',
            x: e.x,
            y: e.y,
            target: target,
            items: e.items,
            dropOperation: e.dropOperation
        });
        // Wait for a short time period after the onDrop is called to allow the data to be read asynchronously
        // and for React to re-render. If the collection didn't already change during this time (handled below),
        // update the focused key here.
        droppingState.current.timeout = setTimeout(()=>{
            updateFocusAfterDrop();
            droppingState.current = null;
        }, 50);
    }, [
        localState,
        defaultOnDrop,
        ref,
        updateFocusAfterDrop
    ]);
    (0, $7dnNz$useEffect)(()=>{
        return ()=>{
            if (droppingState.current) clearTimeout(droppingState.current.timeout);
        };
    }, []);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        // If the collection changed after a drop, update the focused key.
        if (droppingState.current && state.collection !== droppingState.current.collection) updateFocusAfterDrop();
    });
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    (0, $7dnNz$useEffect)(()=>{
        if (!ref.current) return;
        let getNextTarget = (target, wrap = true, key = 'down')=>{
            return (0, $4ba715d4c7df8887$export$ff7962acd6052c28)(localState.props.keyboardDelegate, localState.state.collection, target, key, direction === 'rtl', wrap);
        };
        let getPreviousTarget = (target, wrap = true)=>{
            return getNextTarget(target, wrap, 'up');
        };
        let nextValidTarget = (target, types, allowedDropOperations, getNextTarget, wrap = true)=>{
            let seenRoot = 0;
            let operation;
            let { draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
            let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
            do {
                let nextTarget = getNextTarget(target, wrap);
                if (!nextTarget) return null;
                target = nextTarget;
                operation = localState.state.getDropOperation({
                    target: nextTarget,
                    types: types,
                    allowedOperations: allowedDropOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
                if (target.type === 'root') seenRoot++;
            }while (operation === 'cancel' && !localState.state.isDropTarget(target) && seenRoot < 2);
            if (operation === 'cancel') return null;
            return target;
        };
        return $99f1ee31a7e95d0e$export$c28d9fb4a54e471a({
            element: ref.current,
            preventFocusOnDrop: true,
            getDropOperation (types, allowedOperations) {
                if (localState.state.target) {
                    let { draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
                    let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
                    return localState.state.getDropOperation({
                        target: localState.state.target,
                        types: types,
                        allowedOperations: allowedOperations,
                        isInternal: isInternal,
                        draggingKeys: draggingKeys
                    });
                }
                // Check if any of the targets accept the drop.
                // TODO: should we have a faster way of doing this or e.g. for pagination?
                let target = nextValidTarget(null, types, allowedOperations, getNextTarget);
                return target ? 'move' : 'cancel';
            },
            onDropEnter (e, drag) {
                let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(drag.items);
                let selectionManager = localState.state.selectionManager;
                let target = null;
                // Update the drop collection ref tracker for useDroppableItem's getDropOperation isInternal check
                (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(ref);
                // When entering the droppable collection for the first time, the default drop target
                // is after the focused key.
                let key = selectionManager.focusedKey;
                let dropPosition = 'after';
                // If the focused key is a cell, get the parent item instead.
                // For now, we assume that individual cells cannot be dropped on.
                let item = key != null ? localState.state.collection.getItem(key) : null;
                if (item?.type === 'cell') key = item.parentKey;
                // If the focused item is also selected, the default drop target is after the last selected item.
                // But if the focused key is the first selected item, then default to before the first selected item.
                // This is to make reordering lists slightly easier. If you select top down, we assume you want to
                // move the items down. If you select bottom up, we assume you want to move the items up.
                if (key != null && selectionManager.isSelected(key)) {
                    if (selectionManager.selectedKeys.size > 1 && selectionManager.firstSelectedKey === key) dropPosition = 'before';
                    else key = selectionManager.lastSelectedKey;
                }
                if (key != null) {
                    target = {
                        type: 'item',
                        key: key,
                        dropPosition: dropPosition
                    };
                    let { draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
                    let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
                    // If the default target is not valid, find the next one that is.
                    if (localState.state.getDropOperation({
                        target: target,
                        types: types,
                        allowedOperations: drag.allowedDropOperations,
                        isInternal: isInternal,
                        draggingKeys: draggingKeys
                    }) === 'cancel') target = nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false) ?? nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false);
                }
                // If no focused key, then start from the root.
                if (!target) target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                localState.state.setTarget(target);
            },
            onDropExit () {
                (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(undefined);
                localState.state.setTarget(null);
            },
            onDropTargetEnter (target) {
                localState.state.setTarget(target);
            },
            onDropActivate (e, target) {
                if (target?.type === 'item' && target?.dropPosition === 'on' && typeof localState.props.onDropActivate === 'function') localState.props.onDropActivate({
                    type: 'dropactivate',
                    x: e.x,
                    y: e.y,
                    target: target
                });
            },
            onDrop (e, target) {
                (0, $d40e85a29b831dd6$export$dac8db29d42db9a1)(ref);
                if (localState.state.target) onDrop(e, target || localState.state.target);
            },
            onKeyDown (e, drag) {
                let { keyboardDelegate: keyboardDelegate } = localState.props;
                let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(drag.items);
                switch(e.key){
                    case 'ArrowDown':
                        if (keyboardDelegate.getKeyBelow) {
                            let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap)=>getNextTarget(target, wrap, 'down'));
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'ArrowUp':
                        if (keyboardDelegate.getKeyAbove) {
                            let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap)=>getNextTarget(target, wrap, 'up'));
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'ArrowLeft':
                        if (keyboardDelegate.getKeyLeftOf) {
                            let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap)=>getNextTarget(target, wrap, 'left'));
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'ArrowRight':
                        if (keyboardDelegate.getKeyRightOf) {
                            let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap)=>getNextTarget(target, wrap, 'right'));
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'Home':
                        if (keyboardDelegate.getFirstKey) {
                            let target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'End':
                        if (keyboardDelegate.getLastKey) {
                            let target = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
                            localState.state.setTarget(target);
                        }
                        break;
                    case 'PageDown':
                        if (keyboardDelegate.getKeyPageBelow) {
                            let target = localState.state.target;
                            if (!target) target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                            else {
                                // If on the root, go to the item a page below the top. Otherwise a page below the current item.
                                let targetKey = keyboardDelegate.getFirstKey?.();
                                if (target.type === 'item') targetKey = target.key;
                                let nextKey = null;
                                if (targetKey != null) nextKey = keyboardDelegate.getKeyPageBelow(targetKey);
                                let dropPosition = target.type === 'item' ? target.dropPosition : 'after';
                                // If there is no next key, or we are starting on the last key, jump to the last possible position.
                                if (nextKey == null || target.type === 'item' && target.key === keyboardDelegate.getLastKey?.()) {
                                    nextKey = keyboardDelegate.getLastKey?.() ?? null;
                                    dropPosition = 'after';
                                }
                                if (nextKey == null) break;
                                target = {
                                    type: 'item',
                                    key: nextKey,
                                    dropPosition: dropPosition
                                };
                                // If the target does not accept the drop, find the next valid target.
                                // If no next valid target, find the previous valid target.
                                let { draggingCollectionRef: draggingCollectionRef, draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
                                let isInternal = draggingCollectionRef?.current === ref?.current;
                                let operation = localState.state.getDropOperation({
                                    target: target,
                                    types: types,
                                    allowedOperations: drag.allowedDropOperations,
                                    isInternal: isInternal,
                                    draggingKeys: draggingKeys
                                });
                                if (operation === 'cancel') target = nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false) ?? nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false);
                            }
                            localState.state.setTarget(target ?? localState.state.target);
                        }
                        break;
                    case 'PageUp':
                        {
                            if (!keyboardDelegate.getKeyPageAbove) break;
                            let target = localState.state.target;
                            if (!target) target = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
                            else if (target.type === 'item') {
                                // If at the top already, switch to the root. Otherwise navigate a page up.
                                if (target.key === keyboardDelegate.getFirstKey?.()) target = {
                                    type: 'root'
                                };
                                else {
                                    let nextKey = keyboardDelegate.getKeyPageAbove(target.key);
                                    let dropPosition = target.dropPosition;
                                    if (nextKey == null) {
                                        nextKey = keyboardDelegate.getFirstKey?.();
                                        dropPosition = 'before';
                                    }
                                    if (nextKey == null) break;
                                    target = {
                                        type: 'item',
                                        key: nextKey,
                                        dropPosition: dropPosition
                                    };
                                }
                                // If the target does not accept the drop, find the previous valid target.
                                // If no next valid target, find the next valid target.
                                let { draggingKeys: draggingKeys } = (0, $d40e85a29b831dd6$export$6ca6700462636d0b);
                                let isInternal = (0, $d40e85a29b831dd6$export$78bf638634500fa5)(ref);
                                let operation = localState.state.getDropOperation({
                                    target: target,
                                    types: types,
                                    allowedOperations: drag.allowedDropOperations,
                                    isInternal: isInternal,
                                    draggingKeys: draggingKeys
                                });
                                if (operation === 'cancel') target = nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false) ?? nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false);
                            }
                            localState.state.setTarget(target ?? localState.state.target);
                            break;
                        }
                }
                localState.props.onKeyDown?.(e);
            }
        });
    }, [
        localState,
        ref,
        onDrop,
        direction
    ]);
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    (0, $d40e85a29b831dd6$export$dfdf5deeaf27473f).set(state, {
        id: id,
        ref: ref
    });
    return {
        collectionProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(dropProps, {
            id: id,
            // Remove description from collection element. If dropping on the entire collection,
            // there should be a drop indicator that has this description, so no need to double announce.
            'aria-describedby': null
        })
    };
}


export {$768d61f7ff22c01a$export$f4e2f423c21f7b04 as useDroppableCollection};
//# sourceMappingURL=useDroppableCollection.mjs.map
