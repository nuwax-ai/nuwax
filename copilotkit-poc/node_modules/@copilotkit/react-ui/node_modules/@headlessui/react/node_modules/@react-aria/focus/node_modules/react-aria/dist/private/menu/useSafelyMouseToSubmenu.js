import {nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useInteractionModality as $b50b1cc8a843ace7$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useResizeObserver as $875907d93ca5631d$export$683480f191c0e3ea} from "../utils/useResizeObserver.js";
import {useRef as $eQBS0$useRef, useState as $eQBS0$useState, useEffect as $eQBS0$useEffect} from "react";







const $43575285b6c61e86$var$ALLOWED_INVALID_MOVEMENTS = 2;
const $43575285b6c61e86$var$THROTTLE_TIME = 50;
const $43575285b6c61e86$var$TIMEOUT_TIME = 1000;
const $43575285b6c61e86$var$ANGLE_PADDING = Math.PI / 12; // 15°
function $43575285b6c61e86$export$85ec83e04c95f50a(options) {
    let { menuRef: menuRef, submenuRef: submenuRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let prevPointerPos = (0, $eQBS0$useRef)(undefined);
    let submenuRect = (0, $eQBS0$useRef)(undefined);
    let lastProcessedTime = (0, $eQBS0$useRef)(0);
    let timeout = (0, $eQBS0$useRef)(undefined);
    let autoCloseTimeout = (0, $eQBS0$useRef)(undefined);
    let submenuSide = (0, $eQBS0$useRef)(undefined);
    let movementsTowardsSubmenuCount = (0, $eQBS0$useRef)(2);
    let [preventPointerEvents, setPreventPointerEvents] = (0, $eQBS0$useState)(false);
    let updateSubmenuRect = ()=>{
        if (submenuRef.current) {
            submenuRect.current = submenuRef.current.getBoundingClientRect();
            submenuSide.current = undefined;
        }
    };
    (0, $875907d93ca5631d$export$683480f191c0e3ea)({
        ref: isOpen ? submenuRef : undefined,
        onResize: updateSubmenuRect
    });
    let reset = ()=>{
        setPreventPointerEvents(false);
        movementsTowardsSubmenuCount.current = $43575285b6c61e86$var$ALLOWED_INVALID_MOVEMENTS;
        prevPointerPos.current = undefined;
    };
    let modality = (0, $b50b1cc8a843ace7$export$98e20ec92f614cfe)();
    // Prevent mouse down over safe triangle. Clicking while pointer-events: none is applied
    // will cause focus to move unexpectedly since it will go to an element behind the menu.
    let onPointerDown = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (preventPointerEvents) e.preventDefault();
    });
    (0, $eQBS0$useEffect)(()=>{
        if (preventPointerEvents && menuRef.current) menuRef.current.style.pointerEvents = 'none';
        else menuRef.current.style.pointerEvents = '';
    }, [
        menuRef,
        preventPointerEvents
    ]);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
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
            if (currentTime - lastProcessedTime.current < $43575285b6c61e86$var$THROTTLE_TIME) return;
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
            let angleTop = Math.atan2(prevMouseY - submenuRect.current.top, toSubmenuX) + $43575285b6c61e86$var$ANGLE_PADDING;
            let angleBottom = Math.atan2(prevMouseY - submenuRect.current.bottom, toSubmenuX) - $43575285b6c61e86$var$ANGLE_PADDING;
            let anglePointer = Math.atan2(prevMouseY - mouseY, submenuSide.current === 'left' ? -(mouseX - prevMouseX) : mouseX - prevMouseX);
            let isMovingTowardsSubmenu = anglePointer < angleTop && anglePointer > angleBottom;
            movementsTowardsSubmenuCount.current = isMovingTowardsSubmenu ? Math.min(movementsTowardsSubmenuCount.current + 1, $43575285b6c61e86$var$ALLOWED_INVALID_MOVEMENTS) : Math.max(movementsTowardsSubmenuCount.current - 1, 0);
            if (movementsTowardsSubmenuCount.current >= $43575285b6c61e86$var$ALLOWED_INVALID_MOVEMENTS) setPreventPointerEvents(true);
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
                    if (target && (0, $d8ac7ed472840322$export$4282f70798064fe0)(menu, target)) target.dispatchEvent(new PointerEvent('pointerover', {
                        bubbles: true,
                        cancelable: true
                    }));
                }, 100);
            }, $43575285b6c61e86$var$TIMEOUT_TIME);
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
            movementsTowardsSubmenuCount.current = $43575285b6c61e86$var$ALLOWED_INVALID_MOVEMENTS;
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


export {$43575285b6c61e86$export$85ec83e04c95f50a as useSafelyMouseToSubmenu};
//# sourceMappingURL=useSafelyMouseToSubmenu.js.map
