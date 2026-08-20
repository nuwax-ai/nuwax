import {getChildNodes as $cd5ea4b915021f1d$export$1005530eda016c13} from "../collections/getChildNodes.mjs";
import {Layout as $85410e0c3cc54f1d$export$c84671f46d6a1ca} from "../virtualizer/Layout.mjs";
import {LayoutInfo as $eb6255cbf080eb7d$export$7e0eeb9da702a085} from "../virtualizer/LayoutInfo.mjs";
import {Rect as $af827553fd3cf456$export$c79fc6492f3af13d} from "../virtualizer/Rect.mjs";
import {Size as $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec} from "../virtualizer/Size.mjs";

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




const $942f06a693c162e2$var$DEFAULT_HEIGHT = 48;
class $942f06a693c162e2$export$cacbb3924155d68e extends (0, $85410e0c3cc54f1d$export$c84671f46d6a1ca) {
    /**
   * Creates a new ListLayout with options. See the list of properties below for a description
   * of the options that can be provided.
   */ constructor(options = {}){
        super();
        this.rowSize = options?.rowSize ?? options?.rowHeight ?? null;
        this.orientation = options.orientation ?? 'vertical';
        this.estimatedRowSize = options?.estimatedRowSize ?? options?.estimatedRowHeight ?? null;
        this.headingSize = options?.headingSize ?? options?.headingHeight ?? null;
        this.estimatedHeadingSize = options?.estimatedHeadingSize ?? options?.estimatedHeadingHeight ?? null;
        this.loaderSize = options?.loaderSize ?? options?.loaderHeight ?? null;
        this.dropIndicatorThickness = options.dropIndicatorThickness || 2;
        this.gap = options.gap || 0;
        this.padding = options.padding || 0;
        this.layoutNodes = new Map();
        this.rootNodes = [];
        this.lastCollection = null;
        this.invalidateEverything = false;
        this.validRect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)();
        this.requestedRect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)();
        this.contentSize = new (0, $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec)();
    }
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
        this.ensureLayoutInfo(key);
        return this.layoutNodes.get(key)?.layoutInfo || null;
    }
    getVisibleLayoutInfos(rect) {
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        // Adjust rect to keep number of visible rows consistent.
        // (only if height > 1 or width > 1 for getDropTargetFromPoint)
        if (rect[heightProperty] > 1) {
            let rowHeight = (this.rowSize ?? this.estimatedRowSize ?? $942f06a693c162e2$var$DEFAULT_HEIGHT) + this.gap;
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
            this.requestedRect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(0, 0, Infinity, Infinity);
            this.rootNodes = this.buildCollection();
            this.requestedRect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(0, 0, this.contentSize.width, this.contentSize.height);
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
        return invalidationContext.sizeChanged || this.rowSize !== (options?.rowSize ?? options?.rowHeight ?? this.rowSize) || this.orientation !== (options?.orientation ?? this.orientation) || this.headingSize !== (options?.headingSize ?? options?.headingHeight ?? this.headingSize) || this.loaderSize !== (options?.loaderSize ?? options?.loaderHeight ?? this.loaderSize) || this.gap !== (options?.gap ?? this.gap) || this.padding !== (options?.padding ?? this.padding);
    }
    shouldInvalidateLayoutOptions(newOptions, oldOptions) {
        return (newOptions?.rowSize ?? newOptions?.rowHeight) !== (oldOptions?.rowSize ?? oldOptions?.rowHeight) || newOptions.orientation !== oldOptions.orientation || (newOptions?.estimatedRowSize ?? newOptions?.estimatedRowHeight) !== (oldOptions?.estimatedRowSize ?? oldOptions?.estimatedRowHeight) || (newOptions?.headingSize ?? newOptions?.headingHeight) !== (oldOptions?.headingSize ?? oldOptions?.headingHeight) || (newOptions?.estimatedHeadingSize ?? newOptions?.estimatedHeadingHeight) !== (oldOptions?.estimatedHeadingSize ?? oldOptions?.estimatedHeadingHeight) || (newOptions?.loaderSize ?? newOptions?.loaderHeight) !== (oldOptions?.loaderSize ?? oldOptions?.loaderHeight) || newOptions.dropIndicatorThickness !== oldOptions.dropIndicatorThickness || newOptions.gap !== oldOptions.gap || newOptions.padding !== oldOptions.padding;
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
        this.rowSize = options?.rowSize ?? options?.rowHeight ?? this.rowSize;
        this.orientation = options?.orientation ?? this.orientation;
        this.estimatedRowSize = options?.estimatedRowSize ?? options?.estimatedRowHeight ?? this.estimatedRowSize;
        this.headingSize = options?.headingSize ?? options?.headingHeight ?? this.headingSize;
        this.estimatedHeadingSize = options?.estimatedHeadingSize ?? options?.estimatedHeadingHeight ?? this.estimatedHeadingSize;
        this.loaderSize = options?.loaderSize ?? options?.loaderHeight ?? this.loaderSize;
        this.dropIndicatorThickness = options?.dropIndicatorThickness ?? this.dropIndicatorThickness;
        this.gap = options?.gap ?? this.gap;
        this.padding = options?.padding ?? this.padding;
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
        let collectionNodes = $942f06a693c162e2$var$toArray(collection, (node)=>node.type !== 'content');
        let loaderNodes = collectionNodes.filter((node)=>node.type === 'loader');
        let nodes = [];
        let isEmptyOrLoading = collection?.size === 0;
        if (isEmptyOrLoading) offset = 0;
        for (let node of collectionNodes){
            let rowHeight = (this.rowSize ?? this.estimatedRowSize ?? $942f06a693c162e2$var$DEFAULT_HEIGHT) + this.gap;
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
        this.contentSize = this.orientation === 'horizontal' ? new (0, $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec)(offset, this.virtualizer.size.height) : new (0, $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec)(this.virtualizer.size.width, offset);
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
        layoutNode.layoutInfo.parentKey = parentKey ?? null;
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
        let rect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, this.padding, 0);
        let layoutInfo = new (0, $eb6255cbf080eb7d$export$7e0eeb9da702a085)(node.type, node.key, rect);
        // Note that if the user provides isLoading to their sentinel during a case where they only want to render the emptyState, this will reserve
        // room for the loader alongside rendering the emptyState
        if (this.orientation === 'horizontal') {
            rect.height = this.virtualizer.contentSize.height - this.padding - y;
            rect.width = node.props.isLoading ? this.loaderSize ?? this.rowSize ?? this.estimatedRowSize ?? $942f06a693c162e2$var$DEFAULT_HEIGHT : 0;
        } else {
            rect.width = this.virtualizer.contentSize.width - this.padding - x;
            rect.height = node.props.isLoading ? this.loaderSize ?? this.rowSize ?? this.estimatedRowSize ?? $942f06a693c162e2$var$DEFAULT_HEIGHT : 0;
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
        let rect = this.orientation === 'horizontal' ? new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, 0, height) : new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, width, 0);
        let layoutInfo = new (0, $eb6255cbf080eb7d$export$7e0eeb9da702a085)(node.type, node.key, rect);
        let offset = this.orientation === 'horizontal' ? x : y;
        let offsetProperty = this.orientation === 'horizontal' ? 'x' : 'y';
        let maxOffsetProperty = this.orientation === 'horizontal' ? 'maxX' : 'maxY';
        let heightProperty = this.orientation === 'horizontal' ? 'width' : 'height';
        let skipped = 0;
        let children = [];
        for (let child of (0, $cd5ea4b915021f1d$export$1005530eda016c13)(node, collection)){
            // skip if it is a content node, Tree specific for now, if we add content nodes to other collection items, we might need to reconsider this
            if (child.type === 'content') continue;
            let rowHeight = (this.rowSize ?? this.estimatedRowSize ?? $942f06a693c162e2$var$DEFAULT_HEIGHT) + this.gap;
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
                    ...(0, $cd5ea4b915021f1d$export$1005530eda016c13)(node, collection)
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
            let previousLayoutInfo = previousLayoutNode?.layoutInfo;
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
        if (rectHeight == null) rectHeight = $942f06a693c162e2$var$DEFAULT_HEIGHT;
        let headerRect = this.orientation === 'horizontal' ? new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, rectHeight, width - y) : new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, width - x, rectHeight);
        let header = new (0, $eb6255cbf080eb7d$export$7e0eeb9da702a085)('header', node.key, headerRect);
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
        if (rectHeight == null) rectHeight = $942f06a693c162e2$var$DEFAULT_HEIGHT;
        let rect = this.orientation === 'horizontal' ? new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, rectHeight, width) : new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, y, width, rectHeight);
        let layoutInfo = new (0, $eb6255cbf080eb7d$export$7e0eeb9da702a085)(node.type, node.key, rect);
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
            // Copy layout info rather than mutating so that later caches are invalidated.
            let newLayoutInfo = layoutInfo.copy();
            newLayoutInfo.rect[heightProperty] = size[heightProperty];
            layoutNode.layoutInfo = newLayoutInfo;
            // Items after this layoutInfo will need to be repositioned to account for the new height.
            // Adjust the validRect so that only items above remain valid.
            this.validRect[heightProperty] = Math.min(this.validRect[heightProperty], layoutInfo.rect[offsetProperty] - this.validRect[offsetProperty]);
            // The requestedRect also needs to be adjusted to account for the height difference.
            if (layoutNode.node?.type === 'item') this.requestedRect[heightProperty] += newLayoutInfo.rect[heightProperty] - layoutInfo.rect[heightProperty];
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
        let searchRect = new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(x, Math.max(0, y - this.gap), 1, Math.max(1, this.gap * 2));
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
        if (target.dropPosition === 'before') rect = this.orientation === 'horizontal' ? new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(Math.max(0, layoutInfo.rect.x - this.dropIndicatorThickness / 2), layoutInfo.rect.y, this.dropIndicatorThickness, layoutInfo.rect.height) : new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(layoutInfo.rect.x, Math.max(0, layoutInfo.rect.y - this.dropIndicatorThickness / 2), layoutInfo.rect.width, this.dropIndicatorThickness);
        else if (target.dropPosition === 'after') {
            // Render after last visible descendant of the drop target.
            let targetNode = this.collection.getItem(target.key);
            if (targetNode) {
                let targetLevel = targetNode.level ?? 0;
                let currentKey = this.collection.getKeyAfter(target.key);
                while(currentKey != null){
                    let node = this.collection.getItem(currentKey);
                    if (!node || node.level <= targetLevel) break;
                    layoutInfo = this.getLayoutInfo(currentKey) || layoutInfo;
                    currentKey = this.collection.getKeyAfter(currentKey);
                }
            }
            rect = this.orientation === 'horizontal' ? new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(layoutInfo.rect.maxX - this.dropIndicatorThickness / 2, layoutInfo.rect.y, this.dropIndicatorThickness, layoutInfo.rect.height) : new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(layoutInfo.rect.x, layoutInfo.rect.maxY - this.dropIndicatorThickness / 2, layoutInfo.rect.width, this.dropIndicatorThickness);
        } else rect = layoutInfo.rect;
        return new (0, $eb6255cbf080eb7d$export$7e0eeb9da702a085)('dropIndicator', target.key + ':' + target.dropPosition, rect);
    }
}
function $942f06a693c162e2$var$toArray(collection, predicate) {
    const result = [];
    for (const node of collection)if (predicate(node)) result.push(node);
    return result;
}


export {$942f06a693c162e2$export$cacbb3924155d68e as ListLayout};
//# sourceMappingURL=ListLayout.mjs.map
