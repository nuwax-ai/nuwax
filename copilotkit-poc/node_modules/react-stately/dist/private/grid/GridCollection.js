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
 */ class $5faecdde4589e649$export$de3fdf6493c353d {
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
        var _node_prevKey;
        return node ? (_node_prevKey = node.prevKey) !== null && _node_prevKey !== void 0 ? _node_prevKey : null : null;
    }
    getKeyAfter(key) {
        let node = this.keyMap.get(key);
        var _node_nextKey;
        return node ? (_node_nextKey = node.nextKey) !== null && _node_nextKey !== void 0 ? _node_nextKey : null : null;
    }
    getFirstKey() {
        var _;
        return (_ = [
            ...this.rows
        ][0]) === null || _ === void 0 ? void 0 : _.key;
    }
    getLastKey() {
        var _rows_;
        let rows = [
            ...this.rows
        ];
        return (_rows_ = rows[rows.length - 1]) === null || _rows_ === void 0 ? void 0 : _rows_.key;
    }
    getItem(key) {
        var _this_keyMap_get;
        return (_this_keyMap_get = this.keyMap.get(key)) !== null && _this_keyMap_get !== void 0 ? _this_keyMap_get : null;
    }
    at(idx) {
        const keys = [
            ...this.getKeys()
        ];
        return this.getItem(keys[idx]);
    }
    getChildren(key) {
        let node = this.keyMap.get(key);
        return (node === null || node === void 0 ? void 0 : node.childNodes) || [];
    }
    constructor(opts){
        this.keyMap = new Map();
        this.keyMap = new Map();
        this.columnCount = opts === null || opts === void 0 ? void 0 : opts.columnCount;
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
                var _child_props;
                for (let child of node.childNodes)if (((_child_props = child.props) === null || _child_props === void 0 ? void 0 : _child_props.colSpan) !== undefined) {
                    rowHasCellWithColSpan = true;
                    break;
                }
            }
            for (let child of node.childNodes){
                if (child.type === 'cell' && rowHasCellWithColSpan) {
                    var _child_props1, _child_props2;
                    child.colspan = (_child_props1 = child.props) === null || _child_props1 === void 0 ? void 0 : _child_props1.colSpan;
                    child.colSpan = (_child_props2 = child.props) === null || _child_props2 === void 0 ? void 0 : _child_props2.colSpan;
                    var _last_colIndex, _last_colSpan;
                    child.colIndex = !last ? child.index : ((_last_colIndex = last.colIndex) !== null && _last_colIndex !== void 0 ? _last_colIndex : last.index) + ((_last_colSpan = last.colSpan) !== null && _last_colSpan !== void 0 ? _last_colSpan : 1);
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
            var _node_level, _node_key, _node_type, _node_value, _node_textValue, _node_index;
            let rowNode = {
                ...node,
                level: (_node_level = node.level) !== null && _node_level !== void 0 ? _node_level : 0,
                key: (_node_key = node.key) !== null && _node_key !== void 0 ? _node_key : 'row-' + i,
                type: (_node_type = node.type) !== null && _node_type !== void 0 ? _node_type : 'row',
                value: (_node_value = node.value) !== null && _node_value !== void 0 ? _node_value : null,
                hasChildNodes: true,
                childNodes: [
                    ...node.childNodes
                ],
                rendered: node.rendered,
                textValue: (_node_textValue = node.textValue) !== null && _node_textValue !== void 0 ? _node_textValue : '',
                index: (_node_index = node.index) !== null && _node_index !== void 0 ? _node_index : i
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
}


export {$5faecdde4589e649$export$de3fdf6493c353d as GridCollection};
//# sourceMappingURL=GridCollection.js.map
