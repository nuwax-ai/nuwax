var $d865e4ff74ef4a73$exports = require("./getScrollParent.cjs");
var $d6e22460ce4d6b26$exports = require("./useEffectEvent.cjs");
var $429333cab433657c$exports = require("./useLayoutEffect.cjs");
var $fynYm$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLoadMoreSentinel", function () { return $5f430741f11e366b$export$ccaea96c28e8b9e7; });
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



function $5f430741f11e366b$export$ccaea96c28e8b9e7(props, ref) {
    let { collection: collection, onLoadMore: onLoadMore, scrollOffset: scrollOffset = 1 } = props;
    let sentinelObserver = (0, $fynYm$react.useRef)(null);
    let triggerLoadMore = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((entries)=>{
        // Use "isIntersecting" over an equality check of 0 since it seems like there is cases where
        // a intersection ratio of 0 can be reported when isIntersecting is actually true
        for (let entry of entries)// Note that this will be called if the collection changes, even if onLoadMore was already called and is being processed.
        // Up to user discretion as to how to handle these multiple onLoadMore calls
        if (entry.isIntersecting && onLoadMore) onLoadMore();
    });
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (ref.current) {
            // Tear down and set up a new IntersectionObserver when the collection changes so that we can properly trigger additional loadMores if there is room for more items
            // Need to do this tear down and set up since using a large rootMargin will mean the observer's callback isn't called even when scrolling the item into view beause its visibility hasn't actually changed
            // https://codesandbox.io/p/sandbox/magical-swanson-dhgp89?file=%2Fsrc%2FApp.js%3A21%2C21
            sentinelObserver.current = new IntersectionObserver(triggerLoadMore, {
                root: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref?.current),
                rootMargin: `0px ${100 * scrollOffset}% ${100 * scrollOffset}% ${100 * scrollOffset}%`
            });
            sentinelObserver.current.observe(ref.current);
        }
        return ()=>{
            if (sentinelObserver.current) sentinelObserver.current.disconnect();
        };
    }, [
        collection,
        ref,
        scrollOffset
    ]);
}


//# sourceMappingURL=useLoadMoreSentinel.cjs.map
