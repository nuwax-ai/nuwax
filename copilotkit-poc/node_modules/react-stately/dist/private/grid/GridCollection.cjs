
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "GridCollection", function () { return $7ec834b94184affa$export$de3fdf6493c353d; });
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
 */ class $7ec834b94184affa$export$de3fdf6493c353d {
    constructor(opts){
        this.keyMap = new Map();
        this.keyMap = new Map();
        this.columnCount = opts?.columnCount;
        this.rows = [];
        let visit = (node)=>{
            // If the node is the same object as the previous node for the same key,
            // we can skip this node and its children. We always visit columns though,
            // because we depend on order to build the columns array.
            let prevNode = this.keyMap.get(node.key);
            if (opts.visitNode) node = opts.visitNode(node);
            this.keyMap.set(node.key, node);
            let childKeys = new Set();
            let last = null;
            let rowHasCellWithColSpan = false;
            if (node.type === 'item') {
                for (let child of node.childNodes)if (child.props?.colSpan !== undefined) {
                    rowHasCellWithColSpan = true;
                    break;
                }
            }
            for (let child of node.childNodes){
                if (child.type === 'cell' && rowHasCellWithColSpan) {
                    child.colspan = child.props?.colSpan;
                    child.colSpan = child.props?.colSpan;
                    child.colIndex = !last ? child.index : (last.colIndex ?? last.index) + (last.colSpan ?? 1);
                }
                if (child.type === 'cell' && child.parentKey == null) // if child is a cell parent key isn't already established by the collection, match child node to parent row
                child.parentKey = node.key;
                childKeys.add(child.key);
                if (last) {
                    last.nextKey = child.key;
                    child.prevKey = last.key;
                } else child.prevKey = null;
                visit(child);
                last = child;
            }
            if (last) last.nextKey = null;
            // Remove deleted nodes and their children from the key map
            if (prevNode) {
                for (let child of prevNode.childNodes)if (!childKeys.has(child.key)) remove(child);
            }
        };
        let remove = (node)=>{
            this.keyMap.delete(node.key);
            for (let child of node.childNodes)if (this.keyMap.get(child.key) === child) remove(child);
        };
        let last = null;
        for (let [i, node] of opts.items.entries()){
            let rowNode = {
                ...node,
                level: node.level ?? 0,
                key: node.key ?? 'row-' + i,
                type: node.type ?? 'row',
                value: node.value ?? null,
                hasChildNodes: true,
                childNodes: [
                    ...node.childNodes
                ],
                rendered: node.rendered,
                textValue: node.textValue ?? '',
                index: node.index ?? i
            };
            if (last) {
                last.nextKey = rowNode.key;
                rowNode.prevKey = last.key;
            } else rowNode.prevKey = null;
            this.rows.push(rowNode);
            visit(rowNode);
            last = rowNode;
        }
        if (last) last.nextKey = null;
    }
    *[Symbol.iterator]() {
        yield* [
            ...this.rows
        ];
    }
    get size() {
        return [
            ...this.rows
        ].length;
    }
    getKeys() {
        return this.keyMap.keys();
    }
    getKeyBefore(key) {
        let node = this.keyMap.get(key);
        return node ? node.prevKey ?? null : null;
    }
    getKeyAfter(key) {
        let node = this.keyMap.get(key);
        return node ? node.nextKey ?? null : null;
    }
    getFirstKey() {
        return [
            ...this.rows
        ][0]?.key;
    }
    getLastKey() {
        let rows = [
            ...this.rows
        ];
        return rows[rows.length - 1]?.key;
    }
    getItem(key) {
        return this.keyMap.get(key) ?? null;
    }
    at(idx) {
        const keys = [
            ...this.getKeys()
        ];
        return this.getItem(keys[idx]);
    }
    getChildren(key) {
        let node = this.keyMap.get(key);
        return node?.childNodes || [];
    }
}


//# sourceMappingURL=GridCollection.cjs.map
