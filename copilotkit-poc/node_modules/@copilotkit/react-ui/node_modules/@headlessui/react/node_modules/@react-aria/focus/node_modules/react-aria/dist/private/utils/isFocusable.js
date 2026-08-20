import {isElementVisible as $7570c7c1cd2bea0b$export$e989c0fffaa6b27a} from "./isElementVisible.js";

/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
const $ee5e22534121197a$var$focusableElements = [
    'input:not([disabled]):not([type=hidden])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'a[href]',
    'area[href]',
    'summary',
    'iframe',
    'object',
    'embed',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable^="false"])',
    'permission'
];
const $ee5e22534121197a$var$FOCUSABLE_ELEMENT_SELECTOR = $ee5e22534121197a$var$focusableElements.join(':not([hidden]),') + ',[tabindex]:not([disabled]):not([hidden])';
$ee5e22534121197a$var$focusableElements.push('[tabindex]:not([tabindex="-1"]):not([disabled])');
const $ee5e22534121197a$var$TABBABLE_ELEMENT_SELECTOR = $ee5e22534121197a$var$focusableElements.join(':not([hidden]):not([tabindex="-1"]),');
function $ee5e22534121197a$export$4c063cf1350e6fed(element, options) {
    return element.matches($ee5e22534121197a$var$FOCUSABLE_ELEMENT_SELECTOR) && !$ee5e22534121197a$var$isInert(element) && ((options === null || options === void 0 ? void 0 : options.skipVisibilityCheck) || (0, $7570c7c1cd2bea0b$export$e989c0fffaa6b27a)(element));
}
function $ee5e22534121197a$export$bebd5a1431fec25d(element) {
    return element.matches($ee5e22534121197a$var$TABBABLE_ELEMENT_SELECTOR) && (0, $7570c7c1cd2bea0b$export$e989c0fffaa6b27a)(element) && !$ee5e22534121197a$var$isInert(element);
}
function $ee5e22534121197a$var$isInert(element) {
    let node = element;
    while(node != null){
        if (node instanceof node.ownerDocument.defaultView.HTMLElement && node.inert) return true;
        node = node.parentElement;
    }
    return false;
}


export {$ee5e22534121197a$export$4c063cf1350e6fed as isFocusable, $ee5e22534121197a$export$bebd5a1431fec25d as isTabbable};
//# sourceMappingURL=isFocusable.js.map
