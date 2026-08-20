var $49582955cc364b1c$exports = require("./domHelpers.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "isElementVisible", function () { return $d0ea836c96ed0bf7$export$e989c0fffaa6b27a; });
/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
const $d0ea836c96ed0bf7$var$supportsCheckVisibility = typeof Element !== 'undefined' && 'checkVisibility' in Element.prototype;
function $d0ea836c96ed0bf7$var$isStyleVisible(element) {
    const windowObject = (0, $49582955cc364b1c$exports.getOwnerWindow)(element);
    if (!(element instanceof windowObject.HTMLElement) && !(element instanceof windowObject.SVGElement)) return false;
    let { display: display, visibility: visibility } = element.style;
    let isVisible = display !== 'none' && visibility !== 'hidden' && visibility !== 'collapse';
    if (isVisible) {
        const { getComputedStyle: getComputedStyle } = element.ownerDocument.defaultView;
        let { display: computedDisplay, visibility: computedVisibility } = getComputedStyle(element);
        isVisible = computedDisplay !== 'none' && computedVisibility !== 'hidden' && computedVisibility !== 'collapse';
    }
    return isVisible;
}
function $d0ea836c96ed0bf7$var$isAttributeVisible(element, childElement) {
    return !element.hasAttribute('hidden') && // Ignore HiddenSelect when tree walking.
    !element.hasAttribute('data-react-aria-prevent-focus') && (element.nodeName === 'DETAILS' && childElement && childElement.nodeName !== 'SUMMARY' ? element.hasAttribute('open') : true);
}
function $d0ea836c96ed0bf7$export$e989c0fffaa6b27a(element, childElement) {
    if ($d0ea836c96ed0bf7$var$supportsCheckVisibility) return element.checkVisibility({
        visibilityProperty: true
    }) && !element.closest('[data-react-aria-prevent-focus]');
    return element.nodeName !== '#comment' && $d0ea836c96ed0bf7$var$isStyleVisible(element) && $d0ea836c96ed0bf7$var$isAttributeVisible(element, childElement) && (!element.parentElement || $d0ea836c96ed0bf7$export$e989c0fffaa6b27a(element.parentElement, element));
}


//# sourceMappingURL=isElementVisible.cjs.map
