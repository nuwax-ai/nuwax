import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "./domHelpers.mjs";

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
const $ae77152785188400$var$supportsCheckVisibility = typeof Element !== 'undefined' && 'checkVisibility' in Element.prototype;
function $ae77152785188400$var$isStyleVisible(element) {
    const windowObject = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element);
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
function $ae77152785188400$var$isAttributeVisible(element, childElement) {
    return !element.hasAttribute('hidden') && // Ignore HiddenSelect when tree walking.
    !element.hasAttribute('data-react-aria-prevent-focus') && (element.nodeName === 'DETAILS' && childElement && childElement.nodeName !== 'SUMMARY' ? element.hasAttribute('open') : true);
}
function $ae77152785188400$export$e989c0fffaa6b27a(element, childElement) {
    if ($ae77152785188400$var$supportsCheckVisibility) return element.checkVisibility({
        visibilityProperty: true
    }) && !element.closest('[data-react-aria-prevent-focus]');
    return element.nodeName !== '#comment' && $ae77152785188400$var$isStyleVisible(element) && $ae77152785188400$var$isAttributeVisible(element, childElement) && (!element.parentElement || $ae77152785188400$export$e989c0fffaa6b27a(element.parentElement, element));
}


export {$ae77152785188400$export$e989c0fffaa6b27a as isElementVisible};
//# sourceMappingURL=isElementVisible.mjs.map
