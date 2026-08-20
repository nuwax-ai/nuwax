import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {isElementInChildOfActiveScope as $903814aeb7d53b38$export$1258395f99bf9cbf} from "../focus/FocusScope.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useInteractOutside as $f655e1abf15bbd1b$export$872b660ac5a1ff98} from "../interactions/useInteractOutside.js";
import {useRef as $imYKu$useRef, useEffect as $imYKu$useEffect} from "react";

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




const $1a051e369e68734b$var$visibleOverlays = [];
function $1a051e369e68734b$export$ea8f71083e90600f(props, ref) {
    let { onClose: onClose, shouldCloseOnBlur: shouldCloseOnBlur, isOpen: isOpen, isDismissable: isDismissable = false, isKeyboardDismissDisabled: isKeyboardDismissDisabled = false, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside } = props;
    let lastVisibleOverlay = (0, $imYKu$useRef)(undefined);
    // Add the overlay ref to the stack of visible overlays on mount, and remove on unmount.
    (0, $imYKu$useEffect)(()=>{
        if (isOpen && !$1a051e369e68734b$var$visibleOverlays.includes(ref)) {
            $1a051e369e68734b$var$visibleOverlays.push(ref);
            return ()=>{
                let index = $1a051e369e68734b$var$visibleOverlays.indexOf(ref);
                if (index >= 0) $1a051e369e68734b$var$visibleOverlays.splice(index, 1);
            };
        }
    }, [
        isOpen,
        ref
    ]);
    // Only hide the overlay when it is the topmost visible overlay in the stack
    let onHide = ()=>{
        if ($1a051e369e68734b$var$visibleOverlays[$1a051e369e68734b$var$visibleOverlays.length - 1] === ref && onClose) onClose();
    };
    let onInteractOutsideStart = (e)=>{
        const topMostOverlay = $1a051e369e68734b$var$visibleOverlays[$1a051e369e68734b$var$visibleOverlays.length - 1];
        lastVisibleOverlay.current = topMostOverlay;
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
            if (topMostOverlay === ref) e.stopPropagation();
        }
    };
    let onInteractOutside = (e)=>{
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
            if ($1a051e369e68734b$var$visibleOverlays[$1a051e369e68734b$var$visibleOverlays.length - 1] === ref) e.stopPropagation();
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
    (0, $f655e1abf15bbd1b$export$872b660ac5a1ff98)({
        ref: ref,
        onInteractOutside: isDismissable && isOpen ? onInteractOutside : undefined,
        onInteractOutsideStart: onInteractOutsideStart
    });
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
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
            if (!e.relatedTarget || (0, $903814aeb7d53b38$export$1258395f99bf9cbf)(e.relatedTarget)) return;
            if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside(e.relatedTarget)) onClose === null || onClose === void 0 ? void 0 : onClose();
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


export {$1a051e369e68734b$export$ea8f71083e90600f as useOverlay};
//# sourceMappingURL=useOverlay.js.map
