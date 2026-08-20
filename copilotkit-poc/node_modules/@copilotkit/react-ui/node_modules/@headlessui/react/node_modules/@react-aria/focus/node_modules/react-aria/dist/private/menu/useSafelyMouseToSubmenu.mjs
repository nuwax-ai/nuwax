import {nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useInteractionModality as $8f5a2122b0992be3$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useResizeObserver as $970072cf4b13fde3$export$683480f191c0e3ea} from "../utils/useResizeObserver.mjs";
import {useRef as $iKSsv$useRef, useState as $iKSsv$useState, useEffect as $iKSsv$useEffect} from "react";







const $eac5d44fa99b2e3b$var$ALLOWED_INVALID_MOVEMENTS = 2;
const $eac5d44fa99b2e3b$var$THROTTLE_TIME = 50;
const $eac5d44fa99b2e3b$var$TIMEOUT_TIME = 1000;
const $eac5d44fa99b2e3b$var$ANGLE_PADDING = Math.PI / 12; // 15°
function $eac5d44fa99b2e3b$export$85ec83e04c95f50a(options) {
    let { menuRef: menuRef, submenuRef: submenuRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let prevPointerPos = (0, $iKSsv$useRef)(undefined);
    let submenuRect = (0, $iKSsv$useRef)(undefined);
    let lastProcessedTime = (0, $iKSsv$useRef)(0);
    let timeout = (0, $iKSsv$useRef)(undefined);
    let autoCloseTimeout = (0, $iKSsv$useRef)(undefined);
    let submenuSide = (0, $iKSsv$useRef)(undefined);
    let movementsTowardsSubmenuCount = (0, $iKSsv$useRef)(2);
    let [preventPointerEvents, setPreventPointerEvents] = (0, $iKSsv$useState)(false);
    let updateSubmenuRect = ()=>{
        if (submenuRef.current) {
            submenuRect.current = submenuRef.current.getBoundingClientRect();
            submenuSide.current = undefined;
        }
    };
    (0, $970072cf4b13fde3$export$683480f191c0e3ea)({
        ref: isOpen ? submenuRef : undefined,
        onResize: updateSubmenuRect
    });
    let reset = ()=>{
        setPreventPointerEvents(false);
        movementsTowardsSubmenuCount.current = $eac5d44fa99b2e3b$var$ALLOWED_INVALID_MOVEMENTS;
        prevPointerPos.current = undefined;
    };
    let modality = (0, $8f5a2122b0992be3$export$98e20ec92f614cfe)();
    // Prevent mouse down over safe triangle. Clicking while pointer-events: none is applied
    // will cause focus to move unexpectedly since it will go to an element behind the menu.
    let onPointerDown = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (preventPointerEvents) e.preventDefault();
    });
    (0, $iKSsv$useEffect)(()=>{
        if (preventPointerEvents && menuRef.current) menuRef.current.style.pointerEvents = 'none';
        else menuRef.current.style.pointerEvents = '';
    }, [
        menuRef,
        preventPointerEvents
    ]);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let submenu = submenuRef.current;
        let menu = menuRef.current;
        if (isDisabled || !submenu || !isOpen || modality !== 'pointer' || !menu) {
            reset();
            return;
        }
        submenuRect.current = submenu.getBoundingClientRect();
        let onPointerMove = (e)=>{
            if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
            let currentTime = Date.now();
            // Throttle
            if (currentTime - lastProcessedTime.current < $eac5d44fa99b2e3b$var$THROTTLE_TIME) return;
            clearTimeout(timeout.current);
            clearTimeout(autoCloseTimeout.current);
            let { clientX: mouseX, clientY: mouseY } = e;
            if (!prevPointerPos.current) {
                prevPointerPos.current = {
                    x: mouseX,
                    y: mouseY
                };
                return;
            }
            if (!submenuRect.current) return;
            if (!submenuSide.current) submenuSide.current = mouseX > submenuRect.current.right ? 'left' : 'right';
            // Pointer is outside of parent menu
            if (mouseX < menu.getBoundingClientRect().left || mouseX > menu.getBoundingClientRect().right || mouseY < menu.getBoundingClientRect().top || mouseY > menu.getBoundingClientRect().bottom) {
                reset();
                return;
            }
            /* Check if pointer is moving towards submenu.
        Uses the 2-argument arctangent (https://en.wikipedia.org/wiki/Atan2) to calculate:
          - angle between previous pointer and top of submenu
          - angle between previous pointer and bottom of submenu
          - angle between previous pointer and current pointer (delta)
        If the pointer delta angle value is between the top and bottom angle values, we know the pointer is moving towards the submenu.
      */ let prevMouseX = prevPointerPos.current.x;
            let prevMouseY = prevPointerPos.current.y;
            let toSubmenuX = submenuSide.current === 'right' ? submenuRect.current.left - prevMouseX : prevMouseX - submenuRect.current.right;
            let angleTop = Math.atan2(prevMouseY - submenuRect.current.top, toSubmenuX) + $eac5d44fa99b2e3b$var$ANGLE_PADDING;
            let angleBottom = Math.atan2(prevMouseY - submenuRect.current.bottom, toSubmenuX) - $eac5d44fa99b2e3b$var$ANGLE_PADDING;
            let anglePointer = Math.atan2(prevMouseY - mouseY, submenuSide.current === 'left' ? -(mouseX - prevMouseX) : mouseX - prevMouseX);
            let isMovingTowardsSubmenu = anglePointer < angleTop && anglePointer > angleBottom;
            movementsTowardsSubmenuCount.current = isMovingTowardsSubmenu ? Math.min(movementsTowardsSubmenuCount.current + 1, $eac5d44fa99b2e3b$var$ALLOWED_INVALID_MOVEMENTS) : Math.max(movementsTowardsSubmenuCount.current - 1, 0);
            if (movementsTowardsSubmenuCount.current >= $eac5d44fa99b2e3b$var$ALLOWED_INVALID_MOVEMENTS) setPreventPointerEvents(true);
            else setPreventPointerEvents(false);
            lastProcessedTime.current = currentTime;
            prevPointerPos.current = {
                x: mouseX,
                y: mouseY
            };
            // If the pointer is moving towards the submenu, start a timeout to close if no other movements are made after 500ms.
            if (isMovingTowardsSubmenu) timeout.current = setTimeout(()=>{
                reset();
                autoCloseTimeout.current = setTimeout(()=>{
                    // Fire a pointerover event to trigger the menu to close.
                    // Wait until pointer-events:none is no longer applied
                    let target = document.elementFromPoint(mouseX, mouseY);
                    if (target && (0, $23f2114a1b82827e$export$4282f70798064fe0)(menu, target)) target.dispatchEvent(new PointerEvent('pointerover', {
                        bubbles: true,
                        cancelable: true
                    }));
                }, 100);
            }, $eac5d44fa99b2e3b$var$TIMEOUT_TIME);
        };
        window.addEventListener('pointermove', onPointerMove);
        // Prevent pointer down over the safe triangle. See above comment.
        // Do not enable in tests, because JSDom doesn't do hit testing.
        if (process.env.NODE_ENV !== 'test') window.addEventListener('pointerdown', onPointerDown, true);
        return ()=>{
            window.removeEventListener('pointermove', onPointerMove);
            if (process.env.NODE_ENV !== 'test') window.removeEventListener('pointerdown', onPointerDown, true);
            clearTimeout(timeout.current);
            clearTimeout(autoCloseTimeout.current);
            movementsTowardsSubmenuCount.current = $eac5d44fa99b2e3b$var$ALLOWED_INVALID_MOVEMENTS;
        };
    }, [
        isDisabled,
        isOpen,
        menuRef,
        modality,
        setPreventPointerEvents,
        submenuRef
    ]);
}


export {$eac5d44fa99b2e3b$export$85ec83e04c95f50a as useSafelyMouseToSubmenu};
//# sourceMappingURL=useSafelyMouseToSubmenu.mjs.map
