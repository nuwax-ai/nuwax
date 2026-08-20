import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";
import {isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1} from "../utils/platform.mjs";
import {runAfterTransition as $081cb5757e08788e$export$24490316f764c430} from "../utils/runAfterTransition.mjs";

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
let $cbf007e418543821$var$state = 'default';
let $cbf007e418543821$var$savedUserSelect = '';
let $cbf007e418543821$var$modifiedElementMap = new WeakMap();
function $cbf007e418543821$export$16a4697467175487(target) {
    if ((0, $2add3ce32c6007eb$export$fedb369cb70207f1)()) {
        if ($cbf007e418543821$var$state === 'default') {
            const documentObject = (0, $d447af545b77c9f1$export$b204af158042fbac)(target);
            $cbf007e418543821$var$savedUserSelect = documentObject.documentElement.style.webkitUserSelect;
            documentObject.documentElement.style.webkitUserSelect = 'none';
        }
        $cbf007e418543821$var$state = 'disabled';
    } else if (target instanceof HTMLElement || target instanceof SVGElement) {
        // If not iOS, store the target's original user-select and change to user-select: none
        // Ignore state since it doesn't apply for non iOS
        let property = 'userSelect' in target.style ? 'userSelect' : 'webkitUserSelect';
        $cbf007e418543821$var$modifiedElementMap.set(target, target.style[property]);
        target.style[property] = 'none';
    }
}
function $cbf007e418543821$export$b0d6fa1ab32e3295(target) {
    if ((0, $2add3ce32c6007eb$export$fedb369cb70207f1)()) {
        // If the state is already default, there's nothing to do.
        // If it is restoring, then there's no need to queue a second restore.
        if ($cbf007e418543821$var$state !== 'disabled') return;
        $cbf007e418543821$var$state = 'restoring';
        // There appears to be a delay on iOS where selection still might occur
        // after pointer up, so wait a bit before removing user-select.
        setTimeout(()=>{
            // Wait for any CSS transitions to complete so we don't recompute style
            // for the whole page in the middle of the animation and cause jank.
            (0, $081cb5757e08788e$export$24490316f764c430)(()=>{
                // Avoid race conditions
                if ($cbf007e418543821$var$state === 'restoring') {
                    const documentObject = (0, $d447af545b77c9f1$export$b204af158042fbac)(target);
                    if (documentObject.documentElement.style.webkitUserSelect === 'none') documentObject.documentElement.style.webkitUserSelect = $cbf007e418543821$var$savedUserSelect || '';
                    $cbf007e418543821$var$savedUserSelect = '';
                    $cbf007e418543821$var$state = 'default';
                }
            });
        }, 300);
    } else if (target instanceof HTMLElement || target instanceof SVGElement) // If not iOS, restore the target's original user-select if any
    // Ignore state since it doesn't apply for non iOS
    {
        if (target && $cbf007e418543821$var$modifiedElementMap.has(target)) {
            let targetOldUserSelect = $cbf007e418543821$var$modifiedElementMap.get(target);
            let property = 'userSelect' in target.style ? 'userSelect' : 'webkitUserSelect';
            if (target.style[property] === 'none') target.style[property] = targetOldUserSelect;
            if (target.getAttribute('style') === '') target.removeAttribute('style');
            $cbf007e418543821$var$modifiedElementMap.delete(target);
        }
    }
}


export {$cbf007e418543821$export$16a4697467175487 as disableTextSelection, $cbf007e418543821$export$b0d6fa1ab32e3295 as restoreTextSelection};
//# sourceMappingURL=textSelection.mjs.map
