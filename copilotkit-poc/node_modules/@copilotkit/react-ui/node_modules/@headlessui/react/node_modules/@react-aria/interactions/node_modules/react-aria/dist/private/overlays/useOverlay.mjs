import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {isElementInChildOfActiveScope as $535772f9d2c1f38d$export$1258395f99bf9cbf} from "../focus/FocusScope.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useInteractOutside as $e260d131964da0f9$export$872b660ac5a1ff98} from "../interactions/useInteractOutside.mjs";
import {useRef as $eUNmN$useRef, useEffect as $eUNmN$useEffect} from "react";

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




const $77844860df94ba23$var$visibleOverlays = [];
function $77844860df94ba23$export$ea8f71083e90600f(props, ref) {
    let { onClose: onClose, shouldCloseOnBlur: shouldCloseOnBlur, isOpen: isOpen, isDismissable: isDismissable = false, isKeyboardDismissDisabled: isKeyboardDismissDisabled = false, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside } = props;
    let lastVisibleOverlay = (0, $eUNmN$useRef)(undefined);
    // Add the overlay ref to the stack of visible overlays on mount, and remove on unmount.
    (0, $eUNmN$useEffect)(()=>{
        if (isOpen && !$77844860df94ba23$var$visibleOverlays.includes(ref)) {
            $77844860df94ba23$var$visibleOverlays.push(ref);
            return ()=>{
                let index = $77844860df94ba23$var$visibleOverlays.indexOf(ref);
                if (index >= 0) $77844860df94ba23$var$visibleOverlays.splice(index, 1);
            };
        }
    }, [
        isOpen,
        ref
    ]);
    // Only hide the overlay when it is the topmost visible overlay in the stack
    let onHide = ()=>{
        if ($77844860df94ba23$var$visibleOverlays[$77844860df94ba23$var$visibleOverlays.length - 1] === ref && onClose) onClose();
    };
    let onInteractOutsideStart = (e)=>{
        const topMostOverlay = $77844860df94ba23$var$visibleOverlays[$77844860df94ba23$var$visibleOverlays.length - 1];
        lastVisibleOverlay.current = topMostOverlay;
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
            if (topMostOverlay === ref) e.stopPropagation();
        }
    };
    let onInteractOutside = (e)=>{
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
            if ($77844860df94ba23$var$visibleOverlays[$77844860df94ba23$var$visibleOverlays.length - 1] === ref) e.stopPropagation();
            if (lastVisibleOverlay.current === ref) onHide();
        }
        lastVisibleOverlay.current = undefined;
    };
    // Handle the escape key
    let onKeyDown = (e)=>{
        if (e.key === 'Escape' && !isKeyboardDismissDisabled && !e.nativeEvent.isComposing) {
            e.stopPropagation();
            e.preventDefault();
            onHide();
        }
    };
    // Handle clicking outside the overlay to close it
    (0, $e260d131964da0f9$export$872b660ac5a1ff98)({
        ref: ref,
        onInteractOutside: isDismissable && isOpen ? onInteractOutside : undefined,
        onInteractOutsideStart: onInteractOutsideStart
    });
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        isDisabled: !shouldCloseOnBlur,
        onBlurWithin: (e)=>{
            // Do not close if relatedTarget is null, which means focus is lost to the body.
            // That can happen when switching tabs, or due to a VoiceOver/Chrome bug with Control+Option+Arrow navigation.
            // Clicking on the body to close the overlay should already be handled by useInteractOutside.
            // https://github.com/adobe/react-spectrum/issues/4130
            // https://github.com/adobe/react-spectrum/issues/4922
            //
            // If focus is moving into a child focus scope (e.g. menu inside a dialog),
            // do not close the outer overlay. At this point, the active scope should
            // still be the outer overlay, since blur events run before focus.
            if (!e.relatedTarget || (0, $535772f9d2c1f38d$export$1258395f99bf9cbf)(e.relatedTarget)) return;
            if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside(e.relatedTarget)) onClose?.();
        }
    });
    return {
        overlayProps: {
            onKeyDown: onKeyDown,
            ...focusWithinProps
        },
        underlayProps: {}
    };
}


export {$77844860df94ba23$export$ea8f71083e90600f as useOverlay};
//# sourceMappingURL=useOverlay.mjs.map
