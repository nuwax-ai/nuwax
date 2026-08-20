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
 */ function $2f907784468a29c9$export$1994a077b98ee0d5(width) {
    return width != null && (!isNaN(width) || String(width).match(/^(\d+)(?=%$)/) !== null);
}
function $2f907784468a29c9$export$9078bad4c3934604(width) {
    if (!width || typeof width === 'number') return 1;
    let match = width.match(/^(.+)(?=fr$)/);
    // if width is the incorrect format, just default it to a 1fr
    if (!match) {
        if (process.env.NODE_ENV !== 'production') console.warn(`width: ${width} is not a supported format, width should be a number (ex. 150), percentage (ex. '50%') or fr unit (ex. '2fr')`, "defaulting to '1fr'");
        return 1;
    }
    return parseFloat(match[0]);
}
function $2f907784468a29c9$export$7bbad27896f7ae9f(width, tableWidth) {
    if (typeof width === 'string') {
        let match = width.match(/^(\d+)(?=%$)/);
        if (!match) throw new Error('Only percentages or numbers are supported for static column widths');
        return tableWidth * (parseFloat(match[0]) / 100);
    }
    return width;
}
function $2f907784468a29c9$export$59185c62a7544aa0(maxWidth, tableWidth) {
    return maxWidth != null ? $2f907784468a29c9$export$7bbad27896f7ae9f(maxWidth, tableWidth) : Number.MAX_SAFE_INTEGER;
}
function $2f907784468a29c9$export$f556054ce4358701(minWidth, tableWidth) {
    return minWidth != null ? $2f907784468a29c9$export$7bbad27896f7ae9f(minWidth, tableWidth) : 0;
}
function $2f907784468a29c9$export$55d50dc687385491(availableWidth, columns, changedColumns, getDefaultWidth, getDefaultMinWidth) {
    let hasNonFrozenItems = false;
    let flexItems = columns.map((column, index)=>{
        var _changedColumns_get, _column_width, _ref, _ref1;
        let width = changedColumns.get(column.key) != null ? (_changedColumns_get = changedColumns.get(column.key)) !== null && _changedColumns_get !== void 0 ? _changedColumns_get : '1fr' : (_ref1 = (_ref = (_column_width = column.width) !== null && _column_width !== void 0 ? _column_width : column.defaultWidth) !== null && _ref !== void 0 ? _ref : getDefaultWidth === null || getDefaultWidth === void 0 ? void 0 : getDefaultWidth(index)) !== null && _ref1 !== void 0 ? _ref1 : '1fr';
        let frozen = false;
        let baseSize = 0;
        let flex = 0;
        let targetMainSize = 0;
        if ($2f907784468a29c9$export$1994a077b98ee0d5(width)) {
            baseSize = $2f907784468a29c9$export$7bbad27896f7ae9f(width, availableWidth);
            frozen = true;
        } else {
            flex = $2f907784468a29c9$export$9078bad4c3934604(width);
            if (flex <= 0) frozen = true;
        }
        var _column_minWidth, _ref2;
        let min = $2f907784468a29c9$export$f556054ce4358701((_ref2 = (_column_minWidth = column.minWidth) !== null && _column_minWidth !== void 0 ? _column_minWidth : getDefaultMinWidth === null || getDefaultMinWidth === void 0 ? void 0 : getDefaultMinWidth(index)) !== null && _ref2 !== void 0 ? _ref2 : 0, availableWidth);
        let max = $2f907784468a29c9$export$59185c62a7544aa0(column.maxWidth, availableWidth);
        let hypotheticalMainSize = Math.max(min, Math.min(baseSize, max));
        // 9.7.1
        // We don't make use of flex basis, it's always 0, so we are always in 'grow' mode.
        // 9.7.2
        if (frozen) targetMainSize = hypotheticalMainSize;
        else if (baseSize > hypotheticalMainSize) {
            frozen = true;
            targetMainSize = hypotheticalMainSize;
        }
        // 9.7.3
        if (!frozen) hasNonFrozenItems = true;
        return {
            frozen: frozen,
            baseSize: baseSize,
            hypotheticalMainSize: hypotheticalMainSize,
            min: min,
            max: max,
            flex: flex,
            targetMainSize: targetMainSize,
            violation: 0
        };
    });
    // 9.7.4
    // 9.7.4.a
    while(hasNonFrozenItems){
        // 9.7.4.b
        /**
     * Calculate the remaining free space as for initial free space,
     * above (9.7.3). If the sum of the unfrozen flex items’ flex factors is
     * less than one, multiply the initial free space by this sum (of flex factors).
     * If the magnitude of this value is less than the magnitude of
     * the remaining free space, use this as the remaining free space.
     */ let usedWidth = 0;
        let flexFactors = 0;
        flexItems.forEach((item)=>{
            if (item.frozen) usedWidth += item.targetMainSize;
            else {
                usedWidth += item.baseSize;
                flexFactors += item.flex;
            }
        });
        let remainingFreeSpace = availableWidth - usedWidth;
        // we only support integer FR's, and because of hasNonFrozenItems, we know that flexFactors > 0
        // so no need to check for flexFactors < 1
        // 9.7.4.c
        /**
     * If the remaining free space is zero
     * - Do nothing.
     * Else // remember, we're always in grow mode
     * - Find the ratio of the item’s flex grow factor to the
     * sum of the flex grow factors of all unfrozen items on
     * the line. Set the item’s target main size to its flex
     * base size plus a fraction of the remaining free space
     * proportional to the ratio.
     */ if (remainingFreeSpace > 0) flexItems.forEach((item)=>{
            if (!item.frozen) {
                let ratio = item.flex / flexFactors;
                item.targetMainSize = item.baseSize + ratio * remainingFreeSpace;
            }
        });
        // 9.7.4.d
        /**
     * Fix min/max violations. Clamp each non-frozen item’s
     * target main size by its used min and max main sizes
     * and floor its content-box size at zero. If the item’s
     * target main size was made smaller by this, it’s a max
     * violation. If the item’s target main size was made
     * larger by this, it’s a min violation.
     */ let totalViolation = 0;
        flexItems.forEach((item)=>{
            item.violation = 0;
            if (!item.frozen) {
                let { min: min, max: max, targetMainSize: targetMainSize } = item;
                item.targetMainSize = Math.max(min, Math.min(targetMainSize, max));
                item.violation = item.targetMainSize - targetMainSize;
                totalViolation += item.violation;
            }
        });
        // 9.7.4.e
        /**
     * Freeze over-flexed items. The total violation is the
     * sum of the adjustments from the previous step
     * ∑(clamped size - unclamped size). If the total violation is:
     * Zero
     * - Freeze all items.
     *
     * Positive
     * - Freeze all the items with min violations.
     *
     * Negative
     * - Freeze all the items with max violations.
     */ hasNonFrozenItems = false;
        flexItems.forEach((item)=>{
            if (totalViolation === 0 || Math.sign(totalViolation) === Math.sign(item.violation)) item.frozen = true;
            else if (!item.frozen) hasNonFrozenItems = true;
        });
    }
    return $2f907784468a29c9$var$cascadeRounding(flexItems);
}
function $2f907784468a29c9$var$cascadeRounding(flexItems) {
    /*
  Given an array of floats that sum to an integer, this rounds the floats
  and returns an array of integers with the same sum.
  */ let fpTotal = 0;
    let intTotal = 0;
    let roundedArray = [];
    flexItems.forEach(function(item) {
        let float = item.targetMainSize;
        let integer = Math.round(float + fpTotal) - intTotal;
        fpTotal += float;
        intTotal += integer;
        roundedArray.push(integer);
    });
    return roundedArray;
}


export {$2f907784468a29c9$export$1994a077b98ee0d5 as isStatic, $2f907784468a29c9$export$9078bad4c3934604 as parseFractionalUnit, $2f907784468a29c9$export$7bbad27896f7ae9f as parseStaticWidth, $2f907784468a29c9$export$59185c62a7544aa0 as getMaxWidth, $2f907784468a29c9$export$f556054ce4358701 as getMinWidth, $2f907784468a29c9$export$55d50dc687385491 as calculateColumnSizes};
//# sourceMappingURL=TableUtils.js.map
