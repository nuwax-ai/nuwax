import {DOMLayoutDelegate as $b97f9e0227e72afb$export$8f5ed9ff9f511381} from "../selection/DOMLayoutDelegate.js";
import {getChildNodes as $gGlnM$getChildNodes, getLastItem as $gGlnM$getLastItem, getFirstItem as $gGlnM$getFirstItem, getNthItem as $gGlnM$getNthItem} from "react-stately/private/collections/getChildNodes";

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

class $bd737065d28db63c$export$de9feff04fda126e {
    isCell(node) {
        return node.type === 'cell';
    }
    isRow(node) {
        return node.type === 'row' || node.type === 'item';
    }
    isDisabled(item) {
        var _item_props, _item_props1;
        return this.disabledBehavior === 'all' && (((_item_props = item.props) === null || _item_props === void 0 ? void 0 : _item_props.isDisabled) || this.disabledKeys.has(item.key)) && ((_item_props1 = item.props) === null || _item_props1 === void 0 ? void 0 : _item_props1.disabledBehavior) !== 'selection';
    }
    findPreviousKey(fromKey, pred, includeDisabled = false) {
        let key = fromKey != null ? this.collection.getKeyBefore(fromKey) : this.collection.getLastKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (!item) return null;
            if ((includeDisabled || !this.isDisabled(item)) && (!pred || pred(item))) return key;
            key = this.collection.getKeyBefore(key);
        }
        return null;
    }
    findNextKey(fromKey, pred, includeDisabled = false) {
        let key = fromKey != null ? this.collection.getKeyAfter(fromKey) : this.collection.getFirstKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (!item) return null;
            if ((includeDisabled || !this.isDisabled(item)) && (!pred || pred(item))) return key;
            key = this.collection.getKeyAfter(key);
            if (key == null) return null;
        }
        return null;
    }
    getKeyForItemInRowByIndex(key, index = 0) {
        if (index < 0) return null;
        let item = this.collection.getItem(key);
        if (!item) return null;
        let i = 0;
        for (let child of (0, $gGlnM$getChildNodes)(item, this.collection)){
            var _child_key;
            if (child.colSpan && child.colSpan + i > index) return (_child_key = child.key) !== null && _child_key !== void 0 ? _child_key : null;
            if (child.colSpan) i = i + child.colSpan - 1;
            var _child_key1;
            if (i === index) return (_child_key1 = child.key) !== null && _child_key1 !== void 0 ? _child_key1 : null;
            i++;
        }
        return null;
    }
    getKeyBelow(fromKey, options) {
        let key = fromKey;
        let startItem = this.collection.getItem(key);
        if (!startItem) return null;
        var _startItem_parentKey;
        // If focus was on a cell, start searching from the parent row
        if (this.isCell(startItem)) key = (_startItem_parentKey = startItem.parentKey) !== null && _startItem_parentKey !== void 0 ? _startItem_parentKey : null;
        if (key == null) return null;
        // Find the next item
        key = this.findNextKey(key, (item)=>item.type === 'item', options === null || options === void 0 ? void 0 : options.includeDisabled);
        if (key != null) {
            // If focus was on a cell, focus the cell with the same index in the next row.
            if (this.isCell(startItem)) {
                let startIndex = startItem.colIndex ? startItem.colIndex : startItem.index;
                return this.getKeyForItemInRowByIndex(key, startIndex);
            }
            // Otherwise, focus the next row
            if (this.focusMode === 'row') return key;
        }
        return null;
    }
    getKeyAbove(fromKey, options) {
        let key = fromKey;
        let startItem = this.collection.getItem(key);
        if (!startItem) return null;
        var _startItem_parentKey;
        // If focus is on a cell, start searching from the parent row
        if (this.isCell(startItem)) key = (_startItem_parentKey = startItem.parentKey) !== null && _startItem_parentKey !== void 0 ? _startItem_parentKey : null;
        if (key == null) return null;
        // Find the previous item
        key = this.findPreviousKey(key, (item)=>item.type === 'item', options === null || options === void 0 ? void 0 : options.includeDisabled);
        if (key != null) {
            // If focus was on a cell, focus the cell with the same index in the previous row.
            if (this.isCell(startItem)) {
                let startIndex = startItem.colIndex ? startItem.colIndex : startItem.index;
                return this.getKeyForItemInRowByIndex(key, startIndex);
            }
            // Otherwise, focus the previous row
            if (this.focusMode === 'row') return key;
        }
        return null;
    }
    getKeyRightOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return null;
        // If focus is on a row, focus the first child cell.
        if (this.isRow(item)) {
            var _getLastItem, _getFirstItem;
            let children = (0, $gGlnM$getChildNodes)(item, this.collection);
            var _ref;
            return (_ref = this.direction === 'rtl' ? (_getLastItem = (0, $gGlnM$getLastItem)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key : (_getFirstItem = (0, $gGlnM$getFirstItem)(children)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key) !== null && _ref !== void 0 ? _ref : null;
        }
        // If focus is on a cell, focus the next cell if any,
        // otherwise focus the parent row.
        if (this.isCell(item) && item.parentKey != null) {
            let parent = this.collection.getItem(item.parentKey);
            if (!parent) return null;
            let children = (0, $gGlnM$getChildNodes)(parent, this.collection);
            var _ref1;
            let next = (_ref1 = this.direction === 'rtl' ? (0, $gGlnM$getNthItem)(children, item.index - 1) : (0, $gGlnM$getNthItem)(children, item.index + 1)) !== null && _ref1 !== void 0 ? _ref1 : null;
            var _next_key;
            if (next) return (_next_key = next.key) !== null && _next_key !== void 0 ? _next_key : null;
            var _item_parentKey;
            // focus row only if focusMode is set to row
            if (this.focusMode === 'row') return (_item_parentKey = item.parentKey) !== null && _item_parentKey !== void 0 ? _item_parentKey : null;
            var _ref2;
            return (_ref2 = this.direction === 'rtl' ? this.getFirstKey(key) : this.getLastKey(key)) !== null && _ref2 !== void 0 ? _ref2 : null;
        }
        return null;
    }
    getKeyLeftOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return null;
        // If focus is on a row, focus the last child cell.
        if (this.isRow(item)) {
            var _getFirstItem, _getLastItem;
            let children = (0, $gGlnM$getChildNodes)(item, this.collection);
            var _ref;
            return (_ref = this.direction === 'rtl' ? (_getFirstItem = (0, $gGlnM$getFirstItem)(children)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key : (_getLastItem = (0, $gGlnM$getLastItem)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key) !== null && _ref !== void 0 ? _ref : null;
        }
        // If focus is on a cell, focus the previous cell if any,
        // otherwise focus the parent row.
        if (this.isCell(item) && item.parentKey != null) {
            let parent = this.collection.getItem(item.parentKey);
            if (!parent) return null;
            let children = (0, $gGlnM$getChildNodes)(parent, this.collection);
            var _ref1;
            let prev = (_ref1 = this.direction === 'rtl' ? (0, $gGlnM$getNthItem)(children, item.index + 1) : (0, $gGlnM$getNthItem)(children, item.index - 1)) !== null && _ref1 !== void 0 ? _ref1 : null;
            var _prev_key;
            if (prev) return (_prev_key = prev.key) !== null && _prev_key !== void 0 ? _prev_key : null;
            var _item_parentKey;
            // focus row only if focusMode is set to row
            if (this.focusMode === 'row') return (_item_parentKey = item.parentKey) !== null && _item_parentKey !== void 0 ? _item_parentKey : null;
            var _ref2;
            return (_ref2 = this.direction === 'rtl' ? this.getLastKey(key) : this.getFirstKey(key)) !== null && _ref2 !== void 0 ? _ref2 : null;
        }
        return null;
    }
    getFirstKey(fromKey, global) {
        let key = fromKey !== null && fromKey !== void 0 ? fromKey : null;
        let item;
        if (key != null) {
            item = this.collection.getItem(key);
            if (!item) return null;
            // If global flag is not set, and a cell is currently focused,
            // move focus to the first cell in the parent row.
            if (this.isCell(item) && !global && item.parentKey != null) {
                var _getFirstItem;
                let parent = this.collection.getItem(item.parentKey);
                if (!parent) return null;
                var _getFirstItem_key;
                return (_getFirstItem_key = (_getFirstItem = (0, $gGlnM$getFirstItem)((0, $gGlnM$getChildNodes)(parent, this.collection))) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key) !== null && _getFirstItem_key !== void 0 ? _getFirstItem_key : null;
            }
        }
        // Find the first row
        key = this.findNextKey(undefined, (item)=>item.type === 'item');
        // If global flag is set (or if focus mode is cell), focus the first cell in the first row.
        if (key != null && (item && this.isCell(item) && global || this.focusMode === 'cell')) {
            var _getFirstItem1;
            let item = this.collection.getItem(key);
            if (!item) return null;
            var _getFirstItem_key1;
            key = (_getFirstItem_key1 = (_getFirstItem1 = (0, $gGlnM$getFirstItem)((0, $gGlnM$getChildNodes)(item, this.collection))) === null || _getFirstItem1 === void 0 ? void 0 : _getFirstItem1.key) !== null && _getFirstItem_key1 !== void 0 ? _getFirstItem_key1 : null;
        }
        // Otherwise, focus the row itself.
        return key;
    }
    getLastKey(fromKey, global) {
        let key = fromKey !== null && fromKey !== void 0 ? fromKey : null;
        let item;
        if (key != null) {
            item = this.collection.getItem(key);
            if (!item) return null;
            // If global flag is not set, and a cell is currently focused,
            // move focus to the last cell in the parent row.
            if (this.isCell(item) && !global && item.parentKey != null) {
                var _getLastItem;
                let parent = this.collection.getItem(item.parentKey);
                if (!parent) return null;
                let children = (0, $gGlnM$getChildNodes)(parent, this.collection);
                var _getLastItem_key;
                return (_getLastItem_key = (_getLastItem = (0, $gGlnM$getLastItem)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key) !== null && _getLastItem_key !== void 0 ? _getLastItem_key : null;
            }
        }
        // Find the last row
        key = this.findPreviousKey(undefined, (item)=>item.type === 'item');
        // If global flag is set (or if focus mode is cell), focus the last cell in the last row.
        if (key != null && (item && this.isCell(item) && global || this.focusMode === 'cell')) {
            var _getLastItem1;
            let item = this.collection.getItem(key);
            if (!item) return null;
            let children = (0, $gGlnM$getChildNodes)(item, this.collection);
            var _getLastItem_key1;
            key = (_getLastItem_key1 = (_getLastItem1 = (0, $gGlnM$getLastItem)(children)) === null || _getLastItem1 === void 0 ? void 0 : _getLastItem1.key) !== null && _getLastItem_key1 !== void 0 ? _getLastItem_key1 : null;
        }
        // Otherwise, focus the row itself.
        return key;
    }
    getKeyPageAbove(fromKey) {
        let key = fromKey;
        let itemRect = this.layoutDelegate.getItemRect(key);
        if (!itemRect) return null;
        let pageY = Math.max(0, itemRect.y + itemRect.height - this.layoutDelegate.getVisibleRect().height);
        while(itemRect && itemRect.y > pageY && key != null){
            var _this_getKeyAbove;
            key = (_this_getKeyAbove = this.getKeyAbove(key)) !== null && _this_getKeyAbove !== void 0 ? _this_getKeyAbove : null;
            if (key == null) break;
            itemRect = this.layoutDelegate.getItemRect(key);
        }
        return key;
    }
    getKeyPageBelow(fromKey) {
        let key = fromKey;
        let itemRect = this.layoutDelegate.getItemRect(key);
        if (!itemRect) return null;
        let pageHeight = this.layoutDelegate.getVisibleRect().height;
        let pageY = Math.min(this.layoutDelegate.getContentSize().height, itemRect.y + pageHeight);
        while(itemRect && itemRect.y + itemRect.height < pageY){
            let nextKey = this.getKeyBelow(key);
            // If nextKey is undefined, we've reached the last row already
            if (nextKey == null) break;
            itemRect = this.layoutDelegate.getItemRect(nextKey);
            key = nextKey;
        }
        return key;
    }
    getKeyForSearch(search, fromKey) {
        let key = fromKey !== null && fromKey !== void 0 ? fromKey : null;
        if (!this.collator) return null;
        let collection = this.collection;
        key = fromKey !== null && fromKey !== void 0 ? fromKey : this.getFirstKey();
        if (key == null) return null;
        // If the starting key is a cell, search from its parent row.
        let startItem = collection.getItem(key);
        if (!startItem) return null;
        var _startItem_parentKey;
        if (startItem.type === 'cell') key = (_startItem_parentKey = startItem.parentKey) !== null && _startItem_parentKey !== void 0 ? _startItem_parentKey : null;
        let hasWrapped = false;
        while(key != null){
            let item = collection.getItem(key);
            if (!item) return null;
            // check row text value for match
            if (item.textValue) {
                let substring = item.textValue.slice(0, search.length);
                if (this.collator.compare(substring, search) === 0) {
                    var _getFirstItem;
                    var _getFirstItem_key;
                    if (this.isRow(item) && this.focusMode === 'cell') return (_getFirstItem_key = (_getFirstItem = (0, $gGlnM$getFirstItem)((0, $gGlnM$getChildNodes)(item, this.collection))) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key) !== null && _getFirstItem_key !== void 0 ? _getFirstItem_key : null;
                    return item.key;
                }
            }
            key = this.findNextKey(key, (item)=>item.type === 'item');
            // Wrap around when reaching the end of the collection
            if (key == null && !hasWrapped) {
                key = this.getFirstKey();
                hasWrapped = true;
            }
        }
        return null;
    }
    constructor(options){
        this.collection = options.collection;
        this.disabledKeys = options.disabledKeys;
        this.disabledBehavior = options.disabledBehavior || 'all';
        this.direction = options.direction;
        this.collator = options.collator;
        if (!options.layout && !options.ref) throw new Error('Either a layout or a ref must be specified.');
        this.layoutDelegate = options.layoutDelegate || (options.layout ? new $bd737065d28db63c$var$DeprecatedLayoutDelegate(options.layout) : new (0, $b97f9e0227e72afb$export$8f5ed9ff9f511381)(options.ref));
        var _options_focusMode;
        this.focusMode = (_options_focusMode = options.focusMode) !== null && _options_focusMode !== void 0 ? _options_focusMode : 'row';
    }
}
class $bd737065d28db63c$var$DeprecatedLayoutDelegate {
    getContentSize() {
        return this.layout.getContentSize();
    }
    getItemRect(key) {
        var _this_layout_getLayoutInfo;
        return ((_this_layout_getLayoutInfo = this.layout.getLayoutInfo(key)) === null || _this_layout_getLayoutInfo === void 0 ? void 0 : _this_layout_getLayoutInfo.rect) || null;
    }
    getVisibleRect() {
        return this.layout.virtualizer.visibleRect;
    }
    constructor(layout){
        this.layout = layout;
    }
}


export {$bd737065d28db63c$export$de9feff04fda126e as GridKeyboardDelegate};
//# sourceMappingURL=GridKeyboardDelegate.js.map
