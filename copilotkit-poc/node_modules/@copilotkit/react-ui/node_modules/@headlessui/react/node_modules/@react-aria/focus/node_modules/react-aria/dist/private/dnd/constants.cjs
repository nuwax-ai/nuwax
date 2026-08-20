
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "DROP_OPERATION", function () { return $47f95f5edd0c867d$export$60b7b4bcf3903d8e; });
$parcel$export(module.exports, "DROP_OPERATION_ALLOWED", function () { return $47f95f5edd0c867d$export$9bbdfc78cf083e16; });
$parcel$export(module.exports, "EFFECT_ALLOWED", function () { return $47f95f5edd0c867d$export$dd0165308d8bff45; });
$parcel$export(module.exports, "DROP_EFFECT_TO_DROP_OPERATION", function () { return $47f95f5edd0c867d$export$608ecc6f1b23c35d; });
$parcel$export(module.exports, "DROP_OPERATION_TO_DROP_EFFECT", function () { return $47f95f5edd0c867d$export$5eacb0769d26d3b2; });
$parcel$export(module.exports, "NATIVE_DRAG_TYPES", function () { return $47f95f5edd0c867d$export$4a7729b856e9a690; });
$parcel$export(module.exports, "CUSTOM_DRAG_TYPE", function () { return $47f95f5edd0c867d$export$fd9f9fc120c5402d; });
$parcel$export(module.exports, "GENERIC_TYPE", function () { return $47f95f5edd0c867d$export$f8fc6581787339b3; });
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
 */ var $47f95f5edd0c867d$export$60b7b4bcf3903d8e = /*#__PURE__*/ function(DROP_OPERATION) {
    DROP_OPERATION[DROP_OPERATION["none"] = 0] = "none";
    DROP_OPERATION[DROP_OPERATION["cancel"] = 0] = "cancel";
    DROP_OPERATION[DROP_OPERATION["move"] = 1] = "move";
    DROP_OPERATION[DROP_OPERATION["copy"] = 2] = "copy";
    DROP_OPERATION[DROP_OPERATION["link"] = 4] = "link";
    DROP_OPERATION[DROP_OPERATION["all"] = 7] = "all";
    return DROP_OPERATION;
}({});
const $47f95f5edd0c867d$export$9bbdfc78cf083e16 = {
    ...$47f95f5edd0c867d$export$60b7b4bcf3903d8e,
    copyMove: 3,
    copyLink: 6,
    linkMove: 5,
    all: 7,
    uninitialized: 7
};
const $47f95f5edd0c867d$export$dd0165308d8bff45 = $47f95f5edd0c867d$var$invert($47f95f5edd0c867d$export$9bbdfc78cf083e16);
$47f95f5edd0c867d$export$dd0165308d8bff45[7] = 'all'; // ensure we don't map to 'uninitialized'.
const $47f95f5edd0c867d$export$608ecc6f1b23c35d = {
    none: 'cancel',
    link: 'link',
    copy: 'copy',
    move: 'move'
};
const $47f95f5edd0c867d$export$5eacb0769d26d3b2 = $47f95f5edd0c867d$var$invert($47f95f5edd0c867d$export$608ecc6f1b23c35d);
function $47f95f5edd0c867d$var$invert(object) {
    let res = {};
    for(let key in object)res[object[key]] = key;
    return res;
}
const $47f95f5edd0c867d$export$4a7729b856e9a690 = new Set([
    'text/plain',
    'text/uri-list',
    'text/html'
]);
const $47f95f5edd0c867d$export$fd9f9fc120c5402d = 'application/vnd.react-aria.items+json';
const $47f95f5edd0c867d$export$f8fc6581787339b3 = 'application/octet-stream';


//# sourceMappingURL=constants.cjs.map
