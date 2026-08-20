var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $f09fbd1748f346a7$exports = require("../utils/runAfterTransition.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "disableTextSelection", function () { return $521cd8692c5ee610$export$16a4697467175487; });
$parcel$export(module.exports, "restoreTextSelection", function () { return $521cd8692c5ee610$export$b0d6fa1ab32e3295; });
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


// Note that state only matters here for iOS. Non-iOS gets user-select: none applied to the target element
// rather than at the document level so we just need to apply/remove user-select: none for each pressed element individually
let $521cd8692c5ee610$var$state = 'default';
let $521cd8692c5ee610$var$savedUserSelect = '';
let $521cd8692c5ee610$var$modifiedElementMap = new WeakMap();
function $521cd8692c5ee610$export$16a4697467175487(target) {
    if ((0, $d0b4a781cf26e80b$exports.isIOS)()) {
        if ($521cd8692c5ee610$var$state === 'default') {
            const documentObject = (0, $49582955cc364b1c$exports.getOwnerDocument)(target);
            $521cd8692c5ee610$var$savedUserSelect = documentObject.documentElement.style.webkitUserSelect;
            documentObject.documentElement.style.webkitUserSelect = 'none';
        }
        $521cd8692c5ee610$var$state = 'disabled';
    } else if (target instanceof HTMLElement || target instanceof SVGElement) {
        // If not iOS, store the target's original user-select and change to user-select: none
        // Ignore state since it doesn't apply for non iOS
        let property = 'userSelect' in target.style ? 'userSelect' : 'webkitUserSelect';
        $521cd8692c5ee610$var$modifiedElementMap.set(target, target.style[property]);
        target.style[property] = 'none';
    }
}
function $521cd8692c5ee610$export$b0d6fa1ab32e3295(target) {
    if ((0, $d0b4a781cf26e80b$exports.isIOS)()) {
        // If the state is already default, there's nothing to do.
        // If it is restoring, then there's no need to queue a second restore.
        if ($521cd8692c5ee610$var$state !== 'disabled') return;
        $521cd8692c5ee610$var$state = 'restoring';
        // There appears to be a delay on iOS where selection still might occur
        // after pointer up, so wait a bit before removing user-select.
        setTimeout(()=>{
            // Wait for any CSS transitions to complete so we don't recompute style
            // for the whole page in the middle of the animation and cause jank.
            (0, $f09fbd1748f346a7$exports.runAfterTransition)(()=>{
                // Avoid race conditions
                if ($521cd8692c5ee610$var$state === 'restoring') {
                    const documentObject = (0, $49582955cc364b1c$exports.getOwnerDocument)(target);
                    if (documentObject.documentElement.style.webkitUserSelect === 'none') documentObject.documentElement.style.webkitUserSelect = $521cd8692c5ee610$var$savedUserSelect || '';
                    $521cd8692c5ee610$var$savedUserSelect = '';
                    $521cd8692c5ee610$var$state = 'default';
                }
            });
        }, 300);
    } else if (target instanceof HTMLElement || target instanceof SVGElement) // If not iOS, restore the target's original user-select if any
    // Ignore state since it doesn't apply for non iOS
    {
        if (target && $521cd8692c5ee610$var$modifiedElementMap.has(target)) {
            let targetOldUserSelect = $521cd8692c5ee610$var$modifiedElementMap.get(target);
            let property = 'userSelect' in target.style ? 'userSelect' : 'webkitUserSelect';
            if (target.style[property] === 'none') target.style[property] = targetOldUserSelect;
            if (target.getAttribute('style') === '') target.removeAttribute('style');
            $521cd8692c5ee610$var$modifiedElementMap.delete(target);
        }
    }
}


//# sourceMappingURL=textSelection.cjs.map
