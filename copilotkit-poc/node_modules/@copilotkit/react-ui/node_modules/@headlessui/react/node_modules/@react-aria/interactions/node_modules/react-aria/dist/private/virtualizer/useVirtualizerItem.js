import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {Size as $7P2XF$Size} from "react-stately/useVirtualizerState";
import {useCallback as $7P2XF$useCallback} from "react";

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


function $50fb5bc04a398332$export$1da781778207e0a2(options) {
    let { layoutInfo: layoutInfo, virtualizer: virtualizer, ref: ref } = options;
    let key = layoutInfo === null || layoutInfo === void 0 ? void 0 : layoutInfo.key;
    let updateSize = (0, $7P2XF$useCallback)(()=>{
        if (key != null && ref.current) {
            let size = $50fb5bc04a398332$var$getSize(ref.current);
            virtualizer.updateItemSize(key, size);
        }
    }, [
        virtualizer,
        key,
        ref
    ]);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (layoutInfo === null || layoutInfo === void 0 ? void 0 : layoutInfo.estimatedSize) updateSize();
    });
    return {
        updateSize: updateSize
    };
}
function $50fb5bc04a398332$var$getSize(node) {
    // Reset height before measuring so we get the intrinsic size
    let height = node.style.height;
    node.style.height = '';
    let size = new (0, $7P2XF$Size)(node.scrollWidth, node.scrollHeight);
    node.style.height = height;
    return size;
}


export {$50fb5bc04a398332$export$1da781778207e0a2 as useVirtualizerItem};
//# sourceMappingURL=useVirtualizerItem.js.map
