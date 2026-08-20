import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {useEffect as $8Mq5d$useEffect} from "react";

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

const $22e2f5f6490788e8$export$f6211563215e3b37 = new WeakMap();
function $22e2f5f6490788e8$export$18fc8428861184da(opts) {
    let { triggerRef: triggerRef, isOpen: isOpen, onClose: onClose } = opts;
    (0, $8Mq5d$useEffect)(()=>{
        if (!isOpen || onClose === null) return;
        let onScroll = (e)=>{
            // Ignore if scrolling an scrollable region outside the trigger's tree.
            let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
            // window is not a Node and doesn't have contain, but window contains everything
            if (!triggerRef.current || target instanceof Node && !(0, $23f2114a1b82827e$export$4282f70798064fe0)(target, triggerRef.current)) return;
            // Ignore scroll events on any input or textarea as the cursor position can cause it to scroll
            // such as in a combobox. Clicking the dropdown button places focus on the input, and if the
            // text inside the input extends beyond the 'end', then it will scroll so the cursor is visible at the end.
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
            let onCloseHandler = onClose || $22e2f5f6490788e8$export$f6211563215e3b37.get(triggerRef.current);
            if (onCloseHandler) onCloseHandler();
        };
        window.addEventListener('scroll', onScroll, true);
        return ()=>{
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [
        isOpen,
        onClose,
        triggerRef
    ]);
}


export {$22e2f5f6490788e8$export$f6211563215e3b37 as onCloseMap, $22e2f5f6490788e8$export$18fc8428861184da as useCloseOnScroll};
//# sourceMappingURL=useCloseOnScroll.mjs.map
