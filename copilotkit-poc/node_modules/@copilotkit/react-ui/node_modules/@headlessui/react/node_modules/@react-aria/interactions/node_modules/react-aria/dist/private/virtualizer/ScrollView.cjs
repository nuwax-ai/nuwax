var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $88075019e53ad6d1$exports = require("./utils.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d3019c77b88650e9$exports = require("../utils/useObjectRef.cjs");
var $7548a328ef909839$exports = require("../utils/useResizeObserver.cjs");
var $bNhn7$reactdom = require("react-dom");
var $bNhn7$reactstatelyuseVirtualizerState = require("react-stately/useVirtualizerState");
var $bNhn7$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useScrollView", function () { return $c3885d691318bb9e$export$2ea0c4974da4731b; });
$parcel$export(module.exports, "ScrollView", function () { return $c3885d691318bb9e$export$5665e3d6be6adea; });
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
 */ // @ts-ignore










function $c3885d691318bb9e$var$ScrollView(props, ref) {
    ref = (0, $d3019c77b88650e9$exports.useObjectRef)(ref);
    let { scrollViewProps: scrollViewProps, contentProps: contentProps } = $c3885d691318bb9e$export$2ea0c4974da4731b(props, ref);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($bNhn7$react))).createElement("div", {
        role: "presentation",
        ...scrollViewProps,
        ref: ref
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($bNhn7$react))).createElement("div", contentProps, props.children));
}
const $c3885d691318bb9e$export$5665e3d6be6adea = /*#__PURE__*/ (0, ($parcel$interopDefault($bNhn7$react))).forwardRef($c3885d691318bb9e$var$ScrollView);
function $c3885d691318bb9e$export$2ea0c4974da4731b(props, ref) {
    let { contentSize: contentSize, onVisibleRectChange: onVisibleRectChange, onSizeChange: onSizeChange, innerStyle: innerStyle, onScrollStart: onScrollStart, onScrollEnd: onScrollEnd, scrollDirection: scrollDirection = 'both', onScroll: onScrollProp, allowsWindowScrolling: allowsWindowScrolling, ...otherProps } = props;
    let state = (0, $bNhn7$react.useRef)({
        // Internal scroll position of the scroll view.
        scrollPosition: new (0, $bNhn7$reactstatelyuseVirtualizerState.Point)(),
        // Size of the scroll view.
        size: new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(),
        // Offset of the scroll view relative to the window viewport.
        viewportOffset: new (0, $bNhn7$reactstatelyuseVirtualizerState.Point)(),
        // Size of the window viewport.
        viewportSize: new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(),
        scrollEndTime: 0,
        scrollTimeout: null,
        isScrolling: false,
        lastVisibleRect: new (0, $bNhn7$reactstatelyuseVirtualizerState.Rect)()
    }).current;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let updateVisibleRect = (0, $bNhn7$react.useCallback)(()=>{
        // Intersect the window viewport with the scroll view itself to find the actual visible rectangle.
        // This allows virtualized components to have unbounded height but still virtualize when scrolled with the page.
        // While there may be other scrollable elements between the <body> and the scroll view, we do not take
        // their sizes into account for performance reasons. Their scroll positions are accounted for in viewportOffset
        // though (due to getBoundingClientRect). This may result in more rows than absolutely necessary being rendered,
        // but no more than the entire height of the viewport which is good enough for virtualization use cases.
        let visibleRect = allowsWindowScrolling ? new (0, $bNhn7$reactstatelyuseVirtualizerState.Rect)(state.viewportOffset.x + state.scrollPosition.x, state.viewportOffset.y + state.scrollPosition.y, Math.max(0, Math.min(state.size.width - state.viewportOffset.x, state.viewportSize.width)), Math.max(0, Math.min(state.size.height - state.viewportOffset.y, state.viewportSize.height))) : new (0, $bNhn7$reactstatelyuseVirtualizerState.Rect)(state.scrollPosition.x, state.scrollPosition.y, state.size.width, state.size.height);
        // Don't emit updates if the visible area is zero and the last emitted area was also zero.
        if (visibleRect.area > 0 || state.lastVisibleRect.area > 0) {
            onVisibleRectChange(visibleRect);
            state.lastVisibleRect = visibleRect;
        }
    }, [
        state,
        allowsWindowScrolling,
        onVisibleRectChange
    ]);
    let [isScrolling, setScrolling] = (0, $bNhn7$react.useState)(false);
    let onScroll = (0, $bNhn7$react.useCallback)((e)=>{
        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(target, ref.current)) return;
        if (onScrollProp && target === ref.current) onScrollProp(e);
        if (target !== ref.current) {
            // An ancestor element or the window was scrolled. Update the position of the scroll view relative to the viewport.
            let boundingRect = ref.current.getBoundingClientRect();
            let x = boundingRect.x < 0 ? -boundingRect.x : 0;
            let y = boundingRect.y < 0 ? -boundingRect.y : 0;
            if (x === state.viewportOffset.x && y === state.viewportOffset.y) return;
            state.viewportOffset = new (0, $bNhn7$reactstatelyuseVirtualizerState.Point)(x, y);
        } else {
            // The scroll view itself was scrolled. Update the local scroll position.
            // Prevent rubber band scrolling from shaking when scrolling out of bounds
            let scrollTop = target.scrollTop;
            let scrollLeft = (0, $88075019e53ad6d1$exports.getScrollLeft)(target, direction);
            state.scrollPosition = new (0, $bNhn7$reactstatelyuseVirtualizerState.Point)(Math.max(0, Math.min(scrollLeft, contentSize.width - state.size.width)), Math.max(0, Math.min(scrollTop, contentSize.height - state.size.height)));
        }
        (0, $bNhn7$reactdom.flushSync)(()=>{
            updateVisibleRect();
            if (!state.isScrolling) {
                state.isScrolling = true;
                setScrolling(true);
                // Pause typekit MutationObserver during scrolling.
                window.dispatchEvent(new Event('tk.disconnect-observer'));
                if (onScrollStart) onScrollStart();
            }
            // So we don't constantly call clearTimeout and setTimeout,
            // keep track of the current timeout time and only reschedule
            // the timer when it is getting close.
            let now = Date.now();
            if (state.scrollEndTime <= now + 50) {
                state.scrollEndTime = now + 300;
                if (state.scrollTimeout != null) clearTimeout(state.scrollTimeout);
                state.scrollTimeout = setTimeout(()=>{
                    state.isScrolling = false;
                    setScrolling(false);
                    state.scrollTimeout = null;
                    window.dispatchEvent(new Event('tk.connect-observer'));
                    if (onScrollEnd) onScrollEnd();
                }, 300);
            }
        });
    }, [
        onScrollProp,
        ref,
        direction,
        state,
        contentSize,
        updateVisibleRect,
        onScrollStart,
        onScrollEnd
    ]);
    // Attach a document-level capturing scroll listener so we can account for scrollable ancestors.
    (0, $bNhn7$react.useEffect)(()=>{
        document.addEventListener('scroll', onScroll, true);
        return ()=>document.removeEventListener('scroll', onScroll, true);
    }, [
        onScroll
    ]);
    (0, $bNhn7$react.useEffect)(()=>{
        return ()=>{
            if (state.scrollTimeout != null) clearTimeout(state.scrollTimeout);
            if (state.isScrolling) window.dispatchEvent(new Event('tk.connect-observer'));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    let isUpdatingSize = (0, $bNhn7$react.useRef)(false);
    let updateSize = (0, $bNhn7$react.useCallback)((flush)=>{
        let dom = ref.current;
        if (!dom || isUpdatingSize.current) return;
        // Prevent reentrancy when resize observer fires, triggers re-layout that results in
        // content size update, causing below layout effect to fire. This avoids infinite loops.
        isUpdatingSize.current = true;
        let isTestEnv = process.env.NODE_ENV === 'test' && !process.env.VIRT_ON;
        let isClientWidthMocked = Object.getOwnPropertyNames(window.HTMLElement.prototype).includes('clientWidth');
        let isClientHeightMocked = Object.getOwnPropertyNames(window.HTMLElement.prototype).includes('clientHeight');
        let clientWidth = dom.clientWidth;
        let clientHeight = dom.clientHeight;
        let w = isTestEnv && !isClientWidthMocked ? Infinity : clientWidth;
        let h = isTestEnv && !isClientHeightMocked ? Infinity : clientHeight;
        // Update the window viewport size.
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        let viewportSizeChanged = state.viewportSize.width !== viewportWidth || state.viewportSize.height !== viewportHeight;
        if (viewportSizeChanged) state.viewportSize = new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(viewportWidth, viewportHeight);
        if (state.size.width !== w || state.size.height !== h || viewportSizeChanged) {
            state.size = new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(w, h);
            flush(()=>{
                updateVisibleRect();
                onSizeChange?.(state.size);
            });
            // If the clientWidth or clientHeight changed, scrollbars appeared or disappeared as
            // a result of the layout update. In this case, re-layout again to account for the
            // adjusted space. In very specific cases this might result in the scrollbars disappearing
            // again, resulting in extra padding. We stop after a maximum of two layout passes to avoid
            // an infinite loop. This matches how browsers behavior with native CSS grid layout.
            if (!isTestEnv && clientWidth !== dom.clientWidth || clientHeight !== dom.clientHeight) {
                state.size = new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(dom.clientWidth, dom.clientHeight);
                flush(()=>{
                    updateVisibleRect();
                    onSizeChange?.(state.size);
                });
            }
        }
        isUpdatingSize.current = false;
    }, [
        ref,
        state,
        updateVisibleRect,
        onSizeChange
    ]);
    let updateSizeEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(updateSize);
    // Track the size of the entire window viewport, which is used to bound the size of the virtualizer's visible rectangle.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        // Initialize viewportRect before updating size for the first time.
        state.viewportSize = new (0, $bNhn7$reactstatelyuseVirtualizerState.Size)(window.innerWidth, window.innerHeight);
        let onWindowResize = ()=>{
            updateSizeEvent((0, $bNhn7$reactdom.flushSync));
        };
        window.addEventListener('resize', onWindowResize);
        return ()=>window.removeEventListener('resize', onWindowResize);
    }, [
        state
    ]);
    // Update visible rect when the content size changes, in case scrollbars need to appear or disappear.
    let lastContentSize = (0, $bNhn7$react.useRef)(null);
    let [update, setUpdate] = (0, $bNhn7$react.useState)({});
    // We only contain a call to setState in here for testing environments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (!isUpdatingSize.current && (lastContentSize.current == null || !contentSize.equals(lastContentSize.current))) {
            // React doesn't allow flushSync inside effects, so queue a microtask.
            // We also need to wait until all refs are set (e.g. when passing a ref down from a parent).
            // If we are in an `act` environment, update immediately without a microtask so you don't need
            // to mock timers in tests. In this case, the update is synchronous already.
            // IS_REACT_ACT_ENVIRONMENT is used by React 18. Previous versions checked for the `jest` global.
            // https://github.com/reactwg/react-18/discussions/102
            if (// @ts-ignore
            typeof IS_REACT_ACT_ENVIRONMENT === 'boolean' ? IS_REACT_ACT_ENVIRONMENT : typeof jest !== 'undefined') {
                // This is so we update size in a separate render but within the same act. Needs to be setState instead of refs
                // due to strict mode.
                setUpdate({});
                lastContentSize.current = contentSize;
                return;
            } else queueMicrotask(()=>updateSizeEvent((0, $bNhn7$reactdom.flushSync)));
        }
        lastContentSize.current = contentSize;
    });
    // Will only run in tests, needs to be in separate effect so it is properly run in the next render in strict mode.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        updateSizeEvent((fn)=>fn());
    }, [
        update
    ]);
    let onResize = (0, $bNhn7$react.useCallback)(()=>{
        updateSize((0, $bNhn7$reactdom.flushSync));
    }, [
        updateSize
    ]);
    // Watch border-box instead of of content-box so that we don't go into
    // an infinite loop when scrollbars appear or disappear.
    (0, $7548a328ef909839$exports.useResizeObserver)({
        ref: ref,
        box: 'border-box',
        onResize: onResize
    });
    let style = {
        // Reset padding so that relative positioning works correctly. Padding will be done in JS layout.
        padding: 0,
        ...otherProps.style
    };
    if (scrollDirection === 'horizontal') {
        style.overflowX = 'auto';
        style.overflowY = 'hidden';
    } else if (scrollDirection === 'vertical' || contentSize.width === state.size.width) {
        // Set overflow-x: hidden if content size is equal to the width of the scroll view.
        // This prevents horizontal scrollbars from flickering during resizing due to resize observer
        // firing slower than the frame rate, which may cause an infinite re-render loop.
        style.overflowY = 'auto';
        style.overflowX = 'hidden';
    } else style.overflow = 'auto';
    innerStyle = {
        width: Number.isFinite(contentSize.width) ? contentSize.width : undefined,
        height: Number.isFinite(contentSize.height) ? contentSize.height : undefined,
        pointerEvents: isScrolling ? 'none' : 'auto',
        position: 'relative',
        ...innerStyle
    };
    return {
        isScrolling: isScrolling,
        scrollViewProps: {
            ...otherProps,
            style: style
        },
        contentProps: {
            role: 'presentation',
            style: innerStyle
        }
    };
}


//# sourceMappingURL=ScrollView.cjs.map
