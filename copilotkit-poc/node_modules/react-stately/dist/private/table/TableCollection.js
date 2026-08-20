import {getFirstItem as $684db7aaf37fc901$export$fbdeaa6a76694f71, getLastItem as $684db7aaf37fc901$export$7475b2c64539e4cf} from "../collections/getChildNodes.js";
import {GridCollection as $5faecdde4589e649$export$de3fdf6493c353d} from "../grid/GridCollection.js";

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

const $6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY = 'row-header-column-' + Math.random().toString(36).slice(2);
let $6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY_DRAG = 'row-header-column-' + Math.random().toString(36).slice(2);
while($6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY === $6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY_DRAG)$6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY_DRAG = 'row-header-column-' + Math.random().toString(36).slice(2);
function $6b47ca591182ac8d$export$7c127db850d4e81e(keyMap, columnNodes) {
    if (columnNodes.length === 0) return [];
    let columns = [];
    let seen = new Map();
    for (let column of columnNodes){
        let parentKey = column.parentKey;
        let col = [
            column
        ];
        while(parentKey != null){
            let parent = keyMap.get(parentKey);
            if (!parent) break;
            // If we've already seen this parent, than it is shared
            // with a previous column. If the current column is taller
            // than the previous column, than we need to shift the parent
            // in the previous column so it's level with the current column.
            if (seen.has(parent)) {
                var _parent;
                var _colSpan;
                (_colSpan = (_parent = parent).colSpan) !== null && _colSpan !== void 0 ? _colSpan : _parent.colSpan = 0;
                parent.colSpan++;
                parent.colspan = parent.colSpan;
                let { column: column, index: index } = seen.get(parent);
                if (index > col.length) break;
                for(let i = index; i < col.length; i++)column.splice(i, 0, null);
                // Adjust shifted indices
                for(let i = col.length; i < column.length; i++)// eslint-disable-next-line max-depth
                if (column[i] && seen.has(column[i])) seen.get(column[i]).index = i;
            } else {
                parent.colSpan = 1;
                parent.colspan = 1;
                col.push(parent);
                seen.set(parent, {
                    column: col,
                    index: col.length - 1
                });
            }
            parentKey = parent.parentKey;
        }
        columns.push(col);
        column.index = columns.length - 1;
    }
    let maxLength = Math.max(...columns.map((c)=>c.length));
    let headerRows = Array(maxLength).fill(0).map(()=>[]);
    // Convert columns into rows.
    let colIndex = 0;
    for (let column of columns){
        let i = maxLength - 1;
        for (let item of column){
            if (item) {
                // Fill the space up until the current column with a placeholder
                let row = headerRows[i];
                let rowLength = row.reduce((p, c)=>{
                    var _c_colSpan;
                    return p + ((_c_colSpan = c.colSpan) !== null && _c_colSpan !== void 0 ? _c_colSpan : 1);
                }, 0);
                if (rowLength < colIndex) {
                    let placeholder = {
                        type: 'placeholder',
                        key: 'placeholder-' + item.key,
                        colspan: colIndex - rowLength,
                        colSpan: colIndex - rowLength,
                        index: rowLength,
                        value: null,
                        rendered: null,
                        level: i,
                        hasChildNodes: false,
                        childNodes: [],
                        textValue: ''
                    };
                    // eslint-disable-next-line max-depth
                    if (row.length > 0) {
                        row[row.length - 1].nextKey = placeholder.key;
                        placeholder.prevKey = row[row.length - 1].key;
                    }
                    row.push(placeholder);
                }
                if (row.length > 0) {
                    row[row.length - 1].nextKey = item.key;
                    item.prevKey = row[row.length - 1].key;
                }
                item.level = i;
                item.colIndex = colIndex;
                row.push(item);
            }
            i--;
        }
        colIndex++;
    }
    // Add placeholders at the end of each row that is shorter than the maximum
    let i = 0;
    for (let row of headerRows){
        let rowLength = row.reduce((p, c)=>{
            var _c_colSpan;
            return p + ((_c_colSpan = c.colSpan) !== null && _c_colSpan !== void 0 ? _c_colSpan : 1);
        }, 0);
        if (rowLength < columnNodes.length) {
            let placeholder = {
                type: 'placeholder',
                key: 'placeholder-' + row[row.length - 1].key,
                colSpan: columnNodes.length - rowLength,
                colspan: columnNodes.length - rowLength,
                index: rowLength,
                value: null,
                rendered: null,
                level: i,
                hasChildNodes: false,
                childNodes: [],
                textValue: '',
                prevKey: row[row.length - 1].key
            };
            row.push(placeholder);
        }
        i++;
    }
    return headerRows.map((childNodes, index)=>{
        let row = {
            type: 'headerrow',
            key: 'headerrow-' + index,
            index: index,
            value: null,
            rendered: null,
            level: 0,
            hasChildNodes: true,
            childNodes: childNodes,
            textValue: ''
        };
        return row;
    });
}
class $6b47ca591182ac8d$export$596e1b2e2cf93690 extends (0, $5faecdde4589e649$export$de3fdf6493c353d) {
    *[Symbol.iterator]() {
        yield* this.body.childNodes;
    }
    get size() {
        return this._size;
    }
    getKeys() {
        return this.keyMap.keys();
    }
    getKeyBefore(key) {
        let node = this.keyMap.get(key);
        var _node_prevKey;
        return (_node_prevKey = node === null || node === void 0 ? void 0 : node.prevKey) !== null && _node_prevKey !== void 0 ? _node_prevKey : null;
    }
    getKeyAfter(key) {
        let node = this.keyMap.get(key);
        var _node_nextKey;
        return (_node_nextKey = node === null || node === void 0 ? void 0 : node.nextKey) !== null && _node_nextKey !== void 0 ? _node_nextKey : null;
    }
    getFirstKey() {
        var _getFirstItem;
        var _getFirstItem_key;
        return (_getFirstItem_key = (_getFirstItem = (0, $684db7aaf37fc901$export$fbdeaa6a76694f71)(this.body.childNodes)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key) !== null && _getFirstItem_key !== void 0 ? _getFirstItem_key : null;
    }
    getLastKey() {
        var _getLastItem;
        var _getLastItem_key;
        return (_getLastItem_key = (_getLastItem = (0, $684db7aaf37fc901$export$7475b2c64539e4cf)(this.body.childNodes)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key) !== null && _getLastItem_key !== void 0 ? _getLastItem_key : null;
    }
    getItem(key) {
        if (key === this.body.key) return this.body;
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
        if (key === this.body.key) return this.body.childNodes;
        let node = this.getItem(key);
        if ((node === null || node === void 0 ? void 0 : node.type) === 'item') return [
            ...node.childNodes
        ].filter((n)=>n.type === 'cell');
        return super.getChildren(key);
    }
    getTextValue(key) {
        let row = this.getItem(key);
        if (!row) return '';
        // If the row has a textValue, use that.
        if (row.textValue) return row.textValue;
        // Otherwise combine the text of each of the row header columns.
        let rowHeaderColumnKeys = this.rowHeaderColumnKeys;
        if (rowHeaderColumnKeys) {
            let text = [];
            for (let cell of row.childNodes){
                let column = this.columns[cell.index];
                if (rowHeaderColumnKeys.has(column.key) && cell.textValue) text.push(cell.textValue);
                if (text.length === rowHeaderColumnKeys.size) break;
            }
            return text.join(' ');
        }
        return '';
    }
    constructor(nodes, prev, opts){
        let rowHeaderColumnKeys = new Set();
        let body = null;
        let columns = [];
        // Add cell for selection checkboxes if needed.
        if (opts === null || opts === void 0 ? void 0 : opts.showSelectionCheckboxes) {
            let rowHeaderColumn = {
                type: 'column',
                key: $6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY,
                value: null,
                textValue: '',
                level: 0,
                index: (opts === null || opts === void 0 ? void 0 : opts.showDragButtons) ? 1 : 0,
                hasChildNodes: false,
                rendered: null,
                childNodes: [],
                props: {
                    isSelectionCell: true
                }
            };
            columns.unshift(rowHeaderColumn);
        }
        // Add cell for drag buttons if needed.
        if (opts === null || opts === void 0 ? void 0 : opts.showDragButtons) {
            let rowHeaderColumn = {
                type: 'column',
                key: $6b47ca591182ac8d$var$ROW_HEADER_COLUMN_KEY_DRAG,
                value: null,
                textValue: '',
                level: 0,
                index: 0,
                hasChildNodes: false,
                rendered: null,
                childNodes: [],
                props: {
                    isDragButtonCell: true
                }
            };
            columns.unshift(rowHeaderColumn);
        }
        let rows = [];
        let columnKeyMap = new Map();
        let visit = (node)=>{
            switch(node.type){
                case 'body':
                    body = node;
                    break;
                case 'column':
                    columnKeyMap.set(node.key, node);
                    if (!node.hasChildNodes) {
                        columns.push(node);
                        if (node.props.isRowHeader) rowHeaderColumnKeys.add(node.key);
                    }
                    break;
                case 'item':
                    rows.push(node);
                    return; // do not go into childNodes
            }
            for (let child of node.childNodes)visit(child);
        };
        for (let node of nodes)visit(node);
        let headerRows = $6b47ca591182ac8d$export$7c127db850d4e81e(columnKeyMap, columns);
        headerRows.forEach((row, i)=>rows.splice(i, 0, row));
        super({
            columnCount: columns.length,
            items: rows,
            visitNode: (node)=>{
                node.column = columns[node.index];
                return node;
            }
        }), this._size = 0;
        this.columns = columns;
        this.rowHeaderColumnKeys = rowHeaderColumnKeys;
        this.body = body;
        this.headerRows = headerRows;
        this._size = [
            ...body.childNodes
        ].length;
        // Default row header column to the first one.
        if (this.rowHeaderColumnKeys.size === 0) {
            let col = this.columns.find((column)=>{
                var _column_props, _column_props1;
                return !((_column_props = column.props) === null || _column_props === void 0 ? void 0 : _column_props.isDragButtonCell) && !((_column_props1 = column.props) === null || _column_props1 === void 0 ? void 0 : _column_props1.isSelectionCell);
            });
            if (col) this.rowHeaderColumnKeys.add(col.key);
        }
    }
}


export {$6b47ca591182ac8d$export$7c127db850d4e81e as buildHeaderRows, $6b47ca591182ac8d$export$596e1b2e2cf93690 as TableCollection};
//# sourceMappingURL=TableCollection.js.map
