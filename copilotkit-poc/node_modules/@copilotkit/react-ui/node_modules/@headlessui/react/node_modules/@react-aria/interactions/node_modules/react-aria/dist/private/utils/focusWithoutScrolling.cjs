
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "focusWithoutScrolling", function () { return $4b9e9ed3f006ad27$export$de79e2c695e052f3; });
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
 */ function $4b9e9ed3f006ad27$export$de79e2c695e052f3(element) {
    if ($4b9e9ed3f006ad27$var$supportsPreventScroll()) element.focus({
        preventScroll: true
    });
    else {
        let scrollableElements = $4b9e9ed3f006ad27$var$getScrollableElements(element);
        element.focus();
        $4b9e9ed3f006ad27$var$restoreScrollPosition(scrollableElements);
    }
}
let $4b9e9ed3f006ad27$var$supportsPreventScrollCached = null;
function $4b9e9ed3f006ad27$var$supportsPreventScroll() {
    if ($4b9e9ed3f006ad27$var$supportsPreventScrollCached == null) {
        $4b9e9ed3f006ad27$var$supportsPreventScrollCached = false;
        try {
            let focusElem = document.createElement('div');
            focusElem.focus({
                get preventScroll () {
                    $4b9e9ed3f006ad27$var$supportsPreventScrollCached = true;
                    return true;
                }
            });
        } catch  {
        // Ignore
        }
    }
    return $4b9e9ed3f006ad27$var$supportsPreventScrollCached;
}
function $4b9e9ed3f006ad27$var$getScrollableElements(element) {
    let parent = element.parentNode;
    let scrollableElements = [];
    let rootScrollingElement = document.scrollingElement || document.documentElement;
    while(parent instanceof HTMLElement && parent !== rootScrollingElement){
        if (parent.offsetHeight < parent.scrollHeight || parent.offsetWidth < parent.scrollWidth) scrollableElements.push({
            element: parent,
            scrollTop: parent.scrollTop,
            scrollLeft: parent.scrollLeft
        });
        parent = parent.parentNode;
    }
    if (rootScrollingElement instanceof HTMLElement) scrollableElements.push({
        element: rootScrollingElement,
        scrollTop: rootScrollingElement.scrollTop,
        scrollLeft: rootScrollingElement.scrollLeft
    });
    return scrollableElements;
}
function $4b9e9ed3f006ad27$var$restoreScrollPosition(scrollableElements) {
    for (let { element: element, scrollTop: scrollTop, scrollLeft: scrollLeft } of scrollableElements){
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
    }
}


//# sourceMappingURL=focusWithoutScrolling.cjs.map
