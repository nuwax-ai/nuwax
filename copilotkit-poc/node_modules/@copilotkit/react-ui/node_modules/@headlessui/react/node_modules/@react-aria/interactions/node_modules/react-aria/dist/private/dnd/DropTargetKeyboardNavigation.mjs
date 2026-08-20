function $4ba715d4c7df8887$export$ff7962acd6052c28(keyboardDelegate, collection, target, direction, rtl = false, wrap = false) {
    switch(direction){
        case 'left':
            return rtl ? $4ba715d4c7df8887$var$nextDropTarget(keyboardDelegate, collection, target, wrap, 'left') : $4ba715d4c7df8887$var$previousDropTarget(keyboardDelegate, collection, target, wrap, 'left');
        case 'right':
            return rtl ? $4ba715d4c7df8887$var$previousDropTarget(keyboardDelegate, collection, target, wrap, 'right') : $4ba715d4c7df8887$var$nextDropTarget(keyboardDelegate, collection, target, wrap, 'right');
        case 'up':
            return $4ba715d4c7df8887$var$previousDropTarget(keyboardDelegate, collection, target, wrap);
        case 'down':
            return $4ba715d4c7df8887$var$nextDropTarget(keyboardDelegate, collection, target, wrap);
    }
}
function $4ba715d4c7df8887$var$nextDropTarget(keyboardDelegate, collection, target, wrap = false, horizontal = null) {
    if (!target) return {
        type: 'root'
    };
    if (target.type === 'root') {
        let nextKey = keyboardDelegate.getFirstKey?.() ?? null;
        if (nextKey != null) return {
            type: 'item',
            key: nextKey,
            dropPosition: 'before'
        };
        return null;
    }
    if (target.type === 'item') {
        let nextKey = null;
        if (horizontal) nextKey = horizontal === 'right' ? keyboardDelegate.getKeyRightOf?.(target.key, {
            includeDisabled: true
        }) : keyboardDelegate.getKeyLeftOf?.(target.key, {
            includeDisabled: true
        });
        else nextKey = keyboardDelegate.getKeyBelow?.(target.key, {
            includeDisabled: true
        });
        let nextCollectionKey = $4ba715d4c7df8887$var$getNextItem(collection, target.key, (key)=>collection.getKeyAfter(key));
        // If the keyboard delegate did not move to the next key in the collection,
        // jump to that key with the same drop position. Otherwise, try the other
        // drop positions on the current key first.
        if (nextKey != null && nextKey !== nextCollectionKey) return {
            type: 'item',
            key: nextKey,
            dropPosition: target.dropPosition
        };
        switch(target.dropPosition){
            case 'before':
                return {
                    type: 'item',
                    key: target.key,
                    dropPosition: 'on'
                };
            case 'on':
                {
                    // If there are nested items, traverse to them prior to the "after" position of this target.
                    // If the next key is on the same level, then its "before" position is equivalent to this item's "after" position.
                    let targetNode = collection.getItem(target.key);
                    let nextNode = nextKey != null ? collection.getItem(nextKey) : null;
                    if (targetNode && nextNode && nextNode.level >= targetNode.level) return {
                        type: 'item',
                        key: nextNode.key,
                        dropPosition: 'before'
                    };
                    return {
                        type: 'item',
                        key: target.key,
                        dropPosition: 'after'
                    };
                }
            case 'after':
                {
                    // If this is the last sibling in a level, traverse to the parent.
                    let targetNode = collection.getItem(target.key);
                    let nextItemInSameLevel = targetNode?.nextKey != null ? collection.getItem(targetNode.nextKey) : null;
                    while(nextItemInSameLevel != null && nextItemInSameLevel.type !== 'item')nextItemInSameLevel = nextItemInSameLevel.nextKey != null ? collection.getItem(nextItemInSameLevel.nextKey) : null;
                    if (targetNode && nextItemInSameLevel == null && targetNode.parentKey != null) {
                        // If the parent item has an item after it, use the "before" position.
                        let parentNode = collection.getItem(targetNode.parentKey);
                        const nextNode = parentNode?.nextKey != null ? collection.getItem(parentNode.nextKey) : null;
                        if (nextNode?.type === 'item') return {
                            type: 'item',
                            key: nextNode.key,
                            dropPosition: 'before'
                        };
                        if (parentNode?.type === 'item') return {
                            type: 'item',
                            key: parentNode.key,
                            dropPosition: 'after'
                        };
                    }
                    if (nextItemInSameLevel) return {
                        type: 'item',
                        key: nextItemInSameLevel.key,
                        dropPosition: 'on'
                    };
                }
        }
    }
    if (wrap) return {
        type: 'root'
    };
    return null;
}
function $4ba715d4c7df8887$var$previousDropTarget(keyboardDelegate, collection, target, wrap = false, horizontal = null) {
    // Start after the last root-level item.
    if (!target || wrap && target.type === 'root') {
        // Keyboard delegate gets the deepest item but we want the shallowest.
        let prevKey = null;
        let lastKey = keyboardDelegate.getLastKey?.();
        while(lastKey != null){
            let node = collection.getItem(lastKey);
            if (node?.type !== 'item') break;
            prevKey = lastKey;
            lastKey = node?.parentKey;
        }
        if (prevKey != null) return {
            type: 'item',
            key: prevKey,
            dropPosition: 'after'
        };
        return null;
    }
    if (target.type === 'item') {
        let prevKey = null;
        if (horizontal) prevKey = horizontal === 'left' ? keyboardDelegate.getKeyLeftOf?.(target.key, {
            includeDisabled: true
        }) : keyboardDelegate.getKeyRightOf?.(target.key, {
            includeDisabled: true
        });
        else prevKey = keyboardDelegate.getKeyAbove?.(target.key, {
            includeDisabled: true
        });
        let prevCollectionKey = $4ba715d4c7df8887$var$getNextItem(collection, target.key, (key)=>collection.getKeyBefore(key));
        // If the keyboard delegate did not move to the next key in the collection,
        // jump to that key with the same drop position. Otherwise, try the other
        // drop positions on the current key first.
        if (prevKey != null && prevKey !== prevCollectionKey) return {
            type: 'item',
            key: prevKey,
            dropPosition: target.dropPosition
        };
        switch(target.dropPosition){
            case 'before':
                {
                    // Move after the last child of the previous item.
                    let targetNode = collection.getItem(target.key);
                    if (targetNode && targetNode.prevKey != null) {
                        let lastChild = $4ba715d4c7df8887$var$getLastChild(collection, targetNode.prevKey);
                        if (lastChild) return lastChild;
                    }
                    if (prevKey != null) return {
                        type: 'item',
                        key: prevKey,
                        dropPosition: 'on'
                    };
                    return {
                        type: 'root'
                    };
                }
            case 'on':
                return {
                    type: 'item',
                    key: target.key,
                    dropPosition: 'before'
                };
            case 'after':
                {
                    // Move after the last child of this item.
                    let lastChild = $4ba715d4c7df8887$var$getLastChild(collection, target.key);
                    if (lastChild) return lastChild;
                    return {
                        type: 'item',
                        key: target.key,
                        dropPosition: 'on'
                    };
                }
        }
    }
    if (target.type !== 'root') return {
        type: 'root'
    };
    return null;
}
function $4ba715d4c7df8887$var$getLastChild(collection, key) {
    // getChildNodes still returns child tree items even when the item is collapsed.
    // Checking if the next item has a greater level is a silly way to determine if the item is expanded.
    let targetNode = collection.getItem(key);
    let nextKey = $4ba715d4c7df8887$var$getNextItem(collection, key, (key)=>collection.getKeyAfter(key));
    let nextNode = nextKey != null ? collection.getItem(nextKey) : null;
    if (targetNode && nextNode && nextNode.level > targetNode.level) {
        let lastChild = null;
        if ('lastChildKey' in targetNode) {
            lastChild = targetNode.lastChildKey != null ? collection.getItem(targetNode.lastChildKey) : null;
            while(lastChild && lastChild.type !== 'item' && lastChild.prevKey != null)lastChild = collection.getItem(lastChild.prevKey);
        } else lastChild = Array.from(targetNode.childNodes).findLast((item)=>item.type === 'item') || null;
        if (lastChild) return {
            type: 'item',
            key: lastChild.key,
            dropPosition: 'after'
        };
    }
    return null;
}
// Find the next or previous item in a collection, skipping over other types of nodes (e.g. content).
function $4ba715d4c7df8887$var$getNextItem(collection, key, getNextKey) {
    let nextCollectionKey = getNextKey(key);
    let nextCollectionNode = nextCollectionKey != null ? collection.getItem(nextCollectionKey) : null;
    while(nextCollectionNode && nextCollectionNode.type !== 'item'){
        nextCollectionKey = getNextKey(nextCollectionNode.key);
        nextCollectionNode = nextCollectionKey != null ? collection.getItem(nextCollectionKey) : null;
    }
    return nextCollectionKey;
}


export {$4ba715d4c7df8887$export$ff7962acd6052c28 as navigate};
//# sourceMappingURL=DropTargetKeyboardNavigation.mjs.map
