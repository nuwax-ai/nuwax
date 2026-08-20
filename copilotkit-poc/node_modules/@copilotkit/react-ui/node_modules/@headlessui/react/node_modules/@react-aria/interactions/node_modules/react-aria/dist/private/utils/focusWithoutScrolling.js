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
 */ function $d559d872031c749f$export$de79e2c695e052f3(element) {
    if ($d559d872031c749f$var$supportsPreventScroll()) element.focus({
        preventScroll: true
    });
    else {
        let scrollableElements = $d559d872031c749f$var$getScrollableElements(element);
        element.focus();
        $d559d872031c749f$var$restoreScrollPosition(scrollableElements);
    }
}
let $d559d872031c749f$var$supportsPreventScrollCached = null;
function $d559d872031c749f$var$supportsPreventScroll() {
    if ($d559d872031c749f$var$supportsPreventScrollCached == null) {
        $d559d872031c749f$var$supportsPreventScrollCached = false;
        try {
            let focusElem = document.createElement('div');
            focusElem.focus({
                get preventScroll () {
                    $d559d872031c749f$var$supportsPreventScrollCached = true;
                    return true;
                }
            });
        } catch  {
        // Ignore
        }
    }
    return $d559d872031c749f$var$supportsPreventScrollCached;
}
function $d559d872031c749f$var$getScrollableElements(element) {
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
function $d559d872031c749f$var$restoreScrollPosition(scrollableElements) {
    for (let { element: element, scrollTop: scrollTop, scrollLeft: scrollLeft } of scrollableElements){
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
    }
}


export {$d559d872031c749f$export$de79e2c695e052f3 as focusWithoutScrolling};
//# sourceMappingURL=focusWithoutScrolling.js.map
