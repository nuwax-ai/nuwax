import {useCalendarBase as $4ca33167bdccdd26$export$d652b3ea2d672d5b} from "./useCalendarBase.mjs";
import {isFocusWithin as $23f2114a1b82827e$export$b4f377a2b6254582, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "../utils/useEvent.mjs";
import {useRef as $k0Wxw$useRef} from "react";

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



function $be0fc2ab732b9d1a$export$87e0539f600c24e5(props, state, ref) {
    let { commitBehavior: commitBehavior = 'select', ...otherProps } = props;
    let res = (0, $4ca33167bdccdd26$export$d652b3ea2d672d5b)(otherProps, state);
    // We need to ignore virtual pointer events from VoiceOver due to these bugs.
    // https://bugs.webkit.org/show_bug.cgi?id=222627
    // https://bugs.webkit.org/show_bug.cgi?id=223202
    // usePress also does this and waits for the following click event before firing.
    // We need to match that here otherwise this will fire before the press event in
    // useCalendarCell, causing range selection to not work properly.
    let isVirtualClick = (0, $k0Wxw$useRef)(false);
    let windowRef = (0, $k0Wxw$useRef)(typeof window !== 'undefined' ? window : null);
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(windowRef, 'pointerdown', (e)=>{
        isVirtualClick.current = e.width === 0 && e.height === 0;
    });
    const commitBehaviorMapping = {
        clear: ()=>state.clearSelection(),
        reset: ()=>state.setAnchorDate(null),
        select: ()=>state.commitSelection()
    };
    // Execute method corresponding to `commitBehavior` when pressing or releasing a pointer outside the calendar body,
    // except when pressing the next or previous buttons to switch months.
    let endDragging = (e)=>{
        if (isVirtualClick.current) {
            isVirtualClick.current = false;
            return;
        }
        state.setDragging(false);
        if (!state.anchorDate) return;
        let target = e.target;
        if (ref.current && (0, $23f2114a1b82827e$export$b4f377a2b6254582)(ref.current) && (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, target) || !target.closest('button, [role="button"]'))) commitBehaviorMapping[commitBehavior]();
    };
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(windowRef, 'pointerup', endDragging);
    // Also execute method corresponding to `commitBehavior` on blur,
    // e.g. tabbing away from the calendar.
    res.calendarProps.onBlur = (e)=>{
        if (!ref.current) return;
        if ((!e.relatedTarget || !(0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, e.relatedTarget)) && state.anchorDate) commitBehaviorMapping[commitBehavior]();
    };
    // Prevent touch scrolling while dragging
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(ref, 'touchmove', (e)=>{
        if (state.isDragging) e.preventDefault();
    }, {
        passive: false,
        capture: true
    });
    return res;
}


export {$be0fc2ab732b9d1a$export$87e0539f600c24e5 as useRangeCalendar};
//# sourceMappingURL=useRangeCalendar.mjs.map
