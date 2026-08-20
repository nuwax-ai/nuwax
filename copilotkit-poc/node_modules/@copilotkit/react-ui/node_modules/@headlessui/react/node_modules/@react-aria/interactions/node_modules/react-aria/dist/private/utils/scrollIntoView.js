import {getScrollParents as $3d3c16277aab2036$export$94ed1c92c7beeb22} from "./getScrollParents.js";
import {isIOS as $d5a2be505488529f$export$fedb369cb70207f1} from "./platform.js";

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

function $6507765bd7f5ad94$export$53a0910f038337bd(scrollView, element, opts = {}) {
    let { block: block = 'nearest', inline: inline = 'nearest' } = opts;
    if (scrollView === element) return;
    let y = scrollView.scrollTop;
    let x = scrollView.scrollLeft;
    let target = element.getBoundingClientRect();
    let view = scrollView.getBoundingClientRect();
    let itemStyle = window.getComputedStyle(element);
    let viewStyle = window.getComputedStyle(scrollView);
    let root = document.scrollingElement || document.documentElement;
    let isRoot = scrollView === root;
    let viewTop = scrollView === root ? 0 : view.top;
    let viewBottom = scrollView === root ? scrollView.clientHeight : view.bottom;
    let viewLeft = scrollView === root ? 0 : view.left;
    let viewRight = scrollView === root ? scrollView.clientWidth : view.right;
    let scrollMarginTop = parseFloat(itemStyle.scrollMarginTop) || 0;
    let scrollMarginBottom = parseFloat(itemStyle.scrollMarginBottom) || 0;
    let scrollMarginLeft = parseFloat(itemStyle.scrollMarginLeft) || 0;
    let scrollMarginRight = parseFloat(itemStyle.scrollMarginRight) || 0;
    let scrollPaddingTop = parseFloat(viewStyle.scrollPaddingTop) || 0;
    let scrollPaddingBottom = parseFloat(viewStyle.scrollPaddingBottom) || 0;
    let scrollPaddingLeft = parseFloat(viewStyle.scrollPaddingLeft) || 0;
    let scrollPaddingRight = parseFloat(viewStyle.scrollPaddingRight) || 0;
    let borderTopWidth = parseFloat(viewStyle.borderTopWidth) || 0;
    let borderBottomWidth = parseFloat(viewStyle.borderBottomWidth) || 0;
    let borderLeftWidth = parseFloat(viewStyle.borderLeftWidth) || 0;
    let borderRightWidth = parseFloat(viewStyle.borderRightWidth) || 0;
    let scrollAreaTop = target.top - scrollMarginTop;
    let scrollAreaBottom = target.bottom + scrollMarginBottom;
    let scrollAreaLeft = target.left - scrollMarginLeft;
    let scrollAreaRight = target.right + scrollMarginRight;
    let scrollBarOffsetX = scrollView === root ? 0 : borderLeftWidth + borderRightWidth;
    let scrollBarOffsetY = scrollView === root ? 0 : borderTopWidth + borderBottomWidth;
    let scrollBarWidth = scrollView === root ? 0 : scrollView.offsetWidth - scrollView.clientWidth - scrollBarOffsetX;
    let scrollBarHeight = scrollView === root ? 0 : scrollView.offsetHeight - scrollView.clientHeight - scrollBarOffsetY;
    let scrollPortTop = viewTop + (isRoot ? 0 : borderTopWidth) + scrollPaddingTop;
    let scrollPortBottom = viewBottom - (isRoot ? 0 : borderBottomWidth) - scrollPaddingBottom - scrollBarHeight;
    let scrollPortLeft = viewLeft + (isRoot ? 0 : borderLeftWidth) + scrollPaddingLeft;
    let scrollPortRight = viewRight - (isRoot ? 0 : borderRightWidth) - scrollPaddingRight;
    // IOS always positions the scrollbar on the right ¯\_(ツ)_/¯
    if (viewStyle.direction === 'rtl' && !(0, $d5a2be505488529f$export$fedb369cb70207f1)()) scrollPortLeft += scrollBarWidth;
    else scrollPortRight -= scrollBarWidth;
    let shouldScrollBlock = scrollAreaTop < scrollPortTop || scrollAreaBottom > scrollPortBottom;
    let shouldScrollInline = scrollAreaLeft < scrollPortLeft || scrollAreaRight > scrollPortRight;
    if (shouldScrollBlock && block === 'start') y += scrollAreaTop - scrollPortTop;
    else if (shouldScrollBlock && block === 'center') y += (scrollAreaTop + scrollAreaBottom) / 2 - (scrollPortTop + scrollPortBottom) / 2;
    else if (shouldScrollBlock && block === 'end') y += scrollAreaBottom - scrollPortBottom;
    else if (shouldScrollBlock && block === 'nearest') {
        let start = scrollAreaTop - scrollPortTop;
        let end = scrollAreaBottom - scrollPortBottom;
        y += Math.abs(start) <= Math.abs(end) ? start : end;
    }
    if (shouldScrollInline && inline === 'start') x += scrollAreaLeft - scrollPortLeft;
    else if (shouldScrollInline && inline === 'center') x += (scrollAreaLeft + scrollAreaRight) / 2 - (scrollPortLeft + scrollPortRight) / 2;
    else if (shouldScrollInline && inline === 'end') x += scrollAreaRight - scrollPortRight;
    else if (shouldScrollInline && inline === 'nearest') {
        let start = scrollAreaLeft - scrollPortLeft;
        let end = scrollAreaRight - scrollPortRight;
        x += Math.abs(start) <= Math.abs(end) ? start : end;
    }
    if (process.env.NODE_ENV === 'test') {
        scrollView.scrollLeft = x;
        scrollView.scrollTop = y;
        return;
    }
    scrollView.scrollTo({
        left: x,
        top: y
    });
}
function $6507765bd7f5ad94$export$c826860796309d1b(targetElement, opts = {}) {
    let { containingElement: containingElement } = opts;
    if (targetElement && targetElement.isConnected) {
        let root = document.scrollingElement || document.documentElement;
        let isScrollPrevented = window.getComputedStyle(root).overflow === 'hidden';
        if (!isScrollPrevented) {
            var // use scrollIntoView({block: 'nearest'}) instead of .focus to check if the element is fully in view or not since .focus()
            // won't cause a scroll if the element is already focused and doesn't behave consistently when an element is partially out of view horizontally vs vertically
            _targetElement_scrollIntoView;
            let { left: originalLeft, top: originalTop } = targetElement.getBoundingClientRect();
            targetElement === null || targetElement === void 0 ? void 0 : (_targetElement_scrollIntoView = targetElement.scrollIntoView) === null || _targetElement_scrollIntoView === void 0 ? void 0 : _targetElement_scrollIntoView.call(targetElement, {
                block: 'nearest'
            });
            let { left: newLeft, top: newTop } = targetElement.getBoundingClientRect();
            // Account for sub pixel differences from rounding
            if (Math.abs(originalLeft - newLeft) > 1 || Math.abs(originalTop - newTop) > 1) {
                var _containingElement_scrollIntoView, _targetElement_scrollIntoView1;
                containingElement === null || containingElement === void 0 ? void 0 : (_containingElement_scrollIntoView = containingElement.scrollIntoView) === null || _containingElement_scrollIntoView === void 0 ? void 0 : _containingElement_scrollIntoView.call(containingElement, {
                    block: 'center',
                    inline: 'center'
                });
                (_targetElement_scrollIntoView1 = targetElement.scrollIntoView) === null || _targetElement_scrollIntoView1 === void 0 ? void 0 : _targetElement_scrollIntoView1.call(targetElement, {
                    block: 'nearest'
                });
            }
        } else {
            let { left: originalLeft, top: originalTop } = targetElement.getBoundingClientRect();
            // If scrolling is prevented, we don't want to scroll the body since it might move the overlay partially offscreen and the user can't scroll it back into view.
            let scrollParents = (0, $3d3c16277aab2036$export$94ed1c92c7beeb22)(targetElement, true);
            for (let scrollParent of scrollParents)$6507765bd7f5ad94$export$53a0910f038337bd(scrollParent, targetElement);
            let { left: newLeft, top: newTop } = targetElement.getBoundingClientRect();
            // Account for sub pixel differences from rounding
            if (Math.abs(originalLeft - newLeft) > 1 || Math.abs(originalTop - newTop) > 1) {
                scrollParents = containingElement ? (0, $3d3c16277aab2036$export$94ed1c92c7beeb22)(containingElement, true) : [];
                // scroll containing element into view first, then rescroll target element into view like the non chrome flow above
                for (let scrollParent of scrollParents)$6507765bd7f5ad94$export$53a0910f038337bd(scrollParent, containingElement, {
                    block: 'center',
                    inline: 'center'
                });
                for (let scrollParent of (0, $3d3c16277aab2036$export$94ed1c92c7beeb22)(targetElement, true))$6507765bd7f5ad94$export$53a0910f038337bd(scrollParent, targetElement);
            }
        }
    }
}


export {$6507765bd7f5ad94$export$53a0910f038337bd as scrollIntoView, $6507765bd7f5ad94$export$c826860796309d1b as scrollIntoViewport};
//# sourceMappingURL=scrollIntoView.js.map
