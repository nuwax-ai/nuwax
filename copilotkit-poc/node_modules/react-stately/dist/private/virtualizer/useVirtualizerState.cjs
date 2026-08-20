var $2bdd626d0eea82c5$exports = require("./Rect.cjs");
var $f9c934dfa703bb0a$exports = require("./Size.cjs");
var $c3448b396b9ae7a2$exports = require("./Virtualizer.cjs");
var $9G4iu$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useVirtualizerState", function () { return $06e2f939c45e996d$export$1505db82fe357e65; });
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



const $06e2f939c45e996d$export$e5c5a5f917a5871c = typeof document !== 'undefined' ? (0, ($parcel$interopDefault($9G4iu$react))).useLayoutEffect : ()=>{};
function $06e2f939c45e996d$export$1505db82fe357e65(opts) {
    let [visibleRect, setVisibleRect] = (0, $9G4iu$react.useState)(new (0, $2bdd626d0eea82c5$exports.Rect)(0, 0, 0, 0));
    let [size, setSize] = (0, $9G4iu$react.useState)(new (0, $f9c934dfa703bb0a$exports.Size)());
    let [isScrolling, setScrolling] = (0, $9G4iu$react.useState)(false);
    let [invalidationContext, setInvalidationContext] = (0, $9G4iu$react.useState)({});
    let visibleRectChanged = (0, $9G4iu$react.useRef)(false);
    let [virtualizer] = (0, $9G4iu$react.useState)(()=>new (0, $c3448b396b9ae7a2$exports.Virtualizer)({
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
    $06e2f939c45e996d$export$e5c5a5f917a5871c(()=>{
        if (visibleRectChanged.current) {
            visibleRectChanged.current = false;
            opts.onVisibleRectChange(visibleRect);
        }
    });
    let mergedInvalidationContext = (0, $9G4iu$react.useMemo)(()=>{
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
    let startScrolling = (0, $9G4iu$react.useCallback)(()=>{
        setScrolling(true);
    }, []);
    let endScrolling = (0, $9G4iu$react.useCallback)(()=>{
        setScrolling(false);
    }, []);
    let state = (0, $9G4iu$react.useMemo)(()=>({
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


//# sourceMappingURL=useVirtualizerState.cjs.map
