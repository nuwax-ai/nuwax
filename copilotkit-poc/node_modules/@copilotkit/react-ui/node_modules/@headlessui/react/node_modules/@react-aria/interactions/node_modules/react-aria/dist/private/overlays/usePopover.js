import {ariaHideOutside as $20aa6983aa303ce6$export$1c3ebcada18427bf, keepVisible as $20aa6983aa303ce6$export$1020fa7f77e17884} from "./ariaHideOutside.js";
import {useOverlayPosition as $e55325afa7851309$export$d39e1813b3bdd0e1} from "./useOverlayPosition.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useOverlay as $1a051e369e68734b$export$ea8f71083e90600f} from "./useOverlay.js";
import {usePreventScroll as $100c50c02aceaf6e$export$ee0f7cc6afcd1c18} from "./usePreventScroll.js";
import {useEffect as $6dR5U$useEffect} from "react";

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





function $c238dca4a8f34a03$export$542a6fd13ac93354(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, groupRef: groupRef, isNonModal: isNonModal, isKeyboardDismissDisabled: isKeyboardDismissDisabled, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside, ...otherProps } = props;
    let isSubmenu = otherProps['trigger'] === 'SubmenuTrigger';
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $1a051e369e68734b$export$ea8f71083e90600f)({
        isOpen: state.isOpen,
        onClose: state.close,
        shouldCloseOnBlur: true,
        isDismissable: !isNonModal || isSubmenu,
        isKeyboardDismissDisabled: isKeyboardDismissDisabled,
        shouldCloseOnInteractOutside: shouldCloseOnInteractOutside
    }, groupRef !== null && groupRef !== void 0 ? groupRef : popoverRef);
    let { overlayProps: positionProps, arrowProps: arrowProps, placement: placement, triggerAnchorPoint: origin } = (0, $e55325afa7851309$export$d39e1813b3bdd0e1)({
        ...otherProps,
        targetRef: triggerRef,
        overlayRef: popoverRef,
        isOpen: state.isOpen,
        onClose: isNonModal && !isSubmenu ? state.close : null
    });
    (0, $100c50c02aceaf6e$export$ee0f7cc6afcd1c18)({
        isDisabled: isNonModal || !state.isOpen
    });
    (0, $6dR5U$useEffect)(()=>{
        if (state.isOpen && popoverRef.current) {
            var _groupRef_current, _groupRef_current1;
            if (isNonModal) return (0, $20aa6983aa303ce6$export$1020fa7f77e17884)((_groupRef_current = groupRef === null || groupRef === void 0 ? void 0 : groupRef.current) !== null && _groupRef_current !== void 0 ? _groupRef_current : popoverRef.current);
            else return (0, $20aa6983aa303ce6$export$1c3ebcada18427bf)([
                (_groupRef_current1 = groupRef === null || groupRef === void 0 ? void 0 : groupRef.current) !== null && _groupRef_current1 !== void 0 ? _groupRef_current1 : popoverRef.current
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
        popoverProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(overlayProps, positionProps),
        arrowProps: arrowProps,
        underlayProps: underlayProps,
        placement: placement,
        triggerAnchorPoint: origin
    };
}


export {$c238dca4a8f34a03$export$542a6fd13ac93354 as usePopover};
//# sourceMappingURL=usePopover.js.map
