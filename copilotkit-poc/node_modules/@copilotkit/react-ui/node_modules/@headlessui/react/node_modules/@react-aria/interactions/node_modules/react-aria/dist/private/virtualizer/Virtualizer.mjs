import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {ScrollView as $d83ca946696b1300$export$5665e3d6be6adea} from "./ScrollView.mjs";
import {useLoadMore as $e21c75ef2d96a1a6$export$7717c92ee915373e} from "../utils/useLoadMore.mjs";
import {useObjectRef as $03e8ab2d84d7657a$export$4338b53315abf666} from "../utils/useObjectRef.mjs";
import {VirtualizerItem as $6c92e9e346cd7b1c$export$6796df8ba7398521} from "./VirtualizerItem.mjs";
import {useVirtualizerState as $d5eNm$useVirtualizerState} from "react-stately/useVirtualizerState";
import $d5eNm$react, {useCallback as $d5eNm$useCallback} from "react";

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






const $b29c836adf9e092e$export$89be5a243e59c4b2 = /*#__PURE__*/ (0, $d5eNm$react).forwardRef(function Virtualizer(props, forwardedRef) {
    let { children: renderView, renderWrapper: renderWrapper, layout: layout, collection: collection, scrollDirection: scrollDirection, isLoading: isLoading, onLoadMore: onLoadMore, persistedKeys: persistedKeys, layoutOptions: layoutOptions, ...otherProps } = props;
    let ref = (0, $03e8ab2d84d7657a$export$4338b53315abf666)(forwardedRef);
    let state = (0, $d5eNm$useVirtualizerState)({
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
    (0, $e21c75ef2d96a1a6$export$7717c92ee915373e)({
        isLoading: isLoading,
        onLoadMore: onLoadMore,
        scrollOffset: 1
    }, ref);
    let onVisibleRectChange = (0, $d5eNm$useCallback)((rect)=>{
        state.setVisibleRect(rect);
    }, [
        state
    ]);
    return /*#__PURE__*/ (0, $d5eNm$react).createElement((0, $d83ca946696b1300$export$5665e3d6be6adea), {
        ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(otherProps, {
            onVisibleRectChange: onVisibleRectChange
        }),
        ref: ref,
        contentSize: state.contentSize,
        onScrollStart: state.startScrolling,
        onScrollEnd: state.endScrolling,
        scrollDirection: scrollDirection
    }, $b29c836adf9e092e$var$renderChildren(null, state.visibleViews, renderWrapper || $b29c836adf9e092e$var$defaultRenderWrapper));
});
function $b29c836adf9e092e$var$renderChildren(parent, views, renderWrapper) {
    return views.map((view)=>{
        return renderWrapper(parent, view, view.children ? Array.from(view.children) : [], (childViews)=>$b29c836adf9e092e$var$renderChildren(view, childViews, renderWrapper));
    });
}
function $b29c836adf9e092e$var$defaultRenderWrapper(parent, reusableView) {
    return /*#__PURE__*/ (0, $d5eNm$react).createElement((0, $6c92e9e346cd7b1c$export$6796df8ba7398521), {
        key: reusableView.key,
        layoutInfo: reusableView.layoutInfo,
        virtualizer: reusableView.virtualizer,
        parent: parent?.layoutInfo
    }, reusableView.rendered);
}


export {$b29c836adf9e092e$export$89be5a243e59c4b2 as Virtualizer};
//# sourceMappingURL=Virtualizer.mjs.map
