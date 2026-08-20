var $7ac82d1fee77eb8a$exports = require("./useId.cjs");
var $429333cab433657c$exports = require("./useLayoutEffect.cjs");
var $cspqt$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSlotId2", function () { return $cfa57f9ca3ae5fa9$export$ed2feabec4a533f4; });
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


function $cfa57f9ca3ae5fa9$export$9d4c57ee4c6ffdd8(initialState = true) {
    // Initial state is typically based on the parent having an aria-label or aria-labelledby.
    // If it does, this value should be false so that we don't update the state and cause a rerender when we go through the layoutEffect
    let [hasSlot, setHasSlot] = (0, $cspqt$react.useState)(initialState);
    let hasRun = (0, $cspqt$react.useRef)(false);
    // A callback ref which will run when the slotted element mounts.
    // This should happen before the useLayoutEffect below.
    let ref = (0, $cspqt$react.useCallback)((el)=>{
        hasRun.current = true;
        setHasSlot(!!el);
    }, []);
    // If the callback hasn't been called, then reset to false.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (!hasRun.current) setHasSlot(false);
    }, []);
    return [
        ref,
        hasSlot
    ];
}
function $cfa57f9ca3ae5fa9$export$ed2feabec4a533f4(initialState = true) {
    let id = (0, $7ac82d1fee77eb8a$exports.useId)();
    let [ref, hasSlot] = $cfa57f9ca3ae5fa9$export$9d4c57ee4c6ffdd8(initialState);
    return {
        id: hasSlot ? id : undefined,
        ref: ref
    };
}


//# sourceMappingURL=useSlot.cjs.map
