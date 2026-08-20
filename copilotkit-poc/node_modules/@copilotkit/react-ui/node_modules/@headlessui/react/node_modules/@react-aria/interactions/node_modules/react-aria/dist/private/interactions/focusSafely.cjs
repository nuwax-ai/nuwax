var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0df89f3abe2c2ca$exports = require("./useFocusVisible.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $f09fbd1748f346a7$exports = require("../utils/runAfterTransition.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "focusSafely", function () { return $4a053a4bf25e52fb$export$80f3e147d781571c; });
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $4a053a4bf25e52fb$export$80f3e147d781571c(element) {
    if (!element.isConnected) return;
    // If the user is interacting with a virtual cursor, e.g. screen reader, then
    // wait until after any animated transitions that are currently occurring on
    // the page before shifting focus. This avoids issues with VoiceOver on iOS
    // causing the page to scroll when moving focus if the element is transitioning
    // from off the screen.
    const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(element);
    if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'virtual') {
        let lastFocusedElement = (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument);
        (0, $f09fbd1748f346a7$exports.runAfterTransition)(()=>{
            const activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument);
            // If focus did not move or focus was lost to the body, and the element is still in the document, focus it.
            if ((activeElement === lastFocusedElement || activeElement === ownerDocument.body) && element.isConnected) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(element);
        });
    } else (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(element);
}


//# sourceMappingURL=focusSafely.cjs.map
