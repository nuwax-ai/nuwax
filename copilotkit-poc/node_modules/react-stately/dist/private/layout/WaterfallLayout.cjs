var $4b8e6a761bc1571f$exports = require("../virtualizer/Layout.cjs");
var $6114beb2608093a1$exports = require("../virtualizer/LayoutInfo.cjs");
var $b2d04ac7f8a826b3$exports = require("../virtualizer/Point.cjs");
var $2bdd626d0eea82c5$exports = require("../virtualizer/Rect.cjs");
var $f9c934dfa703bb0a$exports = require("../virtualizer/Size.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "WaterfallLayout", function () { return $0853cb57bc04eeb3$export$e9f7cda058ba8df8; });
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




class $0853cb57bc04eeb3$var$WaterfallLayoutInfo extends (0, $6114beb2608093a1$exports.LayoutInfo) {
    copy() {
        let res = super.copy();
        res.column = this.column;
        res.index = this.index;
        return res;
    }
    constructor(...args){
        super(...args), this.column = 0, this.index = 0;
    }
}
const $0853cb57bc04eeb3$var$DEFAULT_OPTIONS = {
    minItemSize: new (0, $f9c934dfa703bb0a$exports.Size)(200, 200),
    maxItemSize: new (0, $f9c934dfa703bb0a$exports.Size)(Infinity, Infinity),
    minSpace: new (0, $f9c934dfa703bb0a$exports.Size)(18, 18),
    maxSpace: Infinity,
    maxColumns: Infinity,
    dropIndicatorThickness: 2,
    loaderHeight: 48
};
class $0853cb57bc04eeb3$export$e9f7cda058ba8df8 extends (0, $4b8e6a761bc1571f$exports.Layout) {
    shouldInvalidateLayoutOptions(newOptions, oldOptions) {
        return newOptions.maxColumns !== oldOptions.maxColumns || newOptions.dropIndicatorThickness !== oldOptions.dropIndicatorThickness || !(newOptions.minItemSize || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minItemSize).equals(oldOptions.minItemSize || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minItemSize) || !(newOptions.maxItemSize || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.maxItemSize).equals(oldOptions.maxItemSize || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.maxItemSize) || !(newOptions.minSpace || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minSpace).equals(oldOptions.minSpace || $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minSpace) || newOptions.maxHorizontalSpace !== oldOptions.maxHorizontalSpace || newOptions.loaderHeight !== oldOptions.loaderHeight;
    }
    update(invalidationContext) {
        let { minItemSize: minItemSize = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minItemSize, maxItemSize: maxItemSize = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.maxItemSize, minSpace: minSpace = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.minSpace, maxHorizontalSpace: maxHorizontalSpace = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.maxSpace, maxColumns: maxColumns = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.maxColumns, dropIndicatorThickness: dropIndicatorThickness = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.dropIndicatorThickness, loaderHeight: loaderHeight = $0853cb57bc04eeb3$var$DEFAULT_OPTIONS.loaderHeight } = invalidationContext.layoutOptions || {};
        this.dropIndicatorThickness = dropIndicatorThickness;
        let virtualizerWidth = this.virtualizer.size.width;
        // The max item width is always the entire viewport.
        // If the max item height is infinity, scale in proportion to the max width.
        let maxItemWidth = Math.min(maxItemSize.width, virtualizerWidth);
        let maxItemHeight = Number.isFinite(maxItemSize.height) ? maxItemSize.height : Math.floor(minItemSize.height / minItemSize.width * maxItemWidth);
        // Compute the number of rows and columns needed to display the content
        let columns = Math.floor(virtualizerWidth / (minItemSize.width + minSpace.width));
        let numColumns = Math.max(1, Math.min(maxColumns, columns));
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
        this.margin = Math.floor((virtualizerWidth - numColumns * itemWidth - horizontalSpacing * (numColumns + 1)) / 2);
        // Setup an array of column heights
        let columnHeights = Array(numColumns).fill(minSpace.height);
        let newLayoutInfos = new Map();
        let index = 0;
        let addNode = (key, node)=>{
            let oldLayoutInfo = this.layoutInfos.get(key);
            let height = itemHeight;
            let estimatedSize = true;
            if (oldLayoutInfo) {
                height = oldLayoutInfo.rect.height / oldLayoutInfo.rect.width * itemWidth;
                estimatedSize = invalidationContext.sizeChanged || oldLayoutInfo.estimatedSize || oldLayoutInfo.content !== node;
            }
            // Figure out which column to place the item in, and compute its position.
            // Preserve the previous column index so items don't jump around during resizing unless the number of columns changed.
            let prevColumn = numColumns === this.numColumns && oldLayoutInfo && oldLayoutInfo.index === index && oldLayoutInfo.rect.y < this.virtualizer.visibleRect.maxY ? oldLayoutInfo.column : undefined;
            let column = prevColumn ?? columnHeights.reduce((minIndex, h, i)=>h < columnHeights[minIndex] ? i : minIndex, 0);
            let x = horizontalSpacing + column * (itemWidth + horizontalSpacing) + this.margin;
            let y = columnHeights[column];
            let rect = new (0, $2bdd626d0eea82c5$exports.Rect)(x, y, itemWidth, height);
            let layoutInfo = new $0853cb57bc04eeb3$var$WaterfallLayoutInfo(node.type, key, rect);
            layoutInfo.estimatedSize = estimatedSize;
            layoutInfo.allowOverflow = true;
            layoutInfo.content = node;
            layoutInfo.column = column;
            layoutInfo.index = index++;
            newLayoutInfos.set(key, layoutInfo);
            columnHeights[column] += layoutInfo.rect.height + minSpace.height;
        };
        let collection = this.virtualizer.collection;
        let skeletonCount = 0;
        for (let node of collection){
            if (node.type === 'skeleton') {
                // Add skeleton cards until every column has at least one, and we fill the viewport.
                let startingHeights = [
                    ...columnHeights
                ];
                while(!columnHeights.every((h, i)=>h !== startingHeights[i]) || Math.min(...columnHeights) < this.virtualizer.size.height){
                    let key = `${node.key}-${skeletonCount++}`;
                    let content = this.layoutInfos.get(key)?.content || {
                        ...node
                    };
                    addNode(key, content);
                }
                break;
            } else if (node.type !== 'loader') addNode(node.key, node);
        }
        // Reset all columns to the maximum for the next section. If loading, set to 0 so virtualizer doesn't render its body since there aren't items to render,
        // except if we are performing skeleton loading
        let isEmptyOrLoading = collection?.size === 0 && collection.getItem(collection.getFirstKey())?.type !== 'skeleton';
        let maxHeight = isEmptyOrLoading ? 0 : Math.max(...columnHeights);
        // Always add the loader sentinel if present in the collection so we can make sure it is never virtualized out.
        // Add it under the first column for simplicity
        let lastNode = collection.getItem(collection.getLastKey());
        if (lastNode?.type === 'loader') {
            if (skeletonCount > 0 || !lastNode.props.isLoading) loaderHeight = 0;
            const loaderWidth = virtualizerWidth - horizontalSpacing * 2;
            // Note that if the user provides isLoading to their sentinel during a case where they only want to render the emptyState, this will reserve
            // room for the loader alongside rendering the emptyState
            let rect = new (0, $2bdd626d0eea82c5$exports.Rect)(horizontalSpacing, maxHeight, loaderWidth, loaderHeight);
            let layoutInfo = new (0, $6114beb2608093a1$exports.LayoutInfo)('loader', lastNode.key, rect);
            newLayoutInfos.set(lastNode.key, layoutInfo);
            maxHeight = layoutInfo.rect.maxY;
        }
        this.contentSize = new (0, $f9c934dfa703bb0a$exports.Size)(this.virtualizer.size.width, maxHeight);
        this.layoutInfos = newLayoutInfos;
        this.numColumns = numColumns;
    }
    getLayoutInfo(key) {
        return this.layoutInfos.get(key);
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
    // Override keyboard navigation to work spatially.
    getKeyRightOf(key) {
        let layoutInfo = this.getLayoutInfo(key);
        if (!layoutInfo) return null;
        let rect = new (0, $2bdd626d0eea82c5$exports.Rect)(layoutInfo.rect.maxX, layoutInfo.rect.y, this.virtualizer.visibleRect.maxX - layoutInfo.rect.maxX, layoutInfo.rect.height);
        let layoutInfos = this.getVisibleLayoutInfos(rect);
        let bestKey = null;
        let bestDistance = Infinity;
        for (let candidate of layoutInfos){
            if (candidate.key === key) continue;
            // Find the closest item in the x direction with the most overlap in the y direction.
            let deltaX = candidate.rect.x - rect.x;
            let overlapY = Math.min(candidate.rect.maxY, rect.maxY) - Math.max(candidate.rect.y, rect.y);
            let distance = deltaX - overlapY;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestKey = candidate.key;
            }
        }
        return bestKey;
    }
    getKeyLeftOf(key) {
        let layoutInfo = this.getLayoutInfo(key);
        if (!layoutInfo) return null;
        let rect = new (0, $2bdd626d0eea82c5$exports.Rect)(0, layoutInfo.rect.y, layoutInfo.rect.x, layoutInfo.rect.height);
        let layoutInfos = this.getVisibleLayoutInfos(rect);
        let bestKey = null;
        let bestDistance = Infinity;
        for (let candidate of layoutInfos){
            if (candidate.key === key) continue;
            // Find the closest item in the x direction with the most overlap in the y direction.
            let deltaX = rect.maxX - candidate.rect.maxX;
            let overlapY = Math.min(candidate.rect.maxY, rect.maxY) - Math.max(candidate.rect.y, rect.y);
            let distance = deltaX - overlapY;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestKey = candidate.key;
            }
        }
        return bestKey;
    }
    // This overrides the default behavior of shift selection to work spatially
    // rather than following the order of the items in the collection (which may appear unpredictable).
    getKeyRange(from, to) {
        let fromLayoutInfo = this.getLayoutInfo(from);
        let toLayoutInfo = this.getLayoutInfo(to);
        if (!fromLayoutInfo || !toLayoutInfo) return [];
        // Find items where half of the area intersects the rectangle
        // formed from the first item to the last item in the range.
        let rect = fromLayoutInfo.rect.union(toLayoutInfo.rect);
        let keys = [];
        for (let layoutInfo of this.layoutInfos.values())if (rect.intersection(layoutInfo.rect).area > layoutInfo.rect.area / 2) keys.push(layoutInfo.key);
        return keys;
    }
    getDropTargetFromPoint(x, y) {
        if (this.layoutInfos.size === 0) return {
            type: 'root'
        };
        x += this.virtualizer.visibleRect.x;
        y += this.virtualizer.visibleRect.y;
        let key = this.virtualizer.keyAtPoint(new (0, $b2d04ac7f8a826b3$exports.Point)(x, y));
        if (key == null) return {
            type: 'root'
        };
        // Only support "on" drop position in waterfall layout.
        // Reordering doesn't make sense because the items don't have a deterministic order.
        return {
            type: 'item',
            key: key,
            dropPosition: 'on'
        };
    }
    constructor(...args){
        super(...args), this.contentSize = new (0, $f9c934dfa703bb0a$exports.Size)(), this.layoutInfos = new Map(), this.numColumns = 0, this.dropIndicatorThickness = 2, this.margin = 0;
    }
}


//# sourceMappingURL=WaterfallLayout.cjs.map
