import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac, getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "./usePress.js";
import {useRef as $5cIqd$useRef} from "react";

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






const $4a63d38d4cd3f004$var$DEFAULT_THRESHOLD = 500;
function $4a63d38d4cd3f004$export$c24ed0104d07eab9(props) {
    let { isDisabled: isDisabled, onLongPressStart: onLongPressStart, onLongPressEnd: onLongPressEnd, onLongPress: onLongPress, threshold: threshold = $4a63d38d4cd3f004$var$DEFAULT_THRESHOLD, accessibilityDescription: accessibilityDescription } = props;
    const timeRef = (0, $5cIqd$useRef)(undefined);
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let { pressProps: pressProps } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        isDisabled: isDisabled,
        onPressStart (e) {
            e.continuePropagation();
            if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
                if (onLongPressStart) onLongPressStart({
                    ...e,
                    type: 'longpressstart'
                });
                timeRef.current = setTimeout(()=>{
                    // Prevent other usePress handlers from also handling this event.
                    e.target.dispatchEvent(new PointerEvent('pointercancel', {
                        bubbles: true
                    }));
                    // Ensure target is focused. On touch devices, browsers typically focus on pointer up.
                    if ((0, $cc3c3666b64debad$export$b204af158042fbac)(e.target).activeElement !== e.target) (0, $d559d872031c749f$export$de79e2c695e052f3)(e.target);
                    if (onLongPress) onLongPress({
                        ...e,
                        type: 'longpress'
                    });
                    timeRef.current = undefined;
                }, threshold);
                // Prevent context menu, which may be opened on long press on touch devices
                if (e.pointerType === 'touch') {
                    let onContextMenu = (e)=>{
                        e.preventDefault();
                    };
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(e.target);
                    addGlobalListener(e.target, 'contextmenu', onContextMenu, {
                        once: true
                    });
                    addGlobalListener(ownerWindow, 'pointerup', ()=>{
                        // If no contextmenu event is fired quickly after pointerup, remove the handler
                        // so future context menu events outside a long press are not prevented.
                        setTimeout(()=>{
                            removeGlobalListener(e.target, 'contextmenu', onContextMenu);
                        }, 30);
                    }, {
                        once: true
                    });
                }
            }
        },
        onPressEnd (e) {
            if (timeRef.current) clearTimeout(timeRef.current);
            if (onLongPressEnd && (e.pointerType === 'mouse' || e.pointerType === 'touch')) onLongPressEnd({
                ...e,
                type: 'longpressend'
            });
        }
    });
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(onLongPress && !isDisabled ? accessibilityDescription : undefined);
    return {
        longPressProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(pressProps, descriptionProps)
    };
}


export {$4a63d38d4cd3f004$export$c24ed0104d07eab9 as useLongPress};
//# sourceMappingURL=useLongPress.js.map
