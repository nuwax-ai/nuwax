import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "./usePress.mjs";
import {useRef as $cZVsC$useRef} from "react";

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






const $7b01448eaad0fe7c$var$DEFAULT_THRESHOLD = 500;
function $7b01448eaad0fe7c$export$c24ed0104d07eab9(props) {
    let { isDisabled: isDisabled, onLongPressStart: onLongPressStart, onLongPressEnd: onLongPressEnd, onLongPress: onLongPress, threshold: threshold = $7b01448eaad0fe7c$var$DEFAULT_THRESHOLD, accessibilityDescription: accessibilityDescription } = props;
    const timeRef = (0, $cZVsC$useRef)(undefined);
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let { pressProps: pressProps } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
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
                    if ((0, $d447af545b77c9f1$export$b204af158042fbac)(e.target).activeElement !== e.target) (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(e.target);
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
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(e.target);
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
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(onLongPress && !isDisabled ? accessibilityDescription : undefined);
    return {
        longPressProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(pressProps, descriptionProps)
    };
}


export {$7b01448eaad0fe7c$export$c24ed0104d07eab9 as useLongPress};
//# sourceMappingURL=useLongPress.mjs.map
