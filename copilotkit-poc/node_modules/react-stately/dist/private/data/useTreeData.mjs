import {useState as $d8tpy$useState} from "react";

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
function $48fd4b7af0dd022e$export$d14e1352e21f4a16(options) {
    let { initialItems: initialItems = [], initialSelectedKeys: initialSelectedKeys, getKey: getKey = (item)=>item.id ?? item.key, getChildren: getChildren = (item)=>item.children } = options;
    // We only want to compute this on initial render.
    let [tree, setItems] = (0, $d8tpy$useState)(()=>buildTree(initialItems, new Map()));
    let { items: items, nodeMap: nodeMap } = tree;
    let [selectedKeys, setSelectedKeys] = (0, $d8tpy$useState)(new Set(initialSelectedKeys || []));
    function buildTree(initialItems = [], map, parentKey) {
        if (initialItems == null) initialItems = [];
        return {
            items: initialItems.map((item)=>{
                let node = {
                    key: getKey(item),
                    parentKey: parentKey ?? null,
                    value: item,
                    children: null
                };
                node.children = buildTree(getChildren(item), map, node.key).items;
                map.set(node.key, node);
                return node;
            }),
            nodeMap: map
        };
    }
    function updateTree(items, key, update, originalMap) {
        let node = key == null ? null : originalMap.get(key);
        if (node == null) return {
            items: items,
            nodeMap: originalMap
        };
        let map = new Map(originalMap);
        // Create a new node. If null, then delete the node, otherwise replace.
        let newNode = update(node);
        if (newNode == null) deleteNode(node, map);
        else addNode(newNode, map);
        // Walk up the tree and update each parent to refer to the new children.
        while(node && node.parentKey){
            let nextParent = map.get(node.parentKey);
            let copy = {
                key: nextParent.key,
                parentKey: nextParent.parentKey,
                value: nextParent.value,
                children: null
            };
            let children = nextParent.children;
            if (newNode == null && children) children = children.filter((c)=>c !== node);
            copy.children = children?.map((child)=>{
                if (child === node) // newNode cannot be null here due to the above filter.
                return newNode;
                return child;
            }) ?? null;
            map.set(copy.key, copy);
            newNode = copy;
            node = nextParent;
        }
        if (newNode == null) items = items.filter((c)=>c !== node);
        return {
            items: items.map((item)=>{
                if (item === node) // newNode cannot be null here due to the above filter.
                return newNode;
                return item;
            }),
            nodeMap: map
        };
    }
    function addNode(node, map) {
        map.set(node.key, node);
        if (node.children) for (let child of node.children)addNode(child, map);
    }
    function deleteNode(node, map) {
        map.delete(node.key);
        if (node.children) for (let child of node.children)deleteNode(child, map);
    }
    return {
        items: items,
        selectedKeys: selectedKeys,
        setSelectedKeys: setSelectedKeys,
        getItem (key) {
            return nodeMap.get(key);
        },
        insert (parentKey, index, ...values) {
            setItems(({ items: items, nodeMap: originalMap })=>{
                let { items: newNodes, nodeMap: newMap } = buildTree(values, new Map(originalMap), parentKey);
                // If parentKey is null, insert into the root.
                if (parentKey == null) return {
                    items: [
                        ...items.slice(0, index),
                        ...newNodes,
                        ...items.slice(index)
                    ],
                    nodeMap: newMap
                };
                // Otherwise, update the parent node and its ancestors.
                return updateTree(items, parentKey, (parentNode)=>({
                        key: parentNode.key,
                        parentKey: parentNode.parentKey,
                        value: parentNode.value,
                        children: [
                            ...parentNode.children.slice(0, index),
                            ...newNodes,
                            ...parentNode.children.slice(index)
                        ]
                    }), newMap);
            });
        },
        insertBefore (key, ...values) {
            let node = nodeMap.get(key);
            if (!node) return;
            let parentNode = nodeMap.get(node.parentKey);
            let nodes = parentNode ? parentNode.children : items;
            let index = nodes.indexOf(node);
            this.insert(parentNode?.key ?? null, index, ...values);
        },
        insertAfter (key, ...values) {
            let node = nodeMap.get(key);
            if (!node) return;
            let parentNode = nodeMap.get(node.parentKey);
            let nodes = parentNode ? parentNode.children : items;
            let index = nodes.indexOf(node);
            this.insert(parentNode?.key ?? null, index + 1, ...values);
        },
        prepend (parentKey, ...values) {
            this.insert(parentKey, 0, ...values);
        },
        append (parentKey, ...values) {
            if (parentKey == null) this.insert(null, items.length, ...values);
            else {
                let parentNode = nodeMap.get(parentKey);
                if (!parentNode) return;
                this.insert(parentKey, parentNode.children.length, ...values);
            }
        },
        remove (...keys) {
            if (keys.length === 0) return;
            let newItems = items;
            let prevMap = nodeMap;
            let newTree;
            for (let key of keys){
                newTree = updateTree(newItems, key, ()=>null, prevMap);
                prevMap = newTree.nodeMap;
                newItems = newTree.items;
            }
            setItems(newTree);
            let selection = new Set(selectedKeys);
            for (let key of selectedKeys)if (!newTree.nodeMap.has(key)) selection.delete(key);
            setSelectedKeys(selection);
        },
        removeSelectedItems () {
            this.remove(...selectedKeys);
        },
        move (key, toParentKey, index) {
            setItems(({ items: items, nodeMap: originalMap })=>{
                let node = originalMap.get(key);
                if (!node) return {
                    items: items,
                    nodeMap: originalMap
                };
                let { items: newItems, nodeMap: newMap } = updateTree(items, key, ()=>null, originalMap);
                const movedNode = {
                    ...node,
                    parentKey: toParentKey
                };
                // If parentKey is null, insert into the root.
                if (toParentKey == null) {
                    addNode(movedNode, newMap);
                    return {
                        items: [
                            ...newItems.slice(0, index),
                            movedNode,
                            ...newItems.slice(index)
                        ],
                        nodeMap: newMap
                    };
                }
                // Otherwise, update the parent node and its ancestors.
                return updateTree(newItems, toParentKey, (parentNode)=>({
                        key: parentNode.key,
                        parentKey: parentNode.parentKey,
                        value: parentNode.value,
                        children: [
                            ...parentNode.children.slice(0, index),
                            movedNode,
                            ...parentNode.children.slice(index)
                        ]
                    }), newMap);
            });
        },
        moveBefore (key, keys) {
            setItems((prevState)=>{
                let { items: items, nodeMap: nodeMap } = prevState;
                let node = nodeMap.get(key);
                if (!node) return prevState;
                let toParentKey = node.parentKey ?? null;
                let parent = null;
                if (toParentKey != null) parent = nodeMap.get(toParentKey) ?? null;
                let toIndex = parent?.children ? parent.children.indexOf(node) : items.indexOf(node);
                return $48fd4b7af0dd022e$var$moveItems(prevState, keys, parent, toIndex, updateTree, addNode);
            });
        },
        moveAfter (key, keys) {
            setItems((prevState)=>{
                let { items: items, nodeMap: nodeMap } = prevState;
                let node = nodeMap.get(key);
                if (!node) return prevState;
                let toParentKey = node.parentKey ?? null;
                let parent = null;
                if (toParentKey != null) parent = nodeMap.get(toParentKey) ?? null;
                let toIndex = parent?.children ? parent.children.indexOf(node) : items.indexOf(node);
                toIndex++;
                return $48fd4b7af0dd022e$var$moveItems(prevState, keys, parent, toIndex, updateTree, addNode);
            });
        },
        update (oldKey, newValue) {
            setItems(({ items: items, nodeMap: originalMap })=>updateTree(items, oldKey, (oldNode)=>{
                    let node = {
                        key: oldNode.key,
                        parentKey: oldNode.parentKey,
                        value: newValue,
                        children: null
                    };
                    let tree = buildTree(getChildren(newValue), originalMap, node.key);
                    node.children = tree.items;
                    return node;
                }, originalMap));
        }
    };
}
function $48fd4b7af0dd022e$var$moveItems(state, keys, toParent, toIndex, updateTree, addNode) {
    let { items: items, nodeMap: nodeMap } = state;
    let parent = toParent;
    let removeKeys = new Set(keys);
    while(parent?.parentKey != null){
        if (removeKeys.has(parent.key)) throw new Error('Cannot move an item to be a child of itself.');
        parent = nodeMap.get(parent.parentKey) ?? null;
    }
    let originalToIndex = toIndex;
    let keyArray = Array.isArray(keys) ? keys : [
        ...keys
    ];
    // depth first search to put keys in order
    let inOrderKeys = new Map();
    let removedItems = [];
    let newItems = items;
    let newMap = nodeMap;
    let i = 0;
    function traversal(node, { inorder: inorder, postorder: postorder }) {
        inorder?.(node);
        if (node != null) for (let child of node.children ?? []){
            traversal(child, {
                inorder: inorder,
                postorder: postorder
            });
            postorder?.(child);
        }
    }
    function inorder(child) {
        // in-order so we add items as we encounter them in the tree, then we can insert them in expected order later
        if (keyArray.includes(child.key)) inOrderKeys.set(child.key, i++);
    }
    function postorder(child) {
        // remove items and update the tree from the leaves and work upwards toward the root, this way
        // we don't copy child node references from parents inadvertently
        if (keyArray.includes(child.key)) {
            removedItems.push({
                ...newMap.get(child.key),
                parentKey: toParent?.key ?? null
            });
            let { items: nextItems, nodeMap: nextMap } = updateTree(newItems, child.key, ()=>null, newMap);
            newItems = nextItems;
            newMap = nextMap;
        }
        // decrement the index if the child being removed is in the target parent and before the target index
        // the root node is special, it is null, and will not have a key, however, a parentKey can still point to it
        if ((child.parentKey === toParent || child.parentKey === toParent?.key) && keyArray.includes(child.key) && (toParent?.children ? toParent.children.indexOf(child) : items.indexOf(child)) < originalToIndex) toIndex--;
    }
    traversal({
        children: items
    }, {
        inorder: inorder,
        postorder: postorder
    });
    let inOrderItems = removedItems.sort((a, b)=>inOrderKeys.get(a.key) > inOrderKeys.get(b.key) ? 1 : -1);
    // If parentKey is null, insert into the root.
    if (!toParent || toParent.key == null) {
        inOrderItems.forEach((movedNode)=>{
            addNode(movedNode, newMap);
        });
        return {
            items: [
                ...newItems.slice(0, toIndex),
                ...inOrderItems,
                ...newItems.slice(toIndex)
            ],
            nodeMap: newMap
        };
    }
    // Otherwise, update the parent node and its ancestors.
    return updateTree(newItems, toParent.key, (parentNode)=>({
            key: parentNode.key,
            parentKey: parentNode.parentKey,
            value: parentNode.value,
            children: [
                ...parentNode.children.slice(0, toIndex),
                ...inOrderItems,
                ...parentNode.children.slice(toIndex)
            ]
        }), newMap);
}


export {$48fd4b7af0dd022e$export$d14e1352e21f4a16 as useTreeData};
//# sourceMappingURL=useTreeData.mjs.map
