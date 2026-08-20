var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $7548a328ef909839$exports = require("../utils/useResizeObserver.cjs");
var $fimuq$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSafelyMouseToSubmenu", function () { return $654d0dc3db8fecae$export$85ec83e04c95f50a; });






const $654d0dc3db8fecae$var$ALLOWED_INVALID_MOVEMENTS = 2;
const $654d0dc3db8fecae$var$THROTTLE_TIME = 50;
const $654d0dc3db8fecae$var$TIMEOUT_TIME = 1000;
const $654d0dc3db8fecae$var$ANGLE_PADDING = Math.PI / 12; // 15°
function $654d0dc3db8fecae$export$85ec83e04c95f50a(options) {
    let { menuRef: menuRef, submenuRef: submenuRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let prevPointerPos = (0, $fimuq$react.useRef)(undefined);
    let submenuRect = (0, $fimuq$react.useRef)(undefined);
    let lastProcessedTime = (0, $fimuq$react.useRef)(0);
    let timeout = (0, $fimuq$react.useRef)(undefined);
    let autoCloseTimeout = (0, $fimuq$react.useRef)(undefined);
    let submenuSide = (0, $fimuq$react.useRef)(undefined);
    let movementsTowardsSubmenuCount = (0, $fimuq$react.useRef)(2);
    let [preventPointerEvents, setPreventPointerEvents] = (0, $fimuq$react.useState)(false);
    let updateSubmenuRect = ()=>{
        if (submenuRef.current) {
            submenuRect.current = submenuRef.current.getBoundingClientRect();
            submenuSide.current = undefined;
        }
    };
    (0, $7548a328ef909839$exports.useResizeObserver)({
        ref: isOpen ? submenuRef : undefined,
        onResize: updateSubmenuRect
    });
    let reset = ()=>{
        setPreventPointerEvents(false);
        movementsTowardsSubmenuCount.current = $654d0dc3db8fecae$var$ALLOWED_INVALID_MOVEMENTS;
        prevPointerPos.current = undefined;
    };
    let modality = (0, $d0df89f3abe2c2ca$exports.useInteractionModality)();
    // Prevent mouse down over safe triangle. Clicking while pointer-events: none is applied
    // will cause focus to move unexpectedly since it will go to an element behind the menu.
    let onPointerDown = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (preventPointerEvents) e.preventDefault();
    });
    (0, $fimuq$react.useEffect)(()=>{
        if (preventPointerEvents && menuRef.current) menuRef.current.style.pointerEvents = 'none';
        else menuRef.current.style.pointerEvents = '';
    }, [
        menuRef,
        preventPointerEvents
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
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
            if (currentTime - lastProcessedTime.current < $654d0dc3db8fecae$var$THROTTLE_TIME) return;
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
            let angleTop = Math.atan2(prevMouseY - submenuRect.current.top, toSubmenuX) + $654d0dc3db8fecae$var$ANGLE_PADDING;
            let angleBottom = Math.atan2(prevMouseY - submenuRect.current.bottom, toSubmenuX) - $654d0dc3db8fecae$var$ANGLE_PADDING;
            let anglePointer = Math.atan2(prevMouseY - mouseY, submenuSide.current === 'left' ? -(mouseX - prevMouseX) : mouseX - prevMouseX);
            let isMovingTowardsSubmenu = anglePointer < angleTop && anglePointer > angleBottom;
            movementsTowardsSubmenuCount.current = isMovingTowardsSubmenu ? Math.min(movementsTowardsSubmenuCount.current + 1, $654d0dc3db8fecae$var$ALLOWED_INVALID_MOVEMENTS) : Math.max(movementsTowardsSubmenuCount.current - 1, 0);
            if (movementsTowardsSubmenuCount.current >= $654d0dc3db8fecae$var$ALLOWED_INVALID_MOVEMENTS) setPreventPointerEvents(true);
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
                    if (target && (0, $da02ee888921bc9e$exports.nodeContains)(menu, target)) target.dispatchEvent(new PointerEvent('pointerover', {
                        bubbles: true,
                        cancelable: true
                    }));
                }, 100);
            }, $654d0dc3db8fecae$var$TIMEOUT_TIME);
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
            movementsTowardsSubmenuCount.current = $654d0dc3db8fecae$var$ALLOWED_INVALID_MOVEMENTS;
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


//# sourceMappingURL=useSafelyMouseToSubmenu.cjs.map
