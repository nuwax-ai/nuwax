var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $f9e7u$reactstatelyuseVirtualizerState = require("react-stately/useVirtualizerState");
var $f9e7u$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useVirtualizerItem", function () { return $a2b3121359008119$export$1da781778207e0a2; });
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


function $a2b3121359008119$export$1da781778207e0a2(options) {
    let { layoutInfo: layoutInfo, virtualizer: virtualizer, ref: ref } = options;
    let key = layoutInfo?.key;
    let updateSize = (0, $f9e7u$react.useCallback)(()=>{
        if (key != null && ref.current) {
            let size = $a2b3121359008119$var$getSize(ref.current);
            virtualizer.updateItemSize(key, size);
        }
    }, [
        virtualizer,
        key,
        ref
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (layoutInfo?.estimatedSize) updateSize();
    });
    return {
        updateSize: updateSize
    };
}
function $a2b3121359008119$var$getSize(node) {
    // Reset height before measuring so we get the intrinsic size
    let height = node.style.height;
    node.style.height = '';
    let size = new (0, $f9e7u$reactstatelyuseVirtualizerState.Size)(node.scrollWidth, node.scrollHeight);
    node.style.height = height;
    return size;
}


//# sourceMappingURL=useVirtualizerItem.cjs.map
