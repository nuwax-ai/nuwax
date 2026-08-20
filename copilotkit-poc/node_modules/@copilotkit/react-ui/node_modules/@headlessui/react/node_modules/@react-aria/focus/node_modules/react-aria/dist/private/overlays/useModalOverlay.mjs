import {ariaHideOutside as $58196c8d6a1f38fc$export$1c3ebcada18427bf} from "./ariaHideOutside.mjs";
import {useOverlay as $77844860df94ba23$export$ea8f71083e90600f} from "./useOverlay.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useOverlayFocusContain as $d7a937236970dc7f$export$14c98a7594375490} from "./Overlay.mjs";
import {usePreventScroll as $0644e3663365bfe5$export$ee0f7cc6afcd1c18} from "./usePreventScroll.mjs";
import {useEffect as $22yBd$useEffect} from "react";

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





function $5698867baeb53f4e$export$dbc0f175b25fb0fb(props, state, ref) {
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $77844860df94ba23$export$ea8f71083e90600f)({
        ...props,
        isOpen: state.isOpen,
        onClose: state.close
    }, ref);
    (0, $0644e3663365bfe5$export$ee0f7cc6afcd1c18)({
        isDisabled: !state.isOpen
    });
    (0, $d7a937236970dc7f$export$14c98a7594375490)();
    (0, $22yBd$useEffect)(()=>{
        if (state.isOpen && ref.current) return (0, $58196c8d6a1f38fc$export$1c3ebcada18427bf)([
            ref.current
        ], {
            shouldUseInert: true
        });
    }, [
        state.isOpen,
        ref
    ]);
    return {
        modalProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(overlayProps),
        underlayProps: underlayProps
    };
}


export {$5698867baeb53f4e$export$dbc0f175b25fb0fb as useModalOverlay};
//# sourceMappingURL=useModalOverlay.mjs.map
