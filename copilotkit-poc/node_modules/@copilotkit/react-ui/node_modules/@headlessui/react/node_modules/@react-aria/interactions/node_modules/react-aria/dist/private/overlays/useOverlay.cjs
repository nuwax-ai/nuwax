var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $98fa32654925fc3d$exports = require("../interactions/useInteractOutside.cjs");
var $kafiF$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useOverlay", function () { return $79bdf1333d17b238$export$ea8f71083e90600f; });
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




const $79bdf1333d17b238$var$visibleOverlays = [];
function $79bdf1333d17b238$export$ea8f71083e90600f(props, ref) {
    let { onClose: onClose, shouldCloseOnBlur: shouldCloseOnBlur, isOpen: isOpen, isDismissable: isDismissable = false, isKeyboardDismissDisabled: isKeyboardDismissDisabled = false, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside } = props;
    let lastVisibleOverlay = (0, $kafiF$react.useRef)(undefined);
    // Add the overlay ref to the stack of visible overlays on mount, and remove on unmount.
    (0, $kafiF$react.useEffect)(()=>{
        if (isOpen && !$79bdf1333d17b238$var$visibleOverlays.includes(ref)) {
            $79bdf1333d17b238$var$visibleOverlays.push(ref);
            return ()=>{
                let index = $79bdf1333d17b238$var$visibleOverlays.indexOf(ref);
                if (index >= 0) $79bdf1333d17b238$var$visibleOverlays.splice(index, 1);
            };
        }
    }, [
        isOpen,
        ref
    ]);
    // Only hide the overlay when it is the topmost visible overlay in the stack
    let onHide = ()=>{
        if ($79bdf1333d17b238$var$visibleOverlays[$79bdf1333d17b238$var$visibleOverlays.length - 1] === ref && onClose) onClose();
    };
    let onInteractOutsideStart = (e)=>{
        const topMostOverlay = $79bdf1333d17b238$var$visibleOverlays[$79bdf1333d17b238$var$visibleOverlays.length - 1];
        lastVisibleOverlay.current = topMostOverlay;
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
            if (topMostOverlay === ref) e.stopPropagation();
        }
    };
    let onInteractOutside = (e)=>{
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside((0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
            if ($79bdf1333d17b238$var$visibleOverlays[$79bdf1333d17b238$var$visibleOverlays.length - 1] === ref) e.stopPropagation();
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
    (0, $98fa32654925fc3d$exports.useInteractOutside)({
        ref: ref,
        onInteractOutside: isDismissable && isOpen ? onInteractOutside : undefined,
        onInteractOutsideStart: onInteractOutsideStart
    });
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
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
            if (!e.relatedTarget || (0, $9fb4ac1cc58342cc$exports.isElementInChildOfActiveScope)(e.relatedTarget)) return;
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


//# sourceMappingURL=useOverlay.cjs.map
