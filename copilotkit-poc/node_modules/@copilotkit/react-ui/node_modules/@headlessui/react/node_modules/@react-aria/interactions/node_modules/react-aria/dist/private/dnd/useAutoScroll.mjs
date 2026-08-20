import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import {isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1, isWebKit as $2add3ce32c6007eb$export$78551043582a6a98} from "../utils/platform.mjs";
import {isScrollable as $901761b40e390936$export$2bb74740c4e19def} from "../utils/isScrollable.mjs";
import {useRef as $cDuW3$useRef, useEffect as $cDuW3$useEffect, useCallback as $cDuW3$useCallback} from "react";

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



const $aa7c06e7625d1455$var$AUTOSCROLL_AREA_SIZE = 20;
function $aa7c06e7625d1455$export$6323452ca4533ed8(ref) {
    let scrollableRef = (0, $cDuW3$useRef)(null);
    let scrollableX = (0, $cDuW3$useRef)(true);
    let scrollableY = (0, $cDuW3$useRef)(true);
    (0, $cDuW3$useEffect)(()=>{
        if (ref.current) {
            scrollableRef.current = (0, $901761b40e390936$export$2bb74740c4e19def)(ref.current) ? ref.current : (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current);
            let style = window.getComputedStyle(scrollableRef.current);
            scrollableX.current = /(auto|scroll)/.test(style.overflowX);
            scrollableY.current = /(auto|scroll)/.test(style.overflowY);
        }
    }, [
        ref
    ]);
    let state = (0, $cDuW3$useRef)({
        timer: undefined,
        dx: 0,
        dy: 0
    }).current;
    (0, $cDuW3$useEffect)(()=>{
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
    let scroll = (0, $cDuW3$useCallback)(()=>{
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
            if (!(0, $2add3ce32c6007eb$export$78551043582a6a98)() || (0, $2add3ce32c6007eb$export$fedb369cb70207f1)() || !scrollableRef.current) return;
            let box = scrollableRef.current.getBoundingClientRect();
            let left = $aa7c06e7625d1455$var$AUTOSCROLL_AREA_SIZE;
            let top = $aa7c06e7625d1455$var$AUTOSCROLL_AREA_SIZE;
            let bottom = box.height - $aa7c06e7625d1455$var$AUTOSCROLL_AREA_SIZE;
            let right = box.width - $aa7c06e7625d1455$var$AUTOSCROLL_AREA_SIZE;
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


export {$aa7c06e7625d1455$export$6323452ca4533ed8 as useAutoScroll};
//# sourceMappingURL=useAutoScroll.mjs.map
