var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "isNonContiguousSelectionModifier", function () { return $b07dd3d1fedd87d6$export$d3e3bd3e26688c04; });
$parcel$export(module.exports, "getItemElement", function () { return $b07dd3d1fedd87d6$export$c3d8340acf92597f; });
$parcel$export(module.exports, "useCollectionId", function () { return $b07dd3d1fedd87d6$export$881eb0d9f3605d9d; });
$parcel$export(module.exports, "getCollectionId", function () { return $b07dd3d1fedd87d6$export$6aeb1680a0ae8741; });
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

function $b07dd3d1fedd87d6$export$d3e3bd3e26688c04(e) {
    // Ctrl + Arrow Up/Arrow Down has a system wide meaning on macOS, so use Alt instead.
    // On Windows and Ubuntu, Alt + Space has a system wide meaning.
    return (0, $d0b4a781cf26e80b$exports.isAppleDevice)() ? e.altKey : e.ctrlKey;
}
function $b07dd3d1fedd87d6$export$c3d8340acf92597f(collectionRef, key) {
    let selector = `[data-key="${CSS.escape(String(key))}"]`;
    let collection = collectionRef.current?.dataset.collection;
    if (collection) selector = `[data-collection="${CSS.escape(collection)}"]${selector}`;
    return collectionRef.current?.querySelector(selector);
}
const $b07dd3d1fedd87d6$var$collectionMap = new WeakMap();
function $b07dd3d1fedd87d6$export$881eb0d9f3605d9d(collection) {
    let id = (0, $7ac82d1fee77eb8a$exports.useId)();
    $b07dd3d1fedd87d6$var$collectionMap.set(collection, id);
    return id;
}
function $b07dd3d1fedd87d6$export$6aeb1680a0ae8741(collection) {
    return $b07dd3d1fedd87d6$var$collectionMap.get(collection);
}


//# sourceMappingURL=utils.cjs.map
