import {compareNodeOrder as $cd5ea4b915021f1d$export$8c434b3a7a4dad6, getChildNodes as $cd5ea4b915021f1d$export$1005530eda016c13, getFirstItem as $cd5ea4b915021f1d$export$fbdeaa6a76694f71} from "../collections/getChildNodes.mjs";
import {Selection as $8b2540e09867b15e$export$52baac22726c72bf} from "./Selection.mjs";

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

class $4a07ac835f260f78$export$6c8a5aaad13c9852 {
    constructor(collection, state, options){
        this.collection = collection;
        this.state = state;
        this.allowsCellSelection = options?.allowsCellSelection ?? false;
        this._isSelectAll = null;
        this.layoutDelegate = options?.layoutDelegate || null;
        this.fullCollection = options?.fullCollection || null;
    }
    /**
   * The type of selection that is allowed in the collection.
   */ get selectionMode() {
        return this.state.selectionMode;
    }
    /**
   * Whether the collection allows empty selection.
   */ get disallowEmptySelection() {
        return this.state.disallowEmptySelection;
    }
    /**
   * The selection behavior for the collection.
   */ get selectionBehavior() {
        return this.state.selectionBehavior;
    }
    /**
   * Sets the selection behavior for the collection.
   */ setSelectionBehavior(selectionBehavior) {
        this.state.setSelectionBehavior(selectionBehavior);
    }
    /**
   * Whether the collection is currently focused.
   */ get isFocused() {
        return this.state.isFocused;
    }
    /**
   * Sets whether the collection is focused.
   */ setFocused(isFocused) {
        this.state.setFocused(isFocused);
    }
    /**
   * The current focused key in the collection.
   */ get focusedKey() {
        return this.state.focusedKey;
    }
    /** Whether the first or last child of the focused key should receive focus. */ get childFocusStrategy() {
        return this.state.childFocusStrategy;
    }
    /**
   * Sets the focused key.
   */ setFocusedKey(key, childFocusStrategy) {
        if (key == null || this.collection.getItem(key)) this.state.setFocusedKey(key, childFocusStrategy);
    }
    /**
   * The currently selected keys in the collection.
   */ get selectedKeys() {
        return this.state.selectedKeys === 'all' ? new Set(this.getSelectAllKeys()) : this.state.selectedKeys;
    }
    /**
   * The raw selection value for the collection.
   * Either 'all' for select all, or a set of keys.
   */ get rawSelection() {
        return this.state.selectedKeys;
    }
    /**
   * Returns whether a key is selected.
   */ isSelected(key) {
        if (this.state.selectionMode === 'none') return false;
        let mappedKey = this.getKey(key);
        if (mappedKey == null) return false;
        return this.state.selectedKeys === 'all' ? this.canSelectItem(mappedKey) : this.state.selectedKeys.has(mappedKey);
    }
    /**
   * Whether the selection is empty.
   */ get isEmpty() {
        return this.state.selectedKeys !== 'all' && this.state.selectedKeys.size === 0;
    }
    /**
   * Whether all items in the collection are selected.
   */ get isSelectAll() {
        if (this.isEmpty) return false;
        if (this.state.selectedKeys === 'all') return true;
        if (this._isSelectAll != null) return this._isSelectAll;
        let allKeys = this.getSelectAllKeys();
        let selectedKeys = this.state.selectedKeys;
        this._isSelectAll = allKeys.every((k)=>selectedKeys.has(k));
        return this._isSelectAll;
    }
    get firstSelectedKey() {
        let first = null;
        for (let key of this.state.selectedKeys){
            let item = this.collection.getItem(key);
            if (!first || item && (0, $cd5ea4b915021f1d$export$8c434b3a7a4dad6)(this.collection, item, first) < 0) first = item;
        }
        return first?.key ?? null;
    }
    get lastSelectedKey() {
        let last = null;
        for (let key of this.state.selectedKeys){
            let item = this.collection.getItem(key);
            if (!last || item && (0, $cd5ea4b915021f1d$export$8c434b3a7a4dad6)(this.collection, item, last) > 0) last = item;
        }
        return last?.key ?? null;
    }
    get disabledKeys() {
        return this.state.disabledKeys;
    }
    get disabledBehavior() {
        return this.state.disabledBehavior;
    }
    /**
   * Extends the selection to the given key.
   */ extendSelection(toKey) {
        if (this.selectionMode === 'none') return;
        if (this.selectionMode === 'single') {
            this.replaceSelection(toKey);
            return;
        }
        let mappedToKey = this.getKey(toKey);
        if (mappedToKey == null) return;
        let selection;
        // Only select the one key if coming from a select all.
        if (this.state.selectedKeys === 'all') selection = new (0, $8b2540e09867b15e$export$52baac22726c72bf)([
            mappedToKey
        ], mappedToKey, mappedToKey);
        else {
            let selectedKeys = this.state.selectedKeys;
            let anchorKey = selectedKeys.anchorKey ?? mappedToKey;
            selection = new (0, $8b2540e09867b15e$export$52baac22726c72bf)(selectedKeys, anchorKey, mappedToKey);
            for (let key of this.getKeyRange(anchorKey, selectedKeys.currentKey ?? mappedToKey))selection.delete(key);
            for (let key of this.getKeyRange(mappedToKey, anchorKey))if (this.canSelectItem(key)) selection.add(key);
        }
        this.state.setSelectedKeys(selection);
    }
    getKeyRange(from, to) {
        let fromItem = this.collection.getItem(from);
        let toItem = this.collection.getItem(to);
        if (fromItem && toItem) {
            if ((0, $cd5ea4b915021f1d$export$8c434b3a7a4dad6)(this.collection, fromItem, toItem) <= 0) return this.getKeyRangeInternal(from, to);
            return this.getKeyRangeInternal(to, from);
        }
        return [];
    }
    getKeyRangeInternal(from, to) {
        if (this.layoutDelegate?.getKeyRange) return this.layoutDelegate.getKeyRange(from, to);
        let keys = [];
        let key = from;
        while(key != null){
            let item = this.collection.getItem(key);
            if (item && (item.type === 'item' || item.type === 'cell' && this.allowsCellSelection)) keys.push(key);
            if (key === to) return keys;
            key = this.collection.getKeyAfter(key);
        }
        return [];
    }
    getKey(key) {
        let item = this.collection.getItem(key);
        if (!item) // ¯\_(ツ)_/¯
        return key;
        // If cell selection is allowed, just return the key.
        if (item.type === 'cell' && this.allowsCellSelection) return key;
        // Find a parent item to select
        while(item && item.type !== 'item' && item.parentKey != null)item = this.collection.getItem(item.parentKey);
        if (!item || item.type !== 'item') return null;
        return item.key;
    }
    /**
   * Toggles whether the given key is selected.
   */ toggleSelection(key) {
        if (this.selectionMode === 'none') return;
        if (this.selectionMode === 'single' && !this.isSelected(key)) {
            this.replaceSelection(key);
            return;
        }
        let mappedKey = this.getKey(key);
        if (mappedKey == null) return;
        let keys = new (0, $8b2540e09867b15e$export$52baac22726c72bf)(this.state.selectedKeys === 'all' ? this.getSelectAllKeys() : this.state.selectedKeys);
        if (keys.has(mappedKey)) keys.delete(mappedKey);
        else if (this.canSelectItem(mappedKey)) {
            keys.add(mappedKey);
            keys.anchorKey = mappedKey;
            keys.currentKey = mappedKey;
        }
        if (this.disallowEmptySelection && keys.size === 0) return;
        this.state.setSelectedKeys(keys);
    }
    /**
   * Replaces the selection with only the given key.
   */ replaceSelection(key) {
        if (this.selectionMode === 'none') return;
        let mappedKey = this.getKey(key);
        if (mappedKey == null) return;
        let selection = this.canSelectItem(mappedKey) ? new (0, $8b2540e09867b15e$export$52baac22726c72bf)([
            mappedKey
        ], mappedKey, mappedKey) : new (0, $8b2540e09867b15e$export$52baac22726c72bf)();
        this.state.setSelectedKeys(selection);
    }
    /**
   * Replaces the selection with the given keys.
   */ setSelectedKeys(keys) {
        if (this.selectionMode === 'none') return;
        let selection = new (0, $8b2540e09867b15e$export$52baac22726c72bf)();
        for (let key of keys){
            let mappedKey = this.getKey(key);
            if (mappedKey != null) {
                selection.add(mappedKey);
                if (this.selectionMode === 'single') break;
            }
        }
        this.state.setSelectedKeys(selection);
    }
    getSelectAllKeys() {
        // Use the full (unfiltered) collection when available so that materializing
        // the 'all' selection includes items that are currently filtered out (e.g. by Autocomplete).
        let collection = this.fullCollection ?? this.collection;
        let keys = [];
        let addKeys = (key)=>{
            while(key != null){
                if (this.canSelectItemIn(key, collection)) {
                    let item = collection.getItem(key);
                    if (item?.type === 'item') keys.push(key);
                    // Add child keys. If cell selection is allowed, then include item children too.
                    if (item?.hasChildNodes && (this.allowsCellSelection || item.type !== 'item')) addKeys((0, $cd5ea4b915021f1d$export$fbdeaa6a76694f71)((0, $cd5ea4b915021f1d$export$1005530eda016c13)(item, collection))?.key ?? null);
                }
                key = collection.getKeyAfter(key);
            }
        };
        addKeys(collection.getFirstKey());
        return keys;
    }
    /**
   * Selects all items in the collection.
   */ selectAll() {
        if (!this.isSelectAll && this.selectionMode === 'multiple') this.state.setSelectedKeys('all');
    }
    /**
   * Removes all keys from the selection.
   */ clearSelection() {
        if (!this.disallowEmptySelection && (this.state.selectedKeys === 'all' || this.state.selectedKeys.size > 0)) this.state.setSelectedKeys(new (0, $8b2540e09867b15e$export$52baac22726c72bf)());
    }
    /**
   * Toggles between select all and an empty selection.
   */ toggleSelectAll() {
        if (this.isSelectAll) this.clearSelection();
        else this.selectAll();
    }
    select(key, e) {
        if (this.selectionMode === 'none') return;
        if (this.selectionMode === 'single') {
            if (this.isSelected(key) && !this.disallowEmptySelection) this.toggleSelection(key);
            else this.replaceSelection(key);
        } else if (this.selectionBehavior === 'toggle' || e && (e.pointerType === 'touch' || e.pointerType === 'virtual')) // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
        this.toggleSelection(key);
        else this.replaceSelection(key);
    }
    /**
   * Returns whether the current selection is equal to the given selection.
   */ isSelectionEqual(selection) {
        if (selection === this.state.selectedKeys) return true;
        // Check if the set of keys match.
        let selectedKeys = this.selectedKeys;
        if (selection.size !== selectedKeys.size) return false;
        for (let key of selection){
            if (!selectedKeys.has(key)) return false;
        }
        for (let key of selectedKeys){
            if (!selection.has(key)) return false;
        }
        return true;
    }
    canSelectItem(key) {
        return this.canSelectItemIn(key, this.collection);
    }
    canSelectItemIn(key, collection) {
        if (this.state.selectionMode === 'none' || this.state.disabledKeys.has(key)) return false;
        let item = collection.getItem(key);
        if (!item || item?.props?.isDisabled || item.type === 'cell' && !this.allowsCellSelection) return false;
        return true;
    }
    isDisabled(key) {
        let item = this.collection.getItem(key);
        return this.state.disabledBehavior === 'all' && (this.state.disabledKeys.has(key) || !!item?.props?.isDisabled) && item?.props?.disabledBehavior !== 'selection';
    }
    isLink(key) {
        return !!this.collection.getItem(key)?.props?.href;
    }
    getItemProps(key) {
        return this.collection.getItem(key)?.props;
    }
    withCollection(collection) {
        return new $4a07ac835f260f78$export$6c8a5aaad13c9852(collection, this.state, {
            allowsCellSelection: this.allowsCellSelection,
            layoutDelegate: this.layoutDelegate || undefined,
            fullCollection: this.fullCollection ?? this.collection
        });
    }
}


export {$4a07ac835f260f78$export$6c8a5aaad13c9852 as SelectionManager};
//# sourceMappingURL=SelectionManager.mjs.map
