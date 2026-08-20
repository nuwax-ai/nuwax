import {Layout as $bcf18cb0a16f75f6$export$c84671f46d6a1ca} from "../virtualizer/Layout.js";
import {LayoutInfo as $dcdbc700dd92e06f$export$7e0eeb9da702a085} from "../virtualizer/LayoutInfo.js";
import {Rect as $546350db2c358941$export$c79fc6492f3af13d} from "../virtualizer/Rect.js";
import {Size as $266cbd2785be3a2c$export$cb6da89c6af1a8ec} from "../virtualizer/Size.js";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



const $5600a6980c0f940d$var$DEFAULT_OPTIONS = {
    minItemSize: new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(200, 200),
    maxItemSize: new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(Infinity, Infinity),
    preserveAspectRatio: false,
    minSpace: new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(18, 18),
    maxSpace: Infinity,
    maxColumns: Infinity,
    dropIndicatorThickness: 2,
    loaderHeight: 48
};
class $5600a6980c0f940d$export$7d2b12578154a735 extends (0, $bcf18cb0a16f75f6$export$c84671f46d6a1ca) {
    shouldInvalidateLayoutOptions(newOptions, oldOptions) {
        return newOptions.maxColumns !== oldOptions.maxColumns || newOptions.dropIndicatorThickness !== oldOptions.dropIndicatorThickness || newOptions.preserveAspectRatio !== oldOptions.preserveAspectRatio || !(newOptions.minItemSize || $5600a6980c0f940d$var$DEFAULT_OPTIONS.minItemSize).equals(oldOptions.minItemSize || $5600a6980c0f940d$var$DEFAULT_OPTIONS.minItemSize) || !(newOptions.maxItemSize || $5600a6980c0f940d$var$DEFAULT_OPTIONS.maxItemSize).equals(oldOptions.maxItemSize || $5600a6980c0f940d$var$DEFAULT_OPTIONS.maxItemSize) || !(newOptions.minSpace || $5600a6980c0f940d$var$DEFAULT_OPTIONS.minSpace).equals(oldOptions.minSpace || $5600a6980c0f940d$var$DEFAULT_OPTIONS.minSpace) || newOptions.maxHorizontalSpace !== oldOptions.maxHorizontalSpace || newOptions.loaderHeight !== oldOptions.loaderHeight || newOptions.direction !== oldOptions.direction;
    }
    update(invalidationContext) {
        let { minItemSize: minItemSize = $5600a6980c0f940d$var$DEFAULT_OPTIONS.minItemSize, maxItemSize: maxItemSize = $5600a6980c0f940d$var$DEFAULT_OPTIONS.maxItemSize, preserveAspectRatio: preserveAspectRatio = $5600a6980c0f940d$var$DEFAULT_OPTIONS.preserveAspectRatio, minSpace: minSpace = $5600a6980c0f940d$var$DEFAULT_OPTIONS.minSpace, maxHorizontalSpace: maxHorizontalSpace = $5600a6980c0f940d$var$DEFAULT_OPTIONS.maxSpace, maxColumns: maxColumns = $5600a6980c0f940d$var$DEFAULT_OPTIONS.maxColumns, dropIndicatorThickness: dropIndicatorThickness = $5600a6980c0f940d$var$DEFAULT_OPTIONS.dropIndicatorThickness, loaderHeight: loaderHeight = $5600a6980c0f940d$var$DEFAULT_OPTIONS.loaderHeight, direction: direction = 'ltr' } = invalidationContext.layoutOptions || {};
        this.dropIndicatorThickness = dropIndicatorThickness;
        this.direction = direction;
        let virtualizerWidth = this.virtualizer.size.width;
        // The max item width is always the entire viewport.
        // If the max item height is infinity, scale in proportion to the max width.
        let maxItemWidth = Math.min(maxItemSize.width, virtualizerWidth);
        let maxItemHeight = Number.isFinite(maxItemSize.height) ? maxItemSize.height : Math.floor(minItemSize.height / minItemSize.width * maxItemWidth);
        // Compute the number of rows and columns needed to display the content
        let columns = Math.floor(virtualizerWidth / (minItemSize.width + minSpace.width));
        let numColumns = Math.max(1, Math.min(maxColumns, columns));
        this.numColumns = numColumns;
        // Compute the available width (minus the space between items)
        let width = virtualizerWidth - minSpace.width * Math.max(0, numColumns);
        // Compute the item width based on the space available
        let itemWidth = Math.floor(width / numColumns);
        itemWidth = Math.max(minItemSize.width, Math.min(maxItemWidth, itemWidth));
        // Compute the item height, which is proportional to the item width
        let t = (itemWidth - minItemSize.width) / Math.max(1, maxItemWidth - minItemSize.width);
        let itemHeight = minItemSize.height + Math.floor((maxItemHeight - minItemSize.height) * t);
        itemHeight = Math.max(minItemSize.height, Math.min(maxItemHeight, itemHeight));
        // Compute the horizontal spacing, content height and horizontal margin
        let horizontalSpacing = Math.min(Math.max(maxHorizontalSpace, minSpace.width), Math.floor((virtualizerWidth - numColumns * itemWidth) / (numColumns + 1)));
        this.gap = new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(horizontalSpacing, minSpace.height);
        this.margin = Math.floor((virtualizerWidth - numColumns * itemWidth - horizontalSpacing * (numColumns + 1)) / 2);
        // If there is a skeleton loader within the last 2 items in the collection, increment the collection size
        // so that an additional row is added for the skeletons.
        let collection = this.virtualizer.collection;
        let collectionSize = collection.size;
        let lastKey = collection.getLastKey();
        for(let i = 0; i < 2 && lastKey != null; i++){
            let item = collection.getItem(lastKey);
            if ((item === null || item === void 0 ? void 0 : item.type) === 'skeleton') {
                collectionSize++;
                break;
            }
            lastKey = collection.getKeyBefore(lastKey);
        }
        let rows = Math.ceil(collectionSize / numColumns);
        let iterator = collection[Symbol.iterator]();
        let y = rows > 0 ? minSpace.height : 0;
        let newLayoutInfos = new Map();
        let skeleton = null;
        let skeletonCount = 0;
        for(let row = 0; row < rows; row++){
            let maxHeight = 0;
            let rowLayoutInfos = [];
            for(let col = 0; col < numColumns; col++){
                // Repeat skeleton until the end of the current row.
                let node = skeleton || iterator.next().value;
                if (!node) break;
                // We will add the loader after the skeletons so skip here
                if (node.type === 'loader') continue;
                if (node.type === 'skeleton') skeleton = node;
                let key = skeleton ? `${skeleton.key}-${skeletonCount++}` : node.key;
                let oldLayoutInfo = this.layoutInfos.get(key);
                let content = node;
                if (skeleton) content = oldLayoutInfo && oldLayoutInfo.content.key === key ? oldLayoutInfo.content : {
                    ...skeleton,
                    key: key
                };
                let x = horizontalSpacing + col * (itemWidth + horizontalSpacing) + this.margin;
                let height = itemHeight;
                let estimatedSize = !preserveAspectRatio;
                if (oldLayoutInfo && estimatedSize) {
                    height = oldLayoutInfo.rect.height;
                    estimatedSize = invalidationContext.layoutOptionsChanged || invalidationContext.sizeChanged || oldLayoutInfo.estimatedSize || oldLayoutInfo.content !== content;
                }
                let rect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, y, itemWidth, height);
                let layoutInfo = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)(node.type, key, rect);
                layoutInfo.estimatedSize = estimatedSize;
                layoutInfo.allowOverflow = true;
                layoutInfo.content = content;
                newLayoutInfos.set(key, layoutInfo);
                rowLayoutInfos.push(layoutInfo);
                maxHeight = Math.max(maxHeight, layoutInfo.rect.height);
            }
            for (let layoutInfo of rowLayoutInfos)layoutInfo.rect.height = maxHeight;
            y += maxHeight + minSpace.height;
            // Keep adding skeleton rows until we fill the viewport
            if (skeleton && row === rows - 1 && y < this.virtualizer.size.height) rows++;
        }
        // Always add the loader sentinel if present in the collection so we can make sure it is never virtualized out.
        let lastNode = collection.getItem(collection.getLastKey());
        if ((lastNode === null || lastNode === void 0 ? void 0 : lastNode.type) === 'loader') {
            if (skeletonCount > 0 || !lastNode.props.isLoading) loaderHeight = 0;
            const loaderWidth = virtualizerWidth - horizontalSpacing * 2;
            // Note that if the user provides isLoading to their sentinel during a case where they only want to render the emptyState, this will reserve
            // room for the loader alongside rendering the emptyState
            let rect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(horizontalSpacing, y, loaderWidth, loaderHeight);
            let layoutInfo = new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)('loader', lastNode.key, rect);
            newLayoutInfos.set(lastNode.key, layoutInfo);
            y = layoutInfo.rect.maxY;
        }
        this.layoutInfos = newLayoutInfos;
        this.contentSize = new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(this.virtualizer.size.width, y);
    }
    getLayoutInfo(key) {
        return this.layoutInfos.get(key) || null;
    }
    getContentSize() {
        return this.contentSize;
    }
    getVisibleLayoutInfos(rect) {
        let layoutInfos = [];
        for (let layoutInfo of this.layoutInfos.values())if (layoutInfo.rect.intersects(rect) || this.virtualizer.isPersistedKey(layoutInfo.key) || layoutInfo.type === 'loader') layoutInfos.push(layoutInfo);
        return layoutInfos;
    }
    updateItemSize(key, size) {
        let layoutInfo = this.layoutInfos.get(key);
        if (!size || !layoutInfo) return false;
        if (size.height !== layoutInfo.rect.height) {
            let newLayoutInfo = layoutInfo.copy();
            newLayoutInfo.rect.height = size.height;
            newLayoutInfo.estimatedSize = false;
            this.layoutInfos.set(key, newLayoutInfo);
            return true;
        }
        return false;
    }
    getDropTargetFromPoint(x, y, isValidDropTarget) {
        if (this.layoutInfos.size === 0) return {
            type: 'root'
        };
        x += this.virtualizer.visibleRect.x;
        y += this.virtualizer.visibleRect.y;
        // In RTL mode the virtualizer positions items using CSS `right` with the
        // layout rect's x value as the right-offset, but pointer coordinates are
        // in visual (left-origin) space. Flip x so it matches the layout coords.
        if (this.direction === 'rtl' && this.numColumns > 1) x = this.contentSize.width - x;
        // Find the closest item within on either side of the point using the gap width.
        let key = null;
        if (this.numColumns === 1) {
            let searchRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(x, Math.max(0, y - this.gap.height), 1, Math.max(1, this.gap.height * 2));
            let candidates = this.getVisibleLayoutInfos(searchRect);
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
        } else {
            let searchRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(Math.max(0, x - this.gap.width), y, this.gap.width * 2, 1);
            let candidates = this.getVisibleLayoutInfos(searchRect);
            let minDistance = Infinity;
            for (let candidate of candidates){
                // Ignore items outside the search rect, e.g. persisted keys.
                if (!candidate.rect.intersects(searchRect)) continue;
                let xDist = Math.abs(candidate.rect.x - x);
                let maxXDist = Math.abs(candidate.rect.maxX - x);
                let dist = Math.min(xDist, maxXDist);
                if (dist < minDistance) {
                    minDistance = dist;
                    key = candidate.key;
                }
            }
        }
        let layoutInfo = key != null ? this.getLayoutInfo(key) : null;
        if (!layoutInfo) return {
            type: 'root'
        };
        let target = {
            type: 'item',
            key: layoutInfo.key,
            dropPosition: 'on'
        };
        let pos = this.numColumns === 1 ? y : x;
        let layoutInfoPos = this.numColumns === 1 ? layoutInfo.rect.y : layoutInfo.rect.x;
        let size = this.numColumns === 1 ? layoutInfo.rect.height : layoutInfo.rect.width;
        if (isValidDropTarget(target)) {
            // If dropping on the item is accepted, try the before/after positions
            // if within 5px of the start or end of the item.
            if (pos < layoutInfoPos + 5) target.dropPosition = 'before';
            else if (pos > layoutInfoPos + size - 5) target.dropPosition = 'after';
        } else {
            // If dropping on the item isn't accepted, try the target before or after depending on the position.
            let mid = layoutInfoPos + size / 2;
            if (pos <= mid && isValidDropTarget({
                ...target,
                dropPosition: 'before'
            })) target.dropPosition = 'before';
            else if (pos >= mid && isValidDropTarget({
                ...target,
                dropPosition: 'after'
            })) target.dropPosition = 'after';
        }
        return target;
    }
    getDropTargetLayoutInfo(target) {
        let layoutInfo = this.getLayoutInfo(target.key);
        let rect;
        if (this.numColumns === 1) // Flip from vertical to horizontal if only one column is visible.
        rect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(layoutInfo.rect.x, target.dropPosition === 'before' ? layoutInfo.rect.y - this.gap.height / 2 - this.dropIndicatorThickness / 2 : layoutInfo.rect.maxY + this.gap.height / 2 - this.dropIndicatorThickness / 2, layoutInfo.rect.width, this.dropIndicatorThickness);
        else rect = new (0, $546350db2c358941$export$c79fc6492f3af13d)(target.dropPosition === 'before' ? layoutInfo.rect.x - this.gap.width / 2 - this.dropIndicatorThickness / 2 : layoutInfo.rect.maxX + this.gap.width / 2 - this.dropIndicatorThickness / 2, layoutInfo.rect.y, this.dropIndicatorThickness, layoutInfo.rect.height);
        return new (0, $dcdbc700dd92e06f$export$7e0eeb9da702a085)('dropIndicator', target.key + ':' + target.dropPosition, rect);
    }
    constructor(...args){
        super(...args), this.gap = $5600a6980c0f940d$var$DEFAULT_OPTIONS.minSpace, this.dropIndicatorThickness = 2, this.numColumns = 0, this.direction = 'ltr', this.contentSize = new (0, $266cbd2785be3a2c$export$cb6da89c6af1a8ec)(), this.layoutInfos = new Map(), this.margin = 0;
    }
}


export {$5600a6980c0f940d$export$7d2b12578154a735 as GridLayout};
//# sourceMappingURL=GridLayout.js.map
