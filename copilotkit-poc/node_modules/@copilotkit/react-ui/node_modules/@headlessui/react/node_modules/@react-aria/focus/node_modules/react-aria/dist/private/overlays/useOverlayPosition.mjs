import {calculatePosition as $954926fb6168ae2a$export$b3ceb0cbf1056d98, getRect as $954926fb6168ae2a$export$4b834cebd9e5cebe} from "./calculatePosition.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, isFocusWithin as $23f2114a1b82827e$export$b4f377a2b6254582} from "../utils/shadowdom/DOMFunctions.mjs";
import {useCloseOnScroll as $22e2f5f6490788e8$export$18fc8428861184da} from "./useCloseOnScroll.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useResizeObserver as $970072cf4b13fde3$export$683480f191c0e3ea} from "../utils/useResizeObserver.mjs";
import {useState as $jKzS8$useState, useRef as $jKzS8$useRef, useEffect as $jKzS8$useEffect, useCallback as $jKzS8$useCallback} from "react";

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






let $b3526bc71400be8d$var$visualViewport = typeof document !== 'undefined' ? window.visualViewport : null;
function $b3526bc71400be8d$export$d39e1813b3bdd0e1(props) {
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let { arrowSize: arrowSize, targetRef: targetRef, overlayRef: overlayRef, arrowRef: arrowRef, scrollRef: scrollRef = overlayRef, placement: placement = 'bottom', containerPadding: containerPadding = 12, shouldFlip: shouldFlip = true, boundaryElement: boundaryElement = typeof document !== 'undefined' ? document.body : null, offset: offset = 0, crossOffset: crossOffset = 0, shouldUpdatePosition: shouldUpdatePosition = true, isOpen: isOpen = true, onClose: onClose, maxHeight: maxHeight, arrowBoundaryOffset: arrowBoundaryOffset = 0 } = props;
    let [position, setPosition] = (0, $jKzS8$useState)(null);
    let deps = [
        shouldUpdatePosition,
        placement,
        overlayRef.current,
        targetRef.current,
        arrowRef?.current,
        scrollRef.current,
        containerPadding,
        shouldFlip,
        boundaryElement,
        offset,
        crossOffset,
        isOpen,
        direction,
        maxHeight,
        arrowBoundaryOffset,
        arrowSize
    ];
    // Note, the position freezing breaks if body sizes itself dynamicly with the visual viewport but that might
    // just be a non-realistic use case
    // Upon opening a overlay, record the current visual viewport scale so we can freeze the overlay styles
    let lastScale = (0, $jKzS8$useRef)($b3526bc71400be8d$var$visualViewport?.scale);
    (0, $jKzS8$useEffect)(()=>{
        if (isOpen) lastScale.current = $b3526bc71400be8d$var$visualViewport?.scale;
    }, [
        isOpen
    ]);
    let updatePosition = (0, $jKzS8$useCallback)(()=>{
        if (shouldUpdatePosition === false || !isOpen || !overlayRef.current || !targetRef.current || !boundaryElement) return;
        if ($b3526bc71400be8d$var$visualViewport?.scale !== lastScale.current) return;
        // Determine a scroll anchor based on the focused element.
        // This stores the offset of the anchor element from the scroll container
        // so it can be restored after repositioning. This way if the overlay height
        // changes, the focused element appears to stay in the same position.
        let anchor = null;
        if (scrollRef.current && (0, $23f2114a1b82827e$export$b4f377a2b6254582)(scrollRef.current)) {
            let anchorRect = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)()?.getBoundingClientRect();
            let scrollRect = scrollRef.current.getBoundingClientRect();
            // Anchor from the top if the offset is in the top half of the scrollable element,
            // otherwise anchor from the bottom.
            anchor = {
                type: 'top',
                offset: (anchorRect?.top ?? 0) - scrollRect.top
            };
            if (anchor.offset > scrollRect.height / 2) {
                anchor.type = 'bottom';
                anchor.offset = (anchorRect?.bottom ?? 0) - scrollRect.bottom;
            }
        }
        // Always reset the overlay's previous max height if not defined by the user so that we can compensate for
        // RAC collections populating after a second render and properly set a correct max height + positioning when it populates.
        let overlay = overlayRef.current;
        if (!maxHeight && overlayRef.current) {
            overlay.style.top = '0px';
            overlay.style.bottom = '';
            overlay.style.maxHeight = (window.visualViewport?.height ?? window.innerHeight) + 'px';
        }
        let position = (0, $954926fb6168ae2a$export$b3ceb0cbf1056d98)({
            placement: $b3526bc71400be8d$var$translateRTL(placement, direction),
            overlayNode: overlayRef.current,
            targetNode: targetRef.current,
            scrollNode: scrollRef.current || overlayRef.current,
            padding: containerPadding,
            shouldFlip: shouldFlip,
            boundaryElement: boundaryElement,
            offset: offset,
            crossOffset: crossOffset,
            maxHeight: maxHeight,
            arrowSize: arrowSize ?? (arrowRef?.current ? (0, $954926fb6168ae2a$export$4b834cebd9e5cebe)(arrowRef.current, true).width : 0),
            arrowBoundaryOffset: arrowBoundaryOffset
        });
        if (!position.position) return;
        // Modify overlay styles directly so positioning happens immediately without the need of a second render
        // This is so we don't have to delay autoFocus scrolling or delay applying preventScroll for popovers
        overlay.style.top = '';
        overlay.style.bottom = '';
        overlay.style.left = '';
        overlay.style.right = '';
        Object.keys(position.position).forEach((key)=>overlay.style[key] = position.position[key] + 'px');
        overlay.style.maxHeight = position.maxHeight != null ? position.maxHeight + 'px' : '';
        // Restore scroll position relative to anchor element.
        let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
        if (anchor && activeElement && scrollRef.current) {
            let anchorRect = activeElement.getBoundingClientRect();
            let scrollRect = scrollRef.current.getBoundingClientRect();
            let newOffset = anchorRect[anchor.type] - scrollRect[anchor.type];
            scrollRef.current.scrollTop += newOffset - anchor.offset;
        }
        // Trigger a set state for a second render anyway for arrow positioning
        setPosition(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    // Update position when anything changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(updatePosition, deps);
    // Update position on window resize
    $b3526bc71400be8d$var$useResize(updatePosition);
    // Update position when the overlay changes size (might need to flip).
    (0, $970072cf4b13fde3$export$683480f191c0e3ea)({
        ref: overlayRef,
        onResize: updatePosition
    });
    // Update position when the target changes size (might need to flip).
    (0, $970072cf4b13fde3$export$683480f191c0e3ea)({
        ref: targetRef,
        onResize: updatePosition
    });
    // Reposition the overlay and do not close on scroll while the visual viewport is resizing.
    // This will ensure that overlays adjust their positioning when the iOS virtual keyboard appears.
    let isResizing = (0, $jKzS8$useRef)(false);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let timeout;
        let onResize = ()=>{
            isResizing.current = true;
            clearTimeout(timeout);
            timeout = setTimeout(()=>{
                isResizing.current = false;
            }, 500);
            updatePosition();
        };
        // Only reposition the overlay if a scroll event happens immediately as a result of resize (aka the virtual keyboard has appears)
        // We don't want to reposition the overlay if the user has pinch zoomed in and is scrolling the viewport around.
        let onScroll = ()=>{
            if (isResizing.current) onResize();
        };
        $b3526bc71400be8d$var$visualViewport?.addEventListener('resize', onResize);
        $b3526bc71400be8d$var$visualViewport?.addEventListener('scroll', onScroll);
        return ()=>{
            $b3526bc71400be8d$var$visualViewport?.removeEventListener('resize', onResize);
            $b3526bc71400be8d$var$visualViewport?.removeEventListener('scroll', onScroll);
        };
    }, [
        updatePosition
    ]);
    let close = (0, $jKzS8$useCallback)(()=>{
        if (!isResizing.current) onClose?.();
    }, [
        onClose,
        isResizing
    ]);
    // When scrolling a parent scrollable region of the trigger (other than the body),
    // we hide the popover. Otherwise, its position would be incorrect.
    (0, $22e2f5f6490788e8$export$18fc8428861184da)({
        triggerRef: targetRef,
        isOpen: isOpen,
        onClose: onClose && close
    });
    return {
        overlayProps: {
            style: {
                position: position ? 'absolute' : 'fixed',
                top: !position ? 0 : undefined,
                left: !position ? 0 : undefined,
                zIndex: 100000,
                ...position?.position,
                maxHeight: position?.maxHeight ?? '100vh'
            }
        },
        placement: position?.placement ?? null,
        triggerAnchorPoint: position?.triggerAnchorPoint ?? null,
        arrowProps: {
            'aria-hidden': 'true',
            role: 'presentation',
            style: {
                left: position?.arrowOffsetLeft,
                top: position?.arrowOffsetTop
            }
        },
        updatePosition: updatePosition
    };
}
function $b3526bc71400be8d$var$useResize(onResize) {
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        window.addEventListener('resize', onResize, false);
        return ()=>{
            window.removeEventListener('resize', onResize, false);
        };
    }, [
        onResize
    ]);
}
function $b3526bc71400be8d$var$translateRTL(position, direction) {
    if (direction === 'rtl') return position.replace('start', 'right').replace('end', 'left');
    return position.replace('start', 'left').replace('end', 'right');
}


export {$b3526bc71400be8d$export$d39e1813b3bdd0e1 as useOverlayPosition};
//# sourceMappingURL=useOverlayPosition.mjs.map
