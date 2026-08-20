import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {ScrollView as $71fb8ab235f68c9a$export$5665e3d6be6adea} from "./ScrollView.js";
import {useLoadMore as $cd2e8e7876581394$export$7717c92ee915373e} from "../utils/useLoadMore.js";
import {useObjectRef as $5f169cf7bc5a96a9$export$4338b53315abf666} from "../utils/useObjectRef.js";
import {VirtualizerItem as $5e03ff6b3cb668b8$export$6796df8ba7398521} from "./VirtualizerItem.js";
import {useVirtualizerState as $geRo5$useVirtualizerState} from "react-stately/useVirtualizerState";
import $geRo5$react, {useCallback as $geRo5$useCallback} from "react";

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






const $0eb240090a856b8c$export$89be5a243e59c4b2 = /*#__PURE__*/ (0, $geRo5$react).forwardRef(function Virtualizer(props, forwardedRef) {
    let { children: renderView, renderWrapper: renderWrapper, layout: layout, collection: collection, scrollDirection: scrollDirection, isLoading: isLoading, onLoadMore: onLoadMore, persistedKeys: persistedKeys, layoutOptions: layoutOptions, ...otherProps } = props;
    let ref = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)(forwardedRef);
    let state = (0, $geRo5$useVirtualizerState)({
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
    (0, $cd2e8e7876581394$export$7717c92ee915373e)({
        isLoading: isLoading,
        onLoadMore: onLoadMore,
        scrollOffset: 1
    }, ref);
    let onVisibleRectChange = (0, $geRo5$useCallback)((rect)=>{
        state.setVisibleRect(rect);
    }, [
        state
    ]);
    return /*#__PURE__*/ (0, $geRo5$react).createElement((0, $71fb8ab235f68c9a$export$5665e3d6be6adea), {
        ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(otherProps, {
            onVisibleRectChange: onVisibleRectChange
        }),
        ref: ref,
        contentSize: state.contentSize,
        onScrollStart: state.startScrolling,
        onScrollEnd: state.endScrolling,
        scrollDirection: scrollDirection
    }, $0eb240090a856b8c$var$renderChildren(null, state.visibleViews, renderWrapper || $0eb240090a856b8c$var$defaultRenderWrapper));
});
function $0eb240090a856b8c$var$renderChildren(parent, views, renderWrapper) {
    return views.map((view)=>{
        return renderWrapper(parent, view, view.children ? Array.from(view.children) : [], (childViews)=>$0eb240090a856b8c$var$renderChildren(view, childViews, renderWrapper));
    });
}
function $0eb240090a856b8c$var$defaultRenderWrapper(parent, reusableView) {
    return /*#__PURE__*/ (0, $geRo5$react).createElement((0, $5e03ff6b3cb668b8$export$6796df8ba7398521), {
        key: reusableView.key,
        layoutInfo: reusableView.layoutInfo,
        virtualizer: reusableView.virtualizer,
        parent: parent === null || parent === void 0 ? void 0 : parent.layoutInfo
    }, reusableView.rendered);
}


export {$0eb240090a856b8c$export$89be5a243e59c4b2 as Virtualizer};
//# sourceMappingURL=Virtualizer.js.map
