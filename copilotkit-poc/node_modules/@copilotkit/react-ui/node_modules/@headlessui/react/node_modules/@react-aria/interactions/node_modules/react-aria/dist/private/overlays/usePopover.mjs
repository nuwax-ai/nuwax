import {ariaHideOutside as $58196c8d6a1f38fc$export$1c3ebcada18427bf, keepVisible as $58196c8d6a1f38fc$export$1020fa7f77e17884} from "./ariaHideOutside.mjs";
import {useOverlayPosition as $b3526bc71400be8d$export$d39e1813b3bdd0e1} from "./useOverlayPosition.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useOverlay as $77844860df94ba23$export$ea8f71083e90600f} from "./useOverlay.mjs";
import {usePreventScroll as $0644e3663365bfe5$export$ee0f7cc6afcd1c18} from "./usePreventScroll.mjs";
import {useEffect as $eBJzm$useEffect} from "react";

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





function $f8a024fbad3a5a2e$export$542a6fd13ac93354(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, groupRef: groupRef, isNonModal: isNonModal, isKeyboardDismissDisabled: isKeyboardDismissDisabled, shouldCloseOnInteractOutside: shouldCloseOnInteractOutside, ...otherProps } = props;
    let isSubmenu = otherProps['trigger'] === 'SubmenuTrigger';
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $77844860df94ba23$export$ea8f71083e90600f)({
        isOpen: state.isOpen,
        onClose: state.close,
        shouldCloseOnBlur: true,
        isDismissable: !isNonModal || isSubmenu,
        isKeyboardDismissDisabled: isKeyboardDismissDisabled,
        shouldCloseOnInteractOutside: shouldCloseOnInteractOutside
    }, groupRef ?? popoverRef);
    let { overlayProps: positionProps, arrowProps: arrowProps, placement: placement, triggerAnchorPoint: origin } = (0, $b3526bc71400be8d$export$d39e1813b3bdd0e1)({
        ...otherProps,
        targetRef: triggerRef,
        overlayRef: popoverRef,
        isOpen: state.isOpen,
        onClose: isNonModal && !isSubmenu ? state.close : null
    });
    (0, $0644e3663365bfe5$export$ee0f7cc6afcd1c18)({
        isDisabled: isNonModal || !state.isOpen
    });
    (0, $eBJzm$useEffect)(()=>{
        if (state.isOpen && popoverRef.current) {
            if (isNonModal) return (0, $58196c8d6a1f38fc$export$1020fa7f77e17884)(groupRef?.current ?? popoverRef.current);
            else return (0, $58196c8d6a1f38fc$export$1c3ebcada18427bf)([
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
        popoverProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(overlayProps, positionProps),
        arrowProps: arrowProps,
        underlayProps: underlayProps,
        placement: placement,
        triggerAnchorPoint: origin
    };
}


export {$f8a024fbad3a5a2e$export$542a6fd13ac93354 as usePopover};
//# sourceMappingURL=usePopover.mjs.map
