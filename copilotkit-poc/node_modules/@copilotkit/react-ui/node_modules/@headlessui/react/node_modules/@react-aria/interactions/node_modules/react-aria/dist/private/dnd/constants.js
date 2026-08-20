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
 */ var $a5876944c9299b39$export$60b7b4bcf3903d8e = /*#__PURE__*/ function(DROP_OPERATION) {
    DROP_OPERATION[DROP_OPERATION["none"] = 0] = "none";
    DROP_OPERATION[DROP_OPERATION["cancel"] = 0] = "cancel";
    DROP_OPERATION[DROP_OPERATION["move"] = 1] = "move";
    DROP_OPERATION[DROP_OPERATION["copy"] = 2] = "copy";
    DROP_OPERATION[DROP_OPERATION["link"] = 4] = "link";
    DROP_OPERATION[DROP_OPERATION["all"] = 7] = "all";
    return DROP_OPERATION;
}({});
const $a5876944c9299b39$export$9bbdfc78cf083e16 = {
    ...$a5876944c9299b39$export$60b7b4bcf3903d8e,
    copyMove: 3,
    copyLink: 6,
    linkMove: 5,
    all: 7,
    uninitialized: 7
};
const $a5876944c9299b39$export$dd0165308d8bff45 = $a5876944c9299b39$var$invert($a5876944c9299b39$export$9bbdfc78cf083e16);
$a5876944c9299b39$export$dd0165308d8bff45[7] = 'all'; // ensure we don't map to 'uninitialized'.
const $a5876944c9299b39$export$608ecc6f1b23c35d = {
    none: 'cancel',
    link: 'link',
    copy: 'copy',
    move: 'move'
};
const $a5876944c9299b39$export$5eacb0769d26d3b2 = $a5876944c9299b39$var$invert($a5876944c9299b39$export$608ecc6f1b23c35d);
function $a5876944c9299b39$var$invert(object) {
    let res = {};
    for(let key in object)res[object[key]] = key;
    return res;
}
const $a5876944c9299b39$export$4a7729b856e9a690 = new Set([
    'text/plain',
    'text/uri-list',
    'text/html'
]);
const $a5876944c9299b39$export$fd9f9fc120c5402d = 'application/vnd.react-aria.items+json';
const $a5876944c9299b39$export$f8fc6581787339b3 = 'application/octet-stream';


export {$a5876944c9299b39$export$60b7b4bcf3903d8e as DROP_OPERATION, $a5876944c9299b39$export$9bbdfc78cf083e16 as DROP_OPERATION_ALLOWED, $a5876944c9299b39$export$dd0165308d8bff45 as EFFECT_ALLOWED, $a5876944c9299b39$export$608ecc6f1b23c35d as DROP_EFFECT_TO_DROP_OPERATION, $a5876944c9299b39$export$5eacb0769d26d3b2 as DROP_OPERATION_TO_DROP_EFFECT, $a5876944c9299b39$export$4a7729b856e9a690 as NATIVE_DRAG_TYPES, $a5876944c9299b39$export$fd9f9fc120c5402d as CUSTOM_DRAG_TYPE, $a5876944c9299b39$export$f8fc6581787339b3 as GENERIC_TYPE};
//# sourceMappingURL=constants.js.map
