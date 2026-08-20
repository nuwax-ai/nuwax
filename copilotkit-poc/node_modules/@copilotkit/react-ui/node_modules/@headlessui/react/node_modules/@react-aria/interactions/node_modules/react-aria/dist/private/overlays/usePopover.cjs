var $3c73045d61be2d91$exports = require("./ariaHideOutside.cjs");
var $9b27591aafdd7244$exports = require("./useOverlayPosition.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $79bdf1333d17b238$exports = require("./useOverlay.cjs");
var $b5daf4744c764686$exports = require("./usePreventScroll.cjs");
var $4Qri4$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "usePopover", function () { return $55bfcc8b5195fb51$export$542a6fd13ac93354; });
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 





function $55bfcc8b5195fb51$export$542a6fd13ac93354(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, groupRef: groupRef, isNonModal: isNonModal, isKeyboardDismissDisabled: isKeyboardDismissDisabled, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside, ...otherProps } = props;
    let isSubmenu = otherProps['trigger'] === 'SubmenuTrigger';
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $79bdf1333d17b238$exports.useOverlay)({
        isOpen: state.isOpen,
        onClose: state.close,
        shouldCloseOnBlur: true,
        isDismissable: !isNonModal || isSubmenu,
        isKeyboardDismissDisabled: isKeyboardDismissDisabled,
        shouldCloseOnInteractOutside: shouldCloseOnInteractOutside
    }, groupRef ?? popoverRef);
    let { overlayProps: positionProps, arrowProps: arrowProps, placement: placement, triggerAnchorPoint: origin } = (0, $9b27591aafdd7244$exports.useOverlayPosition)({
        ...otherProps,
        targetRef: triggerRef,
        overlayRef: popoverRef,
        isOpen: state.isOpen,
        onClose: isNonModal && !isSubmenu ? state.close : null
    });
    (0, $b5daf4744c764686$exports.usePreventScroll)({
        isDisabled: isNonModal || !state.isOpen
    });
    (0, $4Qri4$react.useEffect)(()=>{
        if (state.isOpen && popoverRef.current) {
            if (isNonModal) return (0, $3c73045d61be2d91$exports.keepVisible)(groupRef?.current ?? popoverRef.current);
            else return (0, $3c73045d61be2d91$exports.ariaHideOutside)([
                groupRef?.current ?? popoverRef.current
            ], {
                shouldUseInert: true
            });
        }
    }, [
        isNonModal,
        state.isOpen,
        popoverRef,
        groupRef
    ]);
    return {
        popoverProps: (0, $89b39774f3b79dbb$exports.mergeProps)(overlayProps, positionProps),
        arrowProps: arrowProps,
        underlayProps: underlayProps,
        placement: placement,
        triggerAnchorPoint: origin
    };
}


//# sourceMappingURL=usePopover.cjs.map
