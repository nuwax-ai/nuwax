var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $c3885d691318bb9e$exports = require("./ScrollView.cjs");
var $23f235a8e68fa530$exports = require("../utils/useLoadMore.cjs");
var $d3019c77b88650e9$exports = require("../utils/useObjectRef.cjs");
var $3a715986d9e59f30$exports = require("./VirtualizerItem.cjs");
var $hbRpH$reactstatelyuseVirtualizerState = require("react-stately/useVirtualizerState");
var $hbRpH$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "Virtualizer", function () { return $f0d111efd6f37103$export$89be5a243e59c4b2; });
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






const $f0d111efd6f37103$export$89be5a243e59c4b2 = /*#__PURE__*/ (0, ($parcel$interopDefault($hbRpH$react))).forwardRef(function Virtualizer(props, forwardedRef) {
    let { children: renderView, renderWrapper: renderWrapper, layout: layout, collection: collection, scrollDirection: scrollDirection, isLoading: isLoading, onLoadMore: onLoadMore, persistedKeys: persistedKeys, layoutOptions: layoutOptions, ...otherProps } = props;
    let ref = (0, $d3019c77b88650e9$exports.useObjectRef)(forwardedRef);
    let state = (0, $hbRpH$reactstatelyuseVirtualizerState.useVirtualizerState)({
        layout: layout,
        collection: collection,
        renderView: renderView,
        onVisibleRectChange (rect) {
            if (ref.current) {
                ref.current.scrollLeft = rect.x;
                ref.current.scrollTop = rect.y;
            }
        },
        persistedKeys: persistedKeys,
        layoutOptions: layoutOptions
    });
    (0, $23f235a8e68fa530$exports.useLoadMore)({
        isLoading: isLoading,
        onLoadMore: onLoadMore,
        scrollOffset: 1
    }, ref);
    let onVisibleRectChange = (0, $hbRpH$react.useCallback)((rect)=>{
        state.setVisibleRect(rect);
    }, [
        state
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($hbRpH$react))).createElement((0, $c3885d691318bb9e$exports.ScrollView), {
        ...(0, $89b39774f3b79dbb$exports.mergeProps)(otherProps, {
            onVisibleRectChange: onVisibleRectChange
        }),
        ref: ref,
        contentSize: state.contentSize,
        onScrollStart: state.startScrolling,
        onScrollEnd: state.endScrolling,
        scrollDirection: scrollDirection
    }, $f0d111efd6f37103$var$renderChildren(null, state.visibleViews, renderWrapper || $f0d111efd6f37103$var$defaultRenderWrapper));
});
function $f0d111efd6f37103$var$renderChildren(parent, views, renderWrapper) {
    return views.map((view)=>{
        return renderWrapper(parent, view, view.children ? Array.from(view.children) : [], (childViews)=>$f0d111efd6f37103$var$renderChildren(view, childViews, renderWrapper));
    });
}
function $f0d111efd6f37103$var$defaultRenderWrapper(parent, reusableView) {
    return /*#__PURE__*/ (0, ($parcel$interopDefault($hbRpH$react))).createElement((0, $3a715986d9e59f30$exports.VirtualizerItem), {
        key: reusableView.key,
        layoutInfo: reusableView.layoutInfo,
        virtualizer: reusableView.virtualizer,
        parent: parent?.layoutInfo
    }, reusableView.rendered);
}


//# sourceMappingURL=Virtualizer.cjs.map
