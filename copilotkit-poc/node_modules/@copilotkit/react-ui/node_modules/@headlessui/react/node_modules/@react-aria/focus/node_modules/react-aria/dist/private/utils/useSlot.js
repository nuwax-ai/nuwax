import {useId as $0292efe68908de6b$export$f680877a34711e37} from "./useId.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "./useLayoutEffect.js";
import {useState as $eS0xj$useState, useRef as $eS0xj$useRef, useCallback as $eS0xj$useCallback} from "react";

/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


function $901b0394915cd0c2$export$9d4c57ee4c6ffdd8(initialState = true) {
    // Initial state is typically based on the parent having an aria-label or aria-labelledby.
    // If it does, this value should be false so that we don't update the state and cause a rerender when we go through the layoutEffect
    let [hasSlot, setHasSlot] = (0, $eS0xj$useState)(initialState);
    let hasRun = (0, $eS0xj$useRef)(false);
    // A callback ref which will run when the slotted element mounts.
    // This should happen before the useLayoutEffect below.
    let ref = (0, $eS0xj$useCallback)((el)=>{
        hasRun.current = true;
        setHasSlot(!!el);
    }, []);
    // If the callback hasn't been called, then reset to false.
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (!hasRun.current) setHasSlot(false);
    }, []);
    return [
        ref,
        hasSlot
    ];
}
function $901b0394915cd0c2$export$ed2feabec4a533f4(initialState = true) {
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let [ref, hasSlot] = $901b0394915cd0c2$export$9d4c57ee4c6ffdd8(initialState);
    return {
        id: hasSlot ? id : undefined,
        ref: ref
    };
}


export {$901b0394915cd0c2$export$9d4c57ee4c6ffdd8 as useSlot, $901b0394915cd0c2$export$ed2feabec4a533f4 as useSlotId2};
//# sourceMappingURL=useSlot.js.map
