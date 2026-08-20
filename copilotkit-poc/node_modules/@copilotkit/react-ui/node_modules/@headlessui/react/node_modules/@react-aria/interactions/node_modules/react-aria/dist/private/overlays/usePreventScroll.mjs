import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getNonce as $2b2d34ff061957fb$export$2b85b721e524d74b} from "../utils/getNonce.mjs";
import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import {isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1} from "../utils/platform.mjs";
import {isScrollable as $901761b40e390936$export$2bb74740c4e19def} from "../utils/isScrollable.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {willOpenKeyboard as $bb39c0fc1c19b34c$export$c57958e35f31ed73} from "../utils/keyboard.mjs";

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







const $0644e3663365bfe5$var$visualViewport = typeof document !== 'undefined' && window.visualViewport;
// The number of active usePreventScroll calls. Used to determine whether to revert back to the original page style/scroll position
let $0644e3663365bfe5$var$preventScrollCount = 0;
let $0644e3663365bfe5$var$restore;
function $0644e3663365bfe5$export$ee0f7cc6afcd1c18(options = {}) {
    let { isDisabled: isDisabled } = options;
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (isDisabled) return;
        $0644e3663365bfe5$var$preventScrollCount++;
        if ($0644e3663365bfe5$var$preventScrollCount === 1) {
            if ((0, $2add3ce32c6007eb$export$fedb369cb70207f1)()) $0644e3663365bfe5$var$restore = $0644e3663365bfe5$var$preventScrollMobileSafari();
            else $0644e3663365bfe5$var$restore = $0644e3663365bfe5$var$preventScrollStandard();
        }
        return ()=>{
            $0644e3663365bfe5$var$preventScrollCount--;
            if ($0644e3663365bfe5$var$preventScrollCount === 0) $0644e3663365bfe5$var$restore();
        };
    }, [
        isDisabled
    ]);
}
// For most browsers, all we need to do is set `overflow: hidden` on the root element, and
// add some padding to prevent the page from shifting when the scrollbar is hidden.
function $0644e3663365bfe5$var$preventScrollStandard() {
    let scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    return (0, $a4e76a5424781910$export$e08e3b67e392101e)(scrollbarWidth > 0 && // Use scrollbar-gutter when supported because it also works for fixed positioned elements.
    ('scrollbarGutter' in document.documentElement.style ? $0644e3663365bfe5$var$setStyle(document.documentElement, 'scrollbarGutter', 'stable') : $0644e3663365bfe5$var$setStyle(document.documentElement, 'paddingRight', `${scrollbarWidth}px`)), $0644e3663365bfe5$var$setStyle(document.documentElement, 'overflow', 'hidden'));
}
// Mobile Safari is a whole different beast. Even with overflow: hidden,
// it still scrolls the page in many situations:
//
// 1. When the bottom toolbar and address bar are collapsed, page scrolling is always allowed.
// 2. When the keyboard is visible, the viewport does not resize. Instead, the keyboard covers part of
//    it, so it becomes scrollable.
// 3. When tapping on an input, the page always scrolls so that the input is centered in the visual viewport.
//    This may cause even fixed position elements to scroll off the screen.
// 4. When using the next/previous buttons in the keyboard to navigate between inputs, the whole page always
//    scrolls, even if the input is inside a nested scrollable element that could be scrolled instead.
//
// In order to work around these cases, and prevent scrolling without jankiness, we do a few things:
//
// 1. Prevent default on `touchmove` events that are not in a scrollable element. This prevents touch scrolling
//    on the window.
// 2. Set `overscroll-behavior: contain` on nested scrollable regions so they do not scroll the page when at
//    the top or bottom. Work around a bug where this does not work when the element does not actually overflow
//    by preventing default in a `touchmove` event. This is best effort: we can't prevent default when pinch
//    zooming or when an element contains text selection, which may allow scrolling in some cases.
// 3. Prevent default on `touchend` events on input elements and handle focusing the element ourselves.
// 4. When focus moves to an input, create an off screen input and focus that temporarily. This prevents
//    Safari from scrolling the page. After a small delay, focus the real input and scroll it into view
//    ourselves, without scrolling the whole page.
function $0644e3663365bfe5$var$preventScrollMobileSafari() {
    // Set overflow hidden so scrollIntoViewport() (useSelectableCollection) sees isScrollPrevented and
    // scrolls only scroll parents instead of calling native scrollIntoView() which moves the window.
    let restoreOverflow = $0644e3663365bfe5$var$setStyle(document.documentElement, 'overflow', 'hidden');
    let scrollable;
    let allowTouchMove = false;
    let onTouchStart = (e)=>{
        // Store the nearest scrollable parent element from the element that the user touched.
        let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        scrollable = (0, $901761b40e390936$export$2bb74740c4e19def)(target) ? target : (0, $3578607fe3d4b096$export$cfa2225e87938781)(target, true);
        allowTouchMove = false;
        // If the target is selected, don't preventDefault in touchmove to allow user to adjust selection.
        let selection = target.ownerDocument.defaultView.getSelection();
        if (selection && !selection.isCollapsed && selection.containsNode(target, true)) allowTouchMove = true;
        // If this is a range input, allow touch move to allow user to adjust the slider value
        if (e.composedPath().some((el)=>el instanceof HTMLInputElement && el.type === 'range')) allowTouchMove = true;
        // If this is a focused input element with a selected range, allow user to drag the selection handles.
        if ('selectionStart' in target && 'selectionEnd' in target && target.selectionStart < target.selectionEnd && target.ownerDocument.activeElement === target) allowTouchMove = true;
    };
    // Prevent scrolling up when at the top and scrolling down when at the bottom
    // of a nested scrollable area, otherwise mobile Safari will start scrolling
    // the window instead.
    // This must be applied before the touchstart event as of iOS 26, so inject it as a <style> element.
    let style = document.createElement('style');
    let nonce = (0, $2b2d34ff061957fb$export$2b85b721e524d74b)();
    if (nonce) style.nonce = nonce;
    style.textContent = `
@layer {
  * {
    overscroll-behavior: contain;
  }
}`.trim();
    document.head.prepend(style);
    let onTouchMove = (e)=>{
        // Allow pinch-zooming.
        if (e.touches.length === 2 || allowTouchMove) return;
        // Prevent scrolling the window.
        if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
            e.preventDefault();
            return;
        }
        // overscroll-behavior should prevent scroll chaining, but currently does not
        // if the element doesn't actually overflow. https://bugs.webkit.org/show_bug.cgi?id=243452
        // This checks that both the width and height do not overflow, otherwise we might
        // block horizontal scrolling too. In that case, adding `touch-action: pan-x` to
        // the element will prevent vertical page scrolling. We can't add that automatically
        // because it must be set before the touchstart event.
        if (scrollable.scrollHeight === scrollable.clientHeight && scrollable.scrollWidth === scrollable.clientWidth) e.preventDefault();
    };
    let onBlur = (e)=>{
        let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        let relatedTarget = e.relatedTarget;
        if (relatedTarget && (0, $bb39c0fc1c19b34c$export$c57958e35f31ed73)(relatedTarget)) {
            // Focus without scrolling the whole page, and then scroll into view manually.
            relatedTarget.focus({
                preventScroll: true
            });
            $0644e3663365bfe5$var$scrollIntoViewWhenReady(relatedTarget, (0, $bb39c0fc1c19b34c$export$c57958e35f31ed73)(target));
        } else if (!relatedTarget) {
            // When tapping the Done button on the keyboard, focus moves to the body.
            // FocusScope will then restore focus back to the input. Later when tapping
            // the same input again, it is already focused, so no blur event will fire,
            // resulting in the flow above never running and Safari's native scrolling occurring.
            // Instead, move focus to the parent focusable element (e.g. the dialog).
            let focusable = target.parentElement?.closest('[tabindex]');
            focusable?.focus({
                preventScroll: true
            });
        }
    };
    // Override programmatic focus to scroll into view without scrolling the whole page.
    let focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function(opts) {
        // Track whether the keyboard was already visible before.
        let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
        let wasKeyboardVisible = activeElement != null && (0, $bb39c0fc1c19b34c$export$c57958e35f31ed73)(activeElement);
        // Focus the element without scrolling the page.
        focus.call(this, {
            ...opts,
            preventScroll: true
        });
        if (!opts || !opts.preventScroll) $0644e3663365bfe5$var$scrollIntoViewWhenReady(this, wasKeyboardVisible);
    };
    let removeEvents = (0, $a4e76a5424781910$export$e08e3b67e392101e)($0644e3663365bfe5$var$addEvent(document, 'touchstart', onTouchStart, {
        passive: false,
        capture: true
    }), $0644e3663365bfe5$var$addEvent(document, 'touchmove', onTouchMove, {
        passive: false,
        capture: true
    }), $0644e3663365bfe5$var$addEvent(document, 'blur', onBlur, true));
    return ()=>{
        restoreOverflow();
        removeEvents();
        style.remove();
        HTMLElement.prototype.focus = focus;
    };
}
// Sets a CSS property on an element, and returns a function to revert it to the previous value.
function $0644e3663365bfe5$var$setStyle(element, style, value) {
    let cur = element.style[style];
    element.style[style] = value;
    return ()=>{
        element.style[style] = cur;
    };
}
// Adds an event listener to an element, and returns a function to remove it.
function $0644e3663365bfe5$var$addEvent(target, event, handler, options) {
    // internal function, so it's ok to ignore the difficult to fix type error
    // @ts-ignore
    target.addEventListener(event, handler, options);
    return ()=>{
        // @ts-ignore
        target.removeEventListener(event, handler, options);
    };
}
function $0644e3663365bfe5$var$scrollIntoViewWhenReady(target, wasKeyboardVisible) {
    if (wasKeyboardVisible || !$0644e3663365bfe5$var$visualViewport) // If the keyboard was already visible, scroll the target into view immediately.
    $0644e3663365bfe5$var$scrollIntoView(target);
    else // Otherwise, wait for the visual viewport to resize before scrolling so we can
    // measure the correct position to scroll to.
    $0644e3663365bfe5$var$visualViewport.addEventListener('resize', ()=>$0644e3663365bfe5$var$scrollIntoView(target), {
        once: true
    });
}
function $0644e3663365bfe5$var$scrollIntoView(target) {
    let root = document.scrollingElement || document.documentElement;
    let nextTarget = target;
    while(nextTarget && nextTarget !== root){
        // Find the parent scrollable element and adjust the scroll position if the target is not already in view.
        let scrollable = (0, $3578607fe3d4b096$export$cfa2225e87938781)(nextTarget);
        if (scrollable !== document.documentElement && scrollable !== document.body && scrollable !== nextTarget) {
            let scrollableRect = scrollable.getBoundingClientRect();
            let targetRect = nextTarget.getBoundingClientRect();
            if (targetRect.top < scrollableRect.top || targetRect.bottom > scrollableRect.top + nextTarget.clientHeight) {
                let bottom = scrollableRect.bottom;
                if ($0644e3663365bfe5$var$visualViewport) bottom = Math.min(bottom, $0644e3663365bfe5$var$visualViewport.offsetTop + $0644e3663365bfe5$var$visualViewport.height);
                // Center within the viewport.
                let adjustment = targetRect.top - scrollableRect.top - ((bottom - scrollableRect.top) / 2 - targetRect.height / 2);
                scrollable.scrollTo({
                    // Clamp to the valid range to prevent over-scrolling.
                    top: Math.max(0, Math.min(scrollable.scrollHeight - scrollable.clientHeight, scrollable.scrollTop + adjustment)),
                    behavior: 'smooth'
                });
            }
        }
        nextTarget = scrollable.parentElement;
    }
}


export {$0644e3663365bfe5$export$ee0f7cc6afcd1c18 as usePreventScroll};
//# sourceMappingURL=usePreventScroll.mjs.map
