import {getScrollParent as $5b46e0a1626c2890$export$cfa2225e87938781} from "../utils/getScrollParent.js";
import {isIOS as $d5a2be505488529f$export$fedb369cb70207f1, isWebKit as $d5a2be505488529f$export$78551043582a6a98} from "../utils/platform.js";
import {isScrollable as $46e0700f90dc2e20$export$2bb74740c4e19def} from "../utils/isScrollable.js";
import {useRef as $j9qdv$useRef, useEffect as $j9qdv$useEffect, useCallback as $j9qdv$useCallback} from "react";

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



const $9716ccd81874a824$var$AUTOSCROLL_AREA_SIZE = 20;
function $9716ccd81874a824$export$6323452ca4533ed8(ref) {
    let scrollableRef = (0, $j9qdv$useRef)(null);
    let scrollableX = (0, $j9qdv$useRef)(true);
    let scrollableY = (0, $j9qdv$useRef)(true);
    (0, $j9qdv$useEffect)(()=>{
        if (ref.current) {
            scrollableRef.current = (0, $46e0700f90dc2e20$export$2bb74740c4e19def)(ref.current) ? ref.current : (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current);
            let style = window.getComputedStyle(scrollableRef.current);
            scrollableX.current = /(auto|scroll)/.test(style.overflowX);
            scrollableY.current = /(auto|scroll)/.test(style.overflowY);
        }
    }, [
        ref
    ]);
    let state = (0, $j9qdv$useRef)({
        timer: undefined,
        dx: 0,
        dy: 0
    }).current;
    (0, $j9qdv$useEffect)(()=>{
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
    let scroll = (0, $j9qdv$useCallback)(()=>{
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
            if (!(0, $d5a2be505488529f$export$78551043582a6a98)() || (0, $d5a2be505488529f$export$fedb369cb70207f1)() || !scrollableRef.current) return;
            let box = scrollableRef.current.getBoundingClientRect();
            let left = $9716ccd81874a824$var$AUTOSCROLL_AREA_SIZE;
            let top = $9716ccd81874a824$var$AUTOSCROLL_AREA_SIZE;
            let bottom = box.height - $9716ccd81874a824$var$AUTOSCROLL_AREA_SIZE;
            let right = box.width - $9716ccd81874a824$var$AUTOSCROLL_AREA_SIZE;
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


export {$9716ccd81874a824$export$6323452ca4533ed8 as useAutoScroll};
//# sourceMappingURL=useAutoScroll.js.map
