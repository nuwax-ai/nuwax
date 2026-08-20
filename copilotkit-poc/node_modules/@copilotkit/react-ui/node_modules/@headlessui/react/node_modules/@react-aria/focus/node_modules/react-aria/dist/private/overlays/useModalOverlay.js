import {ariaHideOutside as $20aa6983aa303ce6$export$1c3ebcada18427bf} from "./ariaHideOutside.js";
import {useOverlay as $1a051e369e68734b$export$ea8f71083e90600f} from "./useOverlay.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useOverlayFocusContain as $0a6ccf9bf972d929$export$14c98a7594375490} from "./Overlay.js";
import {usePreventScroll as $100c50c02aceaf6e$export$ee0f7cc6afcd1c18} from "./usePreventScroll.js";
import {useEffect as $eIIR4$useEffect} from "react";

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





function $a04cecae09b2d04d$export$dbc0f175b25fb0fb(props, state, ref) {
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $1a051e369e68734b$export$ea8f71083e90600f)({
        ...props,
        isOpen: state.isOpen,
        onClose: state.close
    }, ref);
    (0, $100c50c02aceaf6e$export$ee0f7cc6afcd1c18)({
        isDisabled: !state.isOpen
    });
    (0, $0a6ccf9bf972d929$export$14c98a7594375490)();
    (0, $eIIR4$useEffect)(()=>{
        if (state.isOpen && ref.current) return (0, $20aa6983aa303ce6$export$1c3ebcada18427bf)([
            ref.current
        ], {
            shouldUseInert: true
        });
    }, [
        state.isOpen,
        ref
    ]);
    return {
        modalProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(overlayProps),
        underlayProps: underlayProps
    };
}


export {$a04cecae09b2d04d$export$dbc0f175b25fb0fb as useModalOverlay};
//# sourceMappingURL=useModalOverlay.js.map
