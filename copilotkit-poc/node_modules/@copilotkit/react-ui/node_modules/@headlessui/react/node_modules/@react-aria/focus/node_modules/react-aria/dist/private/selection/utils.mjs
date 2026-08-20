import {isAppleDevice as $2add3ce32c6007eb$export$e1865c3bedcd822b} from "../utils/platform.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";

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

function $22bbea12c2567021$export$d3e3bd3e26688c04(e) {
    // Ctrl + Arrow Up/Arrow Down has a system wide meaning on macOS, so use Alt instead.
    // On Windows and Ubuntu, Alt + Space has a system wide meaning.
    return (0, $2add3ce32c6007eb$export$e1865c3bedcd822b)() ? e.altKey : e.ctrlKey;
}
function $22bbea12c2567021$export$c3d8340acf92597f(collectionRef, key) {
    let selector = `[data-key="${CSS.escape(String(key))}"]`;
    let collection = collectionRef.current?.dataset.collection;
    if (collection) selector = `[data-collection="${CSS.escape(collection)}"]${selector}`;
    return collectionRef.current?.querySelector(selector);
}
const $22bbea12c2567021$var$collectionMap = new WeakMap();
function $22bbea12c2567021$export$881eb0d9f3605d9d(collection) {
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    $22bbea12c2567021$var$collectionMap.set(collection, id);
    return id;
}
function $22bbea12c2567021$export$6aeb1680a0ae8741(collection) {
    return $22bbea12c2567021$var$collectionMap.get(collection);
}


export {$22bbea12c2567021$export$d3e3bd3e26688c04 as isNonContiguousSelectionModifier, $22bbea12c2567021$export$c3d8340acf92597f as getItemElement, $22bbea12c2567021$export$881eb0d9f3605d9d as useCollectionId, $22bbea12c2567021$export$6aeb1680a0ae8741 as getCollectionId};
//# sourceMappingURL=utils.mjs.map
