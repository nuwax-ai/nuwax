import {useId as $390e54f620492c70$export$f680877a34711e37} from "./useId.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "./useLayoutEffect.mjs";
import {useState as $hga0N$useState, useRef as $hga0N$useRef, useCallback as $hga0N$useCallback} from "react";

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


function $4c14b02d5228be26$export$9d4c57ee4c6ffdd8(initialState = true) {
    // Initial state is typically based on the parent having an aria-label or aria-labelledby.
    // If it does, this value should be false so that we don't update the state and cause a rerender when we go through the layoutEffect
    let [hasSlot, setHasSlot] = (0, $hga0N$useState)(initialState);
    let hasRun = (0, $hga0N$useRef)(false);
    // A callback ref which will run when the slotted element mounts.
    // This should happen before the useLayoutEffect below.
    let ref = (0, $hga0N$useCallback)((el)=>{
        hasRun.current = true;
        setHasSlot(!!el);
    }, []);
    // If the callback hasn't been called, then reset to false.
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (!hasRun.current) setHasSlot(false);
    }, []);
    return [
        ref,
        hasSlot
    ];
}
function $4c14b02d5228be26$export$ed2feabec4a533f4(initialState = true) {
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    let [ref, hasSlot] = $4c14b02d5228be26$export$9d4c57ee4c6ffdd8(initialState);
    return {
        id: hasSlot ? id : undefined,
        ref: ref
    };
}


export {$4c14b02d5228be26$export$9d4c57ee4c6ffdd8 as useSlot, $4c14b02d5228be26$export$ed2feabec4a533f4 as useSlotId2};
//# sourceMappingURL=useSlot.mjs.map
