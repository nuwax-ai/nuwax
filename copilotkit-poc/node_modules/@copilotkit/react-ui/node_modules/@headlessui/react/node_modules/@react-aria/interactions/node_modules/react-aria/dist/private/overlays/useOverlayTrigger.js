import {onCloseMap as $767706801671d160$export$f6211563215e3b37} from "./useCloseOnScroll.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useEffect as $gLtqy$useEffect} from "react";

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


function $46a6876c66a2b764$export$f9d5c8beee7d008d(props, state, ref) {
    let { type: type } = props;
    let { isOpen: isOpen } = state;
    // Backward compatibility. Share state close function with useOverlayPosition so it can close on scroll
    // without forcing users to pass onClose.
    (0, $gLtqy$useEffect)(()=>{
        if (ref && ref.current) (0, $767706801671d160$export$f6211563215e3b37).set(ref.current, state.close);
    });
    // Aria 1.1 supports multiple values for aria-haspopup other than just menus.
    // https://www.w3.org/TR/wai-aria-1.1/#aria-haspopup
    // However, we only add it for menus for now because screen readers often
    // announce it as a menu even for other values.
    let ariaHasPopup = undefined;
    if (type === 'menu') ariaHasPopup = true;
    else if (type === 'listbox') ariaHasPopup = 'listbox';
    let overlayId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    return {
        triggerProps: {
            'aria-haspopup': ariaHasPopup,
            'aria-expanded': isOpen,
            'aria-controls': isOpen ? overlayId : undefined,
            onPress: state.toggle
        },
        overlayProps: {
            id: overlayId
        }
    };
}


export {$46a6876c66a2b764$export$f9d5c8beee7d008d as useOverlayTrigger};
//# sourceMappingURL=useOverlayTrigger.js.map
