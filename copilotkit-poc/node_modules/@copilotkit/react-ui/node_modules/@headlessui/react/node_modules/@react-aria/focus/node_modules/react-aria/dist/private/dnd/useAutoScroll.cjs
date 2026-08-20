var $d865e4ff74ef4a73$exports = require("../utils/getScrollParent.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $c3942aba3ca10757$exports = require("../utils/isScrollable.cjs");
var $6zcMW$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useAutoScroll", function () { return $430f5a0f46b61af1$export$6323452ca4533ed8; });
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



const $430f5a0f46b61af1$var$AUTOSCROLL_AREA_SIZE = 20;
function $430f5a0f46b61af1$export$6323452ca4533ed8(ref) {
    let scrollableRef = (0, $6zcMW$react.useRef)(null);
    let scrollableX = (0, $6zcMW$react.useRef)(true);
    let scrollableY = (0, $6zcMW$react.useRef)(true);
    (0, $6zcMW$react.useEffect)(()=>{
        if (ref.current) {
            scrollableRef.current = (0, $c3942aba3ca10757$exports.isScrollable)(ref.current) ? ref.current : (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current);
            let style = window.getComputedStyle(scrollableRef.current);
            scrollableX.current = /(auto|scroll)/.test(style.overflowX);
            scrollableY.current = /(auto|scroll)/.test(style.overflowY);
        }
    }, [
        ref
    ]);
    let state = (0, $6zcMW$react.useRef)({
        timer: undefined,
        dx: 0,
        dy: 0
    }).current;
    (0, $6zcMW$react.useEffect)(()=>{
        return ()=>{
            if (state.timer) {
                cancelAnimationFrame(state.timer);
                state.timer = undefined;
            }
        };
    // state will become a new object, so it's ok to use in the dependency array for unmount
    }, [
        state
    ]);
    let scroll = (0, $6zcMW$react.useCallback)(()=>{
        if (scrollableX.current && scrollableRef.current) scrollableRef.current.scrollLeft += state.dx;
        if (scrollableY.current && scrollableRef.current) scrollableRef.current.scrollTop += state.dy;
        if (state.timer) state.timer = requestAnimationFrame(scroll);
    }, [
        scrollableRef,
        state
    ]);
    return {
        move (x, y) {
            // Most browsers auto scroll natively, but WebKit on macOS does not (iOS does 🤷‍♂️).
            // https://bugs.webkit.org/show_bug.cgi?id=222636
            if (!(0, $d0b4a781cf26e80b$exports.isWebKit)() || (0, $d0b4a781cf26e80b$exports.isIOS)() || !scrollableRef.current) return;
            let box = scrollableRef.current.getBoundingClientRect();
            let left = $430f5a0f46b61af1$var$AUTOSCROLL_AREA_SIZE;
            let top = $430f5a0f46b61af1$var$AUTOSCROLL_AREA_SIZE;
            let bottom = box.height - $430f5a0f46b61af1$var$AUTOSCROLL_AREA_SIZE;
            let right = box.width - $430f5a0f46b61af1$var$AUTOSCROLL_AREA_SIZE;
            if (x < left || x > right || y < top || y > bottom) {
                if (x < left) state.dx = x - left;
                else if (x > right) state.dx = x - right;
                if (y < top) state.dy = y - top;
                else if (y > bottom) state.dy = y - bottom;
                if (!state.timer) state.timer = requestAnimationFrame(scroll);
            } else this.stop();
        },
        stop () {
            if (state.timer) {
                cancelAnimationFrame(state.timer);
                state.timer = undefined;
            }
        }
    };
}


//# sourceMappingURL=useAutoScroll.cjs.map
