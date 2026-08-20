import {Rect as $af827553fd3cf456$export$c79fc6492f3af13d} from "./Rect.mjs";
import {Size as $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec} from "./Size.mjs";
import {Virtualizer as $4537523c0f2a47dc$export$89be5a243e59c4b2} from "./Virtualizer.mjs";
import $hZxmE$react, {useState as $hZxmE$useState, useRef as $hZxmE$useRef, useMemo as $hZxmE$useMemo, useCallback as $hZxmE$useCallback} from "react";

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



const $51e619e0f141c3ec$export$e5c5a5f917a5871c = typeof document !== 'undefined' ? (0, $hZxmE$react).useLayoutEffect : ()=>{};
function $51e619e0f141c3ec$export$1505db82fe357e65(opts) {
    let [visibleRect, setVisibleRect] = (0, $hZxmE$useState)(new (0, $af827553fd3cf456$export$c79fc6492f3af13d)(0, 0, 0, 0));
    let [size, setSize] = (0, $hZxmE$useState)(new (0, $cc8e610d5d6e3fe4$export$cb6da89c6af1a8ec)());
    let [isScrolling, setScrolling] = (0, $hZxmE$useState)(false);
    let [invalidationContext, setInvalidationContext] = (0, $hZxmE$useState)({});
    let visibleRectChanged = (0, $hZxmE$useRef)(false);
    let [virtualizer] = (0, $hZxmE$useState)(()=>new (0, $4537523c0f2a47dc$export$89be5a243e59c4b2)({
            collection: opts.collection,
            layout: opts.layout,
            delegate: {
                setVisibleRect (rect) {
                    setVisibleRect(rect);
                    visibleRectChanged.current = true;
                },
                // TODO: should changing these invalidate the entire cache?
                renderView: opts.renderView,
                invalidate: setInvalidationContext
            }
        }));
    // onVisibleRectChange must be called from an effect, not during render.
    $51e619e0f141c3ec$export$e5c5a5f917a5871c(()=>{
        if (visibleRectChanged.current) {
            visibleRectChanged.current = false;
            opts.onVisibleRectChange(visibleRect);
        }
    });
    let mergedInvalidationContext = (0, $hZxmE$useMemo)(()=>{
        if (opts.layoutOptions != null) return {
            ...invalidationContext,
            layoutOptions: opts.layoutOptions
        };
        return invalidationContext;
    }, [
        invalidationContext,
        opts.layoutOptions
    ]);
    let visibleViews = virtualizer.render({
        layout: opts.layout,
        collection: opts.collection,
        persistedKeys: opts.persistedKeys,
        layoutOptions: opts.layoutOptions,
        visibleRect: visibleRect,
        size: opts.allowsWindowScrolling ? size : visibleRect,
        invalidationContext: mergedInvalidationContext,
        isScrolling: isScrolling
    });
    let contentSize = virtualizer.contentSize;
    let startScrolling = (0, $hZxmE$useCallback)(()=>{
        setScrolling(true);
    }, []);
    let endScrolling = (0, $hZxmE$useCallback)(()=>{
        setScrolling(false);
    }, []);
    let state = (0, $hZxmE$useMemo)(()=>({
            virtualizer: virtualizer,
            visibleViews: visibleViews,
            setVisibleRect: setVisibleRect,
            size: size,
            setSize: setSize,
            contentSize: contentSize,
            isScrolling: isScrolling,
            startScrolling: startScrolling,
            endScrolling: endScrolling
        }), [
        virtualizer,
        visibleViews,
        setVisibleRect,
        size,
        setSize,
        contentSize,
        isScrolling,
        startScrolling,
        endScrolling
    ]);
    return state;
}


export {$51e619e0f141c3ec$export$e5c5a5f917a5871c as useLayoutEffect, $51e619e0f141c3ec$export$1505db82fe357e65 as useVirtualizerState};
//# sourceMappingURL=useVirtualizerState.mjs.map
