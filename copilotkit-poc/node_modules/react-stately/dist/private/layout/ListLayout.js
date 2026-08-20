import {getChildNodes as $684db7aaf37fc901$export$1005530eda016c13} from "../collections/getChildNodes.js";
import {Layout as $bcf18cb0a16f75f6$export$c84671f46d6a1ca} from "../virtualizer/Layout.js";
import {LayoutInfo as $dcdbc700dd92e06f$export$7e0eeb9da702a085} from "../virtualizer/LayoutInfo.js";
import {Rect as $546350db2c358941$export$c79fc6492f3af13d} from "../virtualizer/Rect.js";
import {Size as $266cbd2785be3a2c$export$cb6da89c6af1a8ec} from "../virtualizer/Size.js";

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




const $f46b9da090161919$var$DEFAULT_HEIGHT = 48;
class $f46b9da090161919$export$cacbb3924155d68e extends (0, $bcf18cb0a16f75f6$export$c84671f46d6a1ca) {
    // Backward compatibility for subclassing.
    get collection() {
        return this.virtualizer.collection;
    }
    /** @deprecated Use `rowSize` instead. */ get rowHeight() {
        return this.rowSize;
    }
    /** @deprecated Use `estimatedRowSize` instead. */ get estimatedRowHeight() {
        return this.estimatedRowSize;
    }
    /** @deprecated Use `headingSize` instead. */ get headingHeight() {
        return this.headingSize;
    }
    /** @deprecated Use `estimatedHeadingSize` instead. */ get estimatedHeadingHeight() {
        return this.estimatedHeadingSize;
    }
    /** @deprecated Use `loaderSize` instead. */ get loaderHeight() {
        return this.loaderSize;
    }
    getLayoutInfo(key) {
        var _this_layoutNodes_get;
        this.ensureLayoutInfo(key);
        return ((_this_layoutNodes_get = this.layoutNodes.get(key)) === null || _this_layoutNodes_get === void 0 ? void 0 : _this_layoutNodes_get.layoutInfo) || null;
    }
    getVisibleLayoutInfos(rect) {
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        // Adjust rect to keep number of visible rows consistent.
        // (only if height > 1 or width > 1 for getDropTargetFromPoint)
        if (rect[heightProperty] > 1) {
            var _this_rowSize, _ref;
            let rowHeight = ((_ref = (_this_rowSize = this.rowSize) !== null && _this_rowSize !== void 0 ? _this_rowSize : this.estimatedRowSize) !== null && _ref !== void 0 ? _ref : $f46b9da090161919$var$DEFAULT_HEIGHT) + this.gap;
            // Clone only before mutating
            rect = rect.copy();
            let offset = Math.floor(rect[offsetProperty] / rowHeight) * rowHeight;
            let height = rect[heightProperty] + rect[offsetProperty] - offset;
            rect[offsetProperty] = offset;
            rect[heightProperty] = Math.ceil(height / rowHeight) * rowHeight;
        }
        // If layout hasn't yet been done for the requested rect, union the
        // new rect with the existing valid rect, and recompute.
        this.layoutIfNeeded(rect);
        let res = [];
        let addNodes = (nodes)=>{
            for (let node of nodes)if (this.isVisible(node, rect)) {
                res.push(node.layoutInfo);
                if (node.children) addNodes(node.children);
            }
        };
        addNodes(this.rootNodes);
        return res;
    }
    layoutIfNeeded(rect) {
        if (!this.lastCollection) return;
        if (!this.requestedRect.containsRect(rect)) {
            this.requestedRect = this.requestedRect.union(rect);
            this.rootNodes = this.buildCollection();
        }
        // Ensure all of the persisted keys are available.
        for (let key of this.virtualizer.persistedKeys){
            if (this.ensureLayoutInfo(key)) return;
        }
    }
    ensureLayoutInfo(key) {
        // If the layout info wasn't found, it might be outside the bounds of the area that we've
        // computed layout for so far. This can happen when accessing a random key, e.g pressing Home/End.
        // Compute the full layout and try again.
        if (!this.layoutNodes.has(key) && this.requestedRect.area < this.contentSize.area && this.lastCollection) {
            this.requestedRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(0, 0, Infinity, Infinity);
            this.rootNodes = this.buildCollection();
            this.requestedRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(0, 0, this.contentSize.width, this.contentSize.height);
            return true;
        }
        return false;
    }
    isVisible(node, rect) {
        return node.layoutInfo.rect.intersects(rect) || node.layoutInfo.isSticky || node.layoutInfo.type === 'header' || node.layoutInfo.type === 'loader' || this.virtualizer.isPersistedKey(node.layoutInfo.key);
    }
    shouldInvalidateEverything(invalidationContext) {
        // Invalidate cache if the size of the collection changed.
        // In this case, we need to recalculate the entire layout.
        // Also invalidate if fixed sizes/gaps change.
        let options = invalidationContext.layoutOptions;
        var _options_rowSize, _ref, _options_orientation, _options_headingSize, _ref1, _options_loaderSize, _ref2, _options_gap, _options_padding;
        return invalidationContext.sizeChanged || this.rowSize !== ((_ref = (_options_rowSize = options === null || options === void 0 ? void 0 : options.rowSize) !== null && _options_rowSize !== void 0 ? _options_rowSize : options === null || options === void 0 ? void 0 : options.rowHeight) !== null && _ref !== void 0 ? _ref : this.rowSize) || this.orientation !== ((_options_orientation = options === null || options === void 0 ? void 0 : options.orientation) !== null && _options_orientation !== void 0 ? _options_orientation : this.orientation) || this.headingSize !== ((_ref1 = (_options_headingSize = options === null || options === void 0 ? void 0 : options.headingSize) !== null && _options_headingSize !== void 0 ? _options_headingSize : options === null || options === void 0 ? void 0 : options.headingHeight) !== null && _ref1 !== void 0 ? _ref1 : this.headingSize) || this.loaderSize !== ((_ref2 = (_options_loaderSize = options === null || options === void 0 ? void 0 : options.loaderSize) !== null && _options_loaderSize !== void 0 ? _options_loaderSize : options === null || options === void 0 ? void 0 : options.loaderHeight) !== null && _ref2 !== void 0 ? _ref2 : this.loaderSize) || this.gap !== ((_options_gap = options === null || options === void 0 ? void 0 : options.gap) !== null && _options_gap !== void 0 ? _options_gap : this.gap) || this.padding !== ((_options_padding = options === null || options === void 0 ? void 0 : options.padding) !== null && _options_padding !== void 0 ? _options_padding : this.padding);
    }
    shouldInvalidateLayoutOptions(newOptions, oldOptions) {
        var _newOptions_rowSize, _oldOptions_rowSize, _newOptions_estimatedRowSize, _oldOptions_estimatedRowSize, _newOptions_headingSize, _oldOptions_headingSize, _newOptions_estimatedHeadingSize, _oldOptions_estimatedHeadingSize, _newOptions_loaderSize, _oldOptions_loaderSize;
        return ((_newOptions_rowSize = newOptions === null || newOptions === void 0 ? void 0 : newOptions.rowSize) !== null && _newOptions_rowSize !== void 0 ? _newOptions_rowSize : newOptions === null || newOptions === void 0 ? void 0 : newOptions.rowHeight) !== ((_oldOptions_rowSize = oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.rowSize) !== null && _oldOptions_rowSize !== void 0 ? _oldOptions_rowSize : oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.rowHeight) || newOptions.orientation !== oldOptions.orientation || ((_newOptions_estimatedRowSize = newOptions === null || newOptions === void 0 ? void 0 : newOptions.estimatedRowSize) !== null && _newOptions_estimatedRowSize !== void 0 ? _newOptions_estimatedRowSize : newOptions === null || newOptions === void 0 ? void 0 : newOptions.estimatedRowHeight) !== ((_oldOptions_estimatedRowSize = oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.estimatedRowSize) !== null && _oldOptions_estimatedRowSize !== void 0 ? _oldOptions_estimatedRowSize : oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.estimatedRowHeight) || ((_newOptions_headingSize = newOptions === null || newOptions === void 0 ? void 0 : newOptions.headingSize) !== null && _newOptions_headingSize !== void 0 ? _newOptions_headingSize : newOptions === null || newOptions === void 0 ? void 0 : newOptions.headingHeight) !== ((_oldOptions_headingSize = oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.headingSize) !== null && _oldOptions_headingSize !== void 0 ? _oldOptions_headingSize : oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.headingHeight) || ((_newOptions_estimatedHeadingSize = newOptions === null || newOptions === void 0 ? void 0 : newOptions.estimatedHeadingSize) !== null && _newOptions_estimatedHeadingSize !== void 0 ? _newOptions_estimatedHeadingSize : newOptions === null || newOptions === void 0 ? void 0 : newOptions.estimatedHeadingHeight) !== ((_oldOptions_estimatedHeadingSize = oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.estimatedHeadingSize) !== null && _oldOptions_estimatedHeadingSize !== void 0 ? _oldOptions_estimatedHeadingSize : oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.estimatedHeadingHeight) || ((_newOptions_loaderSize = newOptions === null || newOptions === void 0 ? void 0 : newOptions.loaderSize) !== null && _newOptions_loaderSize !== void 0 ? _newOptions_loaderSize : newOptions === null || newOptions === void 0 ? void 0 : newOptions.loaderHeight) !== ((_oldOptions_loaderSize = oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.loaderSize) !== null && _oldOptions_loaderSize !== void 0 ? _oldOptions_loaderSize : oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.loaderHeight) || newOptions.dropIndicatorThickness !== oldOptions.dropIndicatorThickness || newOptions.gap !== oldOptions.gap || newOptions.padding !== oldOptions.padding;
    }
    update(invalidationContext) {
        let collection = this.virtualizer.collection;
        // Reset valid rect if we will have to invalidate everything.
        // Otherwise we can reuse cached layout infos outside the current visible rect.
        this.invalidateEverything = this.shouldInvalidateEverything(invalidationContext);
        if (this.invalidateEverything) {
            this.requestedRect = this.virtualizer.visibleRect.copy();
            this.layoutNodes.clear();
        }
        let options = invalidationContext.layoutOptions;
        var _options_rowSize, _ref;
        this.rowSize = (_ref = (_options_rowSize = options === null || options === void 0 ? void 0 : options.rowSize) !== null && _options_rowSize !== void 0 ? _options_rowSize : options === null || options === void 0 ? void 0 : options.rowHeight) !== null && _ref !== void 0 ? _ref : this.rowSize;
        var _options_orientation;
        this.orientation = (_options_orientation = options === null || options === void 0 ? void 0 : options.orientation) !== null && _options_orientation !== void 0 ? _options_orientation : this.orientation;
        var _options_estimatedRowSize, _ref1;
        this.estimatedRowSize = (_ref1 = (_options_estimatedRowSize = options === null || options === void 0 ? void 0 : options.estimatedRowSize) !== null && _options_estimatedRowSize !== void 0 ? _options_estimatedRowSize : options === null || options === void 0 ? void 0 : options.estimatedRowHeight) !== null && _ref1 !== void 0 ? _ref1 : this.estimatedRowSize;
        var _options_headingSize, _ref2;
        this.headingSize = (_ref2 = (_options_headingSize = options === null || options === void 0 ? void 0 : options.headingSize) !== null && _options_headingSize !== void 0 ? _options_headingSize : options === null || options === void 0 ? void 0 : options.headingHeight) !== null && _ref2 !== void 0 ? _ref2 : this.headingSize;
        var _options_estimatedHeadingSize, _ref3;
        this.estimatedHeadingSize = (_ref3 = (_options_estimatedHeadingSize = options === null || options === void 0 ? void 0 : options.estimatedHeadingSize) !== null && _options_estimatedHeadingSize !== void 0 ? _options_estimatedHeadingSize : options === null || options === void 0 ? void 0 : options.estimatedHeadingHeight) !== null && _ref3 !== void 0 ? _ref3 : this.estimatedHeadingSize;
        var _options_loaderSize, _ref4;
        this.loaderSize = (_ref4 = (_options_loaderSize = options === null || options === void 0 ? void 0 : options.loaderSize) !== null && _options_loaderSize !== void 0 ? _options_loaderSize : options === null || options === void 0 ? void 0 : options.loaderHeight) !== null && _ref4 !== void 0 ? _ref4 : this.loaderSize;
        var _options_dropIndicatorThickness;
        this.dropIndicatorThickness = (_options_dropIndicatorThickness = options === null || options === void 0 ? void 0 : options.dropIndicatorThickness) !== null && _options_dropIndicatorThickness !== void 0 ? _options_dropIndicatorThickness : this.dropIndicatorThickness;
        var _options_gap;
        this.gap = (_options_gap = options === null || options === void 0 ? void 0 : options.gap) !== null && _options_gap !== void 0 ? _options_gap : this.gap;
        var _options_padding;
        this.padding = (_options_padding = options === null || options === void 0 ? void 0 : options.padding) !== null && _options_padding !== void 0 ? _options_padding : this.padding;
        this.rootNodes = this.buildCollection();
        // Remove deleted layout nodes
        if (this.lastCollection && collection !== this.lastCollection) {
            for (let key of this.lastCollection.getKeys())if (!collection.getItem(key)) {
                let layoutNode = this.layoutNodes.get(key);
                if (layoutNode) this.layoutNodes.delete(key);
            }
        }
        this.lastCollection = collection;
        this.invalidateEverything = false;
        this.validRect = this.requestedRect.copy();
    }
    buildCollection(offset = this.padding) {
        let collection = this.virtualizer.collection;
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let maxOffsetProperty = this.orientation === 'horizontal' ? 'maxX' : 'maxY';
        // filter out content nodes since we don't want them to affect the height
        // Tree specific for now, if we add content nodes to other collection items, we might need to reconsider this
        let collectionNodes = $f46b9da090161919$var$toArray(collection, (node)=>node.type !== 'content');
        let loaderNodes = collectionNodes.filter((node)=>node.type === 'loader');
        let nodes = [];
        let isEmptyOrLoading = (collection === null || collection === void 0 ? void 0 : collection.size) === 0;
        if (isEmptyOrLoading) offset = 0;
        for (let node of collectionNodes){
            var _this_rowSize, _ref;
            let rowHeight = ((_ref = (_this_rowSize = this.rowSize) !== null && _this_rowSize !== void 0 ? _this_rowSize : this.estimatedRowSize) !== null && _ref !== void 0 ? _ref : $f46b9da090161919$var$DEFAULT_HEIGHT) + this.gap;
            // Skip rows before the valid rectangle unless they are already cached.
            if (node.type === 'item' && offset + rowHeight < this.requestedRect[offsetProperty] && !this.isValid(node, offset)) {
                offset += rowHeight;
                continue;
            }
            let layoutNode = this.orientation === 'horizontal' ? this.buildChild(node, offset, this.padding, null) : this.buildChild(node, this.padding, offset, null);
            offset = layoutNode.layoutInfo.rect[maxOffsetProperty] + this.gap;
            nodes.push(layoutNode);
            if (node.type === 'loader') {
                let index = loaderNodes.indexOf(node);
                loaderNodes.splice(index, 1);
            }
            // Build each loader that exists in the collection that is outside the visible rect so that they are persisted
            // at the proper estimated location. If the node.type is "section" then we don't do this shortcut since we have to
            // build the sections to see how tall they are.
            if ((node.type === 'item' || node.type === 'loader') && offset > this.requestedRect[maxOffsetProperty]) {
                let lastProcessedIndex = collectionNodes.indexOf(node);
                for (let loaderNode of loaderNodes){
                    let loaderNodeIndex = collectionNodes.indexOf(loaderNode);
                    // Subtract by an additional 1 since we've already added the current item's height to y
                    offset += (loaderNodeIndex - lastProcessedIndex - 1) * rowHeight;
                    let loader = this.orientation === 'horizontal' ? this.buildChild(loaderNode, offset, this.padding, null) : this.buildChild(loaderNode, this.padding, offset, null);
                    nodes.push(loader);
                    offset = loader.layoutInfo.rect[maxOffsetProperty];
                    lastProcessedIndex = loaderNodeIndex;
                }
                // Account for the rest of the items after the last loader spinner, subtract by 1 since we've processed the current node's height already
                offset += (collectionNodes.length - lastProcessedIndex - 1) * rowHeight;
                break;
            }
        }
        offset = Math.max(offset - this.gap, 0);
        offset += isEmptyOrLoading ? 0 : this.padding;
        this.contentSize = this.orientation === 'horizontal' ? new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(offset, this.virtualizer.size.height) : new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(this.virtualizer.size.width, offset);
        return nodes;
    }
    isValid(node, offset) {
        let cached = this.layoutNodes.get(node.key);
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        return !this.invalidateEverything && !!cached && cached.node === node && offset === cached.layoutInfo.rect[offsetProperty] && cached.layoutInfo.rect.intersects(this.validRect) && cached.validRect.containsRect(cached.layoutInfo.rect.intersection(this.requestedRect));
    }
    buildChild(node, x, y, parentKey) {
        if (this.isValid(node, this.orientation === 'horizontal' ? x : y)) return this.layoutNodes.get(node.key);
        let layoutNode = this.buildNode(node, x, y);
        layoutNode.layoutInfo.parentKey = parentKey !== null && parentKey !== void 0 ? parentKey : null;
        layoutNode.layoutInfo.allowOverflow = true;
        this.layoutNodes.set(node.key, layoutNode);
        return layoutNode;
    }
    buildNode(node, x, y) {
        switch(node.type){
            case 'section':
                return this.buildSection(node, x, y);
            case 'item':
                return this.buildItem(node, x, y);
            case 'header':
                return this.buildSectionHeader(node, x, y);
            case 'loader':
                return this.buildLoader(node, x, y);
            case 'separator':
                return this.buildItem(node, x, y);
            default:
                throw new Error('Unsupported node type: ' + node.type);
        }
    }
    buildLoader(node, x, y) {
        let rect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, this.padding, 0);
        let layoutInfo = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)(node.type, node.key, rect);
        // Note that if the user provides isLoading to their sentinel during a case where they only want to render the emptyState, this will reserve
        // room for the loader alongside rendering the emptyState
        if (this.orientation === 'horizontal') {
            rect.height = this.virtualizer.contentSize.height - this.padding - y;
            var _this_loaderSize, _ref, _ref1;
            rect.width = node.props.isLoading ? (_ref1 = (_ref = (_this_loaderSize = this.loaderSize) !== null && _this_loaderSize !== void 0 ? _this_loaderSize : this.rowSize) !== null && _ref !== void 0 ? _ref : this.estimatedRowSize) !== null && _ref1 !== void 0 ? _ref1 : $f46b9da090161919$var$DEFAULT_HEIGHT : 0;
        } else {
            rect.width = this.virtualizer.contentSize.width - this.padding - x;
            var _this_loaderSize1, _ref2, _ref3;
            rect.height = node.props.isLoading ? (_ref3 = (_ref2 = (_this_loaderSize1 = this.loaderSize) !== null && _this_loaderSize1 !== void 0 ? _this_loaderSize1 : this.rowSize) !== null && _ref2 !== void 0 ? _ref2 : this.estimatedRowSize) !== null && _ref3 !== void 0 ? _ref3 : $f46b9da090161919$var$DEFAULT_HEIGHT : 0;
        }
        return {
            layoutInfo: layoutInfo,
            validRect: rect.intersection(this.requestedRect)
        };
    }
    buildSection(node, x, y) {
        let collection = this.virtualizer.collection;
        let width = this.virtualizer.size.width - this.padding - x;
        let height = this.virtualizer.size.height - this.padding - y;
        let rect = this.orientation === 'horizontal' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, 0, height) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, width, 0);
        let layoutInfo = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)(node.type, node.key, rect);
        let offset = this.orientation === 'horizontal' ? x : y;
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let maxOffsetProperty = this.orientation === 'horizontal' ? 'maxX' : 'maxY';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        let skipped = 0;
        let children = [];
        for (let child of (0, $684db7aaf37fc901$export$1005530eda016c13)(node, collection)){
            // skip if it is a content node, Tree specific for now, if we add content nodes to other collection items, we might need to reconsider this
            if (child.type === 'content') continue;
            var _this_rowSize, _ref;
            let rowHeight = ((_ref = (_this_rowSize = this.rowSize) !== null && _this_rowSize !== void 0 ? _this_rowSize : this.estimatedRowSize) !== null && _ref !== void 0 ? _ref : $f46b9da090161919$var$DEFAULT_HEIGHT) + this.gap;
            // Skip rows before the valid rectangle unless they are already cached.
            if (offset + rowHeight < this.requestedRect[offsetProperty] && !this.isValid(node, offset)) {
                offset += rowHeight;
                skipped++;
                continue;
            }
            let layoutNode = this.orientation === 'horizontal' ? this.buildChild(child, offset, y, layoutInfo.key) : this.buildChild(child, x, offset, layoutInfo.key);
            offset = layoutNode.layoutInfo.rect[maxOffsetProperty] + this.gap;
            children.push(layoutNode);
            if (offset > this.requestedRect[maxOffsetProperty]) {
                // Estimate the remaining height for rows that we don't need to layout right now.
                offset += ([
                    ...(0, $684db7aaf37fc901$export$1005530eda016c13)(node, collection)
                ].length - (children.length + skipped)) * rowHeight;
                break;
            }
        }
        offset -= this.gap;
        rect[heightProperty] = offset - (this.orientation === 'horizontal' ? x : y);
        return {
            layoutInfo: layoutInfo,
            children: children,
            validRect: layoutInfo.rect.intersection(this.requestedRect),
            node: node
        };
    }
    buildSectionHeader(node, x, y) {
        let widthProperty = this.orientation === 'horizontal' ? 'height' : 'width';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        let width = this.virtualizer.size[widthProperty] - this.padding - (this.orientation === 'horizontal' ? y : x);
        let rectHeight = this.headingSize;
        let isEstimated = false;
        // If no explicit height is available, use an estimated height.
        if (rectHeight == null) {
            // If a previous version of this layout info exists, reuse its height.
            // Mark as estimated if the size of the overall virtualizer changed,
            // or the content of the item changed.
            let previousLayoutNode = this.layoutNodes.get(node.key);
            let previousLayoutInfo = previousLayoutNode === null || previousLayoutNode === void 0 ? void 0 : previousLayoutNode.layoutInfo;
            if (previousLayoutInfo) {
                let curNode = this.virtualizer.collection.getItem(node.key);
                let lastNode = this.lastCollection ? this.lastCollection.getItem(node.key) : null;
                rectHeight = previousLayoutNode.layoutInfo.rect[heightProperty];
                isEstimated = width !== previousLayoutInfo.rect[widthProperty] || curNode !== lastNode || previousLayoutInfo.estimatedSize;
            } else {
                rectHeight = node.rendered ? this.estimatedHeadingSize : 0;
                isEstimated = true;
            }
        }
        if (rectHeight == null) rectHeight = $f46b9da090161919$var$DEFAULT_HEIGHT;
        let headerRect = this.orientation === 'horizontal' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, rectHeight, width - y) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, width - x, rectHeight);
        let header = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)('header', node.key, headerRect);
        header.estimatedSize = isEstimated;
        return {
            layoutInfo: header,
            children: [],
            validRect: header.rect.intersection(this.requestedRect),
            node: node
        };
    }
    buildItem(node, x, y) {
        let widthProperty = this.orientation === 'horizontal' ? 'height' : 'width';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        let width = this.virtualizer.size[widthProperty] - this.padding - (this.orientation === 'horizontal' ? y : x);
        let rectHeight = this.rowSize;
        let isEstimated = false;
        // If no explicit height is available, use an estimated height.
        if (rectHeight == null) {
            // If a previous version of this layout info exists, reuse its height.
            // Mark as estimated if the size of the overall virtualizer changed,
            // or the content of the item changed.
            let previousLayoutNode = this.layoutNodes.get(node.key);
            if (previousLayoutNode) {
                rectHeight = previousLayoutNode.layoutInfo.rect[heightProperty];
                isEstimated = width !== previousLayoutNode.layoutInfo.rect[widthProperty] || node !== previousLayoutNode.node || previousLayoutNode.layoutInfo.estimatedSize;
            } else {
                rectHeight = this.estimatedRowSize;
                isEstimated = true;
            }
        }
        if (rectHeight == null) rectHeight = $f46b9da090161919$var$DEFAULT_HEIGHT;
        let rect = this.orientation === 'horizontal' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, rectHeight, width) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, width, rectHeight);
        let layoutInfo = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)(node.type, node.key, rect);
        layoutInfo.estimatedSize = isEstimated;
        return {
            layoutInfo: layoutInfo,
            children: [],
            validRect: layoutInfo.rect.intersection(this.requestedRect),
            node: node
        };
    }
    updateItemSize(key, size) {
        let layoutNode = this.layoutNodes.get(key);
        // If no layoutInfo, item has been deleted/removed.
        if (!layoutNode) return false;
        let collection = this.virtualizer.collection;
        let layoutInfo = layoutNode.layoutInfo;
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        layoutInfo.estimatedSize = false;
        if (layoutInfo.rect[heightProperty] !== size[heightProperty]) {
            var _layoutNode_node;
            // Copy layout info rather than mutating so that later caches are invalidated.
            let newLayoutInfo = layoutInfo.copy();
            newLayoutInfo.rect[heightProperty] = size[heightProperty];
            layoutNode.layoutInfo = newLayoutInfo;
            // Items after this layoutInfo will need to be repositioned to account for the new height.
            // Adjust the validRect so that only items above remain valid.
            this.validRect[heightProperty] = Math.min(this.validRect[heightProperty], layoutInfo.rect[offsetProperty] - this.validRect[offsetProperty]);
            // The requestedRect also needs to be adjusted to account for the height difference.
            if (((_layoutNode_node = layoutNode.node) === null || _layoutNode_node === void 0 ? void 0 : _layoutNode_node.type) === 'item') this.requestedRect[heightProperty] += newLayoutInfo.rect[heightProperty] - layoutInfo.rect[heightProperty];
            // Invalidate layout for this layout node and all parents
            this.updateLayoutNode(key, layoutInfo, newLayoutInfo);
            let node = layoutInfo.parentKey != null ? collection.getItem(layoutInfo.parentKey) : null;
            while(node){
                this.updateLayoutNode(node.key, layoutInfo, newLayoutInfo);
                node = node.parentKey != null ? collection.getItem(node.parentKey) : null;
            }
            return true;
        }
        return false;
    }
    updateLayoutNode(key, oldLayoutInfo, newLayoutInfo) {
        let n = this.layoutNodes.get(key);
        if (n) {
            // Invalidate by intersecting the validRect of this node with the overall validRect.
            n.validRect = n.validRect.intersection(this.validRect);
            // Replace layout info in LayoutNode
            if (n.layoutInfo === oldLayoutInfo) n.layoutInfo = newLayoutInfo;
        }
    }
    getContentSize() {
        return this.contentSize;
    }
    getDropTargetFromPoint(x, y, isValidDropTarget) {
        x += this.virtualizer.visibleRect.x;
        y += this.virtualizer.visibleRect.y;
        // Find the closest item within on either side of the point using the gap width.
        let searchRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, Math.max(0, y - this.gap), 1, Math.max(1, this.gap * 2));
        let candidates = this.getVisibleLayoutInfos(searchRect);
        let key = null;
        let minDistance = Infinity;
        for (let candidate of candidates){
            // Ignore items outside the search rect, e.g. persisted keys.
            if (!candidate.rect.intersects(searchRect)) continue;
            let yDist = Math.abs(candidate.rect.y - y);
            let maxYDist = Math.abs(candidate.rect.maxY - y);
            let dist = Math.min(yDist, maxYDist);
            if (dist < minDistance) {
                minDistance = dist;
                key = candidate.key;
            }
        }
        if (key == null || this.virtualizer.collection.size === 0) return {
            type: 'root'
        };
        let layoutInfo = this.getLayoutInfo(key);
        if (!layoutInfo) return null;
        let rect = layoutInfo.rect;
        let target = {
            type: 'item',
            key: layoutInfo.key,
            dropPosition: 'on'
        };
        // If dropping on the item isn't accepted, try the target before or after depending on the y position.
        // Otherwise, if dropping on the item is accepted, still try the before/after positions if within 10px
        // of the top or bottom of the item.
        if (!isValidDropTarget(target)) {
            if (y <= rect.y + rect.height / 2 && isValidDropTarget({
                ...target,
                dropPosition: 'before'
            })) target.dropPosition = 'before';
            else if (isValidDropTarget({
                ...target,
                dropPosition: 'after'
            })) target.dropPosition = 'after';
        } else if (y <= rect.y + 10 && isValidDropTarget({
            ...target,
            dropPosition: 'before'
        })) target.dropPosition = 'before';
        else if (y >= rect.maxY - 10 && isValidDropTarget({
            ...target,
            dropPosition: 'after'
        })) target.dropPosition = 'after';
        return target;
    }
    getDropTargetLayoutInfo(target) {
        let layoutInfo = this.getLayoutInfo(target.key);
        let rect;
        if (target.dropPosition === 'before') rect = this.orientation === 'horizontal' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(Math.max(0, layoutInfo.rect.x - this.dropIndicatorThickness / 2), layoutInfo.rect.y, this.dropIndicatorThickness, layoutInfo.rect.height) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(layoutInfo.rect.x, Math.max(0, layoutInfo.rect.y - this.dropIndicatorThickness / 2), layoutInfo.rect.width, this.dropIndicatorThickness);
        else if (target.dropPosition === 'after') {
            // Render after last visible descendant of the drop target.
            let targetNode = this.collection.getItem(target.key);
            if (targetNode) {
                var _targetNode_level;
                let targetLevel = (_targetNode_level = targetNode.level) !== null && _targetNode_level !== void 0 ? _targetNode_level : 0;
                let currentKey = this.collection.getKeyAfter(target.key);
                while(currentKey != null){
                    let node = this.collection.getItem(currentKey);
                    if (!node || node.level <= targetLevel) break;
                    layoutInfo = this.getLayoutInfo(currentKey) || layoutInfo;
                    currentKey = this.collection.getKeyAfter(currentKey);
                }
            }
            rect = this.orientation === 'horizontal' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(layoutInfo.rect.maxX - this.dropIndicatorThickness / 2, layoutInfo.rect.y, this.dropIndicatorThickness, layoutInfo.rect.height) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(layoutInfo.rect.x, layoutInfo.rect.maxY - this.dropIndicatorThickness / 2, layoutInfo.rect.width, this.dropIndicatorThickness);
        } else rect = layoutInfo.rect;
        return new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)('dropIndicator', target.key + ':' + target.dropPosition, rect);
    }
    /**
   * Creates a new ListLayout with options. See the list of properties below for a description
   * of the options that can be provided.
   */ constructor(options = {}){
        super();
        var _options_rowSize, _ref;
        this.rowSize = (_ref = (_options_rowSize = options === null || options === void 0 ? void 0 : options.rowSize) !== null && _options_rowSize !== void 0 ? _options_rowSize : options === null || options === void 0 ? void 0 : options.rowHeight) !== null && _ref !== void 0 ? _ref : null;
        var _options_orientation;
        this.orientation = (_options_orientation = options.orientation) !== null && _options_orientation !== void 0 ? _options_orientation : 'vertical';
        var _options_estimatedRowSize, _ref1;
        this.estimatedRowSize = (_ref1 = (_options_estimatedRowSize = options === null || options === void 0 ? void 0 : options.estimatedRowSize) !== null && _options_estimatedRowSize !== void 0 ? _options_estimatedRowSize : options === null || options === void 0 ? void 0 : options.estimatedRowHeight) !== null && _ref1 !== void 0 ? _ref1 : null;
        var _options_headingSize, _ref2;
        this.headingSize = (_ref2 = (_options_headingSize = options === null || options === void 0 ? void 0 : options.headingSize) !== null && _options_headingSize !== void 0 ? _options_headingSize : options === null || options === void 0 ? void 0 : options.headingHeight) !== null && _ref2 !== void 0 ? _ref2 : null;
        var _options_estimatedHeadingSize, _ref3;
        this.estimatedHeadingSize = (_ref3 = (_options_estimatedHeadingSize = options === null || options === void 0 ? void 0 : options.estimatedHeadingSize) !== null && _options_estimatedHeadingSize !== void 0 ? _options_estimatedHeadingSize : options === null || options === void 0 ? void 0 : options.estimatedHeadingHeight) !== null && _ref3 !== void 0 ? _ref3 : null;
        var _options_loaderSize, _ref4;
        this.loaderSize = (_ref4 = (_options_loaderSize = options === null || options === void 0 ? void 0 : options.loaderSize) !== null && _options_loaderSize !== void 0 ? _options_loaderSize : options === null || options === void 0 ? void 0 : options.loaderHeight) !== null && _ref4 !== void 0 ? _ref4 : null;
        this.dropIndicatorThickness = options.dropIndicatorThickness || 2;
        this.gap = options.gap || 0;
        this.padding = options.padding || 0;
        this.layoutNodes = new Map();
        this.rootNodes = [];
        this.lastCollection = null;
        this.invalidateEverything = false;
        this.validRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)();
        this.requestedRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)();
        this.contentSize = new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)();
    }
}
function $f46b9da090161919$var$toArray(collection, predicate) {
    const result = [];
    for (const node of collection)if (predicate(node)) result.push(node);
    return result;
}


export {$f46b9da090161919$export$cacbb3924155d68e as ListLayout};
//# sourceMappingURL=ListLayout.js.map
