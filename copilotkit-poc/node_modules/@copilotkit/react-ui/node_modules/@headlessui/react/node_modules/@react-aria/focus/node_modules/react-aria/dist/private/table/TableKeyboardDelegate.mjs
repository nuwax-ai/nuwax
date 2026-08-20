import {GridKeyboardDelegate as $c7bb87e55e1ab755$export$de9feff04fda126e} from "../grid/GridKeyboardDelegate.mjs";
import {getFirstItem as $3P3vF$getFirstItem, getChildNodes as $3P3vF$getChildNodes} from "react-stately/private/collections/getChildNodes";

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

class $0048eb146240e3fa$export$da43f8f5cb04028d extends (0, $c7bb87e55e1ab755$export$de9feff04fda126e) {
    isCell(node) {
        return node.type === 'cell' || node.type === 'rowheader' || node.type === 'column';
    }
    getKeyBelow(key, options) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return null;
        // If focus was on a column, then focus the first child column if any,
        // or find the corresponding cell in the first row.
        if (startItem.type === 'column') {
            let child = (0, $3P3vF$getFirstItem)((0, $3P3vF$getChildNodes)(startItem, this.collection));
            if (child) return child.key;
            let firstKey = this.getFirstKey();
            if (firstKey == null) return null;
            let firstItem = this.collection.getItem(firstKey);
            if (!firstItem) return null;
            return super.getKeyForItemInRowByIndex(firstKey, startItem.index);
        }
        return super.getKeyBelow(key, options);
    }
    getKeyAbove(key, options) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return null;
        // If focus was on a column, focus the parent column if any
        if (startItem.type === 'column') {
            let parent = startItem.parentKey != null ? this.collection.getItem(startItem.parentKey) : null;
            if (parent && parent.type === 'column') return parent.key;
            return null;
        }
        // only return above row key if not header row
        let superKey = super.getKeyAbove(key, options);
        let superItem = superKey != null ? this.collection.getItem(superKey) : null;
        if (superItem && superItem.type !== 'headerrow') return superKey;
        // If no item was found, and focus was on a cell, then focus the
        // corresponding column header.
        if (this.isCell(startItem)) return this.collection.columns[startItem.index].key;
        // If focus was on a row, then focus the first column header.
        return this.collection.columns[0].key;
    }
    findNextColumnKey(column) {
        // Search following columns
        let key = this.findNextKey(column.key, (item)=>item.type === 'column');
        if (key != null) return key;
        // Wrap around to the first column
        let row = this.collection.headerRows[column.level];
        for (let item of (0, $3P3vF$getChildNodes)(row, this.collection)){
            if (item.type === 'column') return item.key;
        }
        return null;
    }
    findPreviousColumnKey(column) {
        // Search previous columns
        let key = this.findPreviousKey(column.key, (item)=>item.type === 'column');
        if (key != null) return key;
        // Wrap around to the last column
        let row = this.collection.headerRows[column.level];
        let childNodes = [
            ...(0, $3P3vF$getChildNodes)(row, this.collection)
        ];
        for(let i = childNodes.length - 1; i >= 0; i--){
            let item = childNodes[i];
            if (item.type === 'column') return item.key;
        }
        return null;
    }
    getKeyRightOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return null;
        // If focus was on a column, then focus the next column
        if (item.type === 'column') return this.direction === 'rtl' ? this.findPreviousColumnKey(item) : this.findNextColumnKey(item);
        return super.getKeyRightOf(key);
    }
    getKeyLeftOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return null;
        // If focus was on a column, then focus the previous column
        if (item.type === 'column') return this.direction === 'rtl' ? this.findNextColumnKey(item) : this.findPreviousColumnKey(item);
        return super.getKeyLeftOf(key);
    }
    getKeyForSearch(search, fromKey) {
        if (!this.collator) return null;
        let collection = this.collection;
        let key = fromKey ?? this.getFirstKey();
        if (key == null) return null;
        // If the starting key is a cell, search from its parent row.
        let startItem = collection.getItem(key);
        if (startItem?.type === 'cell') key = startItem.parentKey ?? null;
        let hasWrapped = false;
        while(key != null){
            let item = collection.getItem(key);
            if (!item) return null;
            if (item.textValue) {
                let substring = item.textValue.slice(0, search.length);
                if (this.collator.compare(substring, search) === 0) return item.key;
            }
            // Check each of the row header cells in this row for a match
            for (let cell of (0, $3P3vF$getChildNodes)(item, this.collection)){
                let column = collection.columns[cell.index];
                if (collection.rowHeaderColumnKeys.has(column.key) && cell.textValue) {
                    let substring = cell.textValue.slice(0, search.length);
                    if (this.collator.compare(substring, search) === 0) {
                        // If we started on a cell, end on the matching cell. Otherwise, end on the row.
                        let fromItem = fromKey != null ? collection.getItem(fromKey) : startItem;
                        return fromItem?.type === 'cell' ? cell.key : item.key;
                    }
                }
            }
            key = this.getKeyBelow(key);
            // Wrap around when reaching the end of the collection
            if (key == null && !hasWrapped) {
                key = this.getFirstKey();
                hasWrapped = true;
            }
        }
        return null;
    }
}


export {$0048eb146240e3fa$export$da43f8f5cb04028d as TableKeyboardDelegate};
//# sourceMappingURL=TableKeyboardDelegate.mjs.map
