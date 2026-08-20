var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $a2b3121359008119$exports = require("./useVirtualizerItem.cjs");
var $3swss$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "VirtualizerItem", function () { return $3a715986d9e59f30$export$6796df8ba7398521; });
$parcel$export(module.exports, "layoutInfoToStyle", function () { return $3a715986d9e59f30$export$1481e64fbe01b8b3; });
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


function $3a715986d9e59f30$export$6796df8ba7398521(props) {
    let { style: style, className: className, layoutInfo: layoutInfo, virtualizer: virtualizer, parent: parent, children: children } = props;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let ref = (0, $3swss$react.useRef)(null);
    (0, $a2b3121359008119$exports.useVirtualizerItem)({
        layoutInfo: layoutInfo,
        virtualizer: virtualizer,
        ref: ref
    });
    return /*#__PURE__*/ (0, ($parcel$interopDefault($3swss$react))).createElement("div", {
        role: "presentation",
        ref: ref,
        className: className,
        style: {
            ...$3a715986d9e59f30$export$1481e64fbe01b8b3(layoutInfo, direction, parent),
            ...style
        }
    }, children);
}
let $3a715986d9e59f30$var$cache = new WeakMap();
function $3a715986d9e59f30$export$1481e64fbe01b8b3(layoutInfo, dir, parent) {
    let xProperty = dir === 'rtl' ? 'right' : 'left';
    let cached = $3a715986d9e59f30$var$cache.get(layoutInfo);
    if (cached && cached[xProperty] != null) {
        if (!parent) return cached;
        // Invalidate if the parent position changed.
        let top = layoutInfo.rect.y - parent.rect.y;
        let x = layoutInfo.rect.x - parent.rect.x;
        if (cached.top === top && cached[xProperty] === x) return cached;
    }
    let rectStyles = {
        // TODO: For layoutInfos that are sticky that have parents with overflow visible, their "top" will be relative to the to the nearest scrolling container
        // which WON'T be the parent since the parent has overflow visible. This means we shouldn't offset the height by the parent's position
        // Not 100% about this change here since it is quite ambigious what the scrolling container maybe and how its top is positioned with respect to the
        // calculated layoutInfo.y here
        top: layoutInfo.rect.y - (parent && !(parent.allowOverflow && layoutInfo.isSticky) ? parent.rect.y : 0),
        [xProperty]: layoutInfo.rect.x - (parent && !(parent.allowOverflow && layoutInfo.isSticky) ? parent.rect.x : 0),
        width: layoutInfo.rect.width,
        height: layoutInfo.rect.height
    };
    // Get rid of any non finite values since they aren't valid css values
    Object.entries(rectStyles).forEach(([key, value])=>{
        if (!Number.isFinite(value)) rectStyles[key] = undefined;
    });
    let style = {
        position: layoutInfo.isSticky ? 'sticky' : 'absolute',
        // Sticky elements are positioned in normal document flow. Display inline-block so that they don't push other sticky columns onto the following rows.
        display: layoutInfo.isSticky ? 'inline-block' : undefined,
        overflow: layoutInfo.allowOverflow ? 'visible' : 'hidden',
        opacity: layoutInfo.opacity,
        zIndex: layoutInfo.zIndex,
        transform: layoutInfo.transform ?? undefined,
        contain: 'size layout style',
        ...rectStyles
    };
    $3a715986d9e59f30$var$cache.set(layoutInfo, style);
    return style;
}


//# sourceMappingURL=VirtualizerItem.cjs.map
