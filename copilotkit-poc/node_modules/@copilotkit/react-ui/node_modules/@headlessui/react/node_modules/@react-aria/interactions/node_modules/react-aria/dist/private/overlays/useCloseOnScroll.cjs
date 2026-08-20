var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $fPNoV$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "onCloseMap", function () { return $bee406a175a03c3e$export$f6211563215e3b37; });
$parcel$export(module.exports, "useCloseOnScroll", function () { return $bee406a175a03c3e$export$18fc8428861184da; });
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

const $bee406a175a03c3e$export$f6211563215e3b37 = new WeakMap();
function $bee406a175a03c3e$export$18fc8428861184da(opts) {
    let { triggerRef: triggerRef, isOpen: isOpen, onClose: onClose } = opts;
    (0, $fPNoV$react.useEffect)(()=>{
        if (!isOpen || onClose === null) return;
        let onScroll = (e)=>{
            // Ignore if scrolling an scrollable region outside the trigger's tree.
            let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
            // window is not a Node and doesn't have contain, but window contains everything
            if (!triggerRef.current || target instanceof Node && !(0, $da02ee888921bc9e$exports.nodeContains)(target, triggerRef.current)) return;
            // Ignore scroll events on any input or textarea as the cursor position can cause it to scroll
            // such as in a combobox. Clicking the dropdown button places focus on the input, and if the
            // text inside the input extends beyond the 'end', then it will scroll so the cursor is visible at the end.
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
            let onCloseHandler = onClose || $bee406a175a03c3e$export$f6211563215e3b37.get(triggerRef.current);
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


//# sourceMappingURL=useCloseOnScroll.cjs.map
