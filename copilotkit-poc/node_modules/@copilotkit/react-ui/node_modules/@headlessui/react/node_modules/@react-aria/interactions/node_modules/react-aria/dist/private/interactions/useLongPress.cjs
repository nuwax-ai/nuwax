var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $04affd2086a7db64$exports = require("../utils/useGlobalListeners.cjs");
var $1d003dcb6308cd89$exports = require("./usePress.cjs");
var $5oHPU$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLongPress", function () { return $8615756fee3bdacc$export$c24ed0104d07eab9; });
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






const $8615756fee3bdacc$var$DEFAULT_THRESHOLD = 500;
function $8615756fee3bdacc$export$c24ed0104d07eab9(props) {
    let { isDisabled: isDisabled, onLongPressStart: onLongPressStart, onLongPressEnd: onLongPressEnd, onLongPress: onLongPress, threshold: threshold = $8615756fee3bdacc$var$DEFAULT_THRESHOLD, accessibilityDescription: accessibilityDescription } = props;
    const timeRef = (0, $5oHPU$react.useRef)(undefined);
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $04affd2086a7db64$exports.useGlobalListeners)();
    let { pressProps: pressProps } = (0, $1d003dcb6308cd89$exports.usePress)({
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
                    if ((0, $49582955cc364b1c$exports.getOwnerDocument)(e.target).activeElement !== e.target) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(e.target);
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
                    let ownerWindow = (0, $49582955cc364b1c$exports.getOwnerWindow)(e.target);
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
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(onLongPress && !isDisabled ? accessibilityDescription : undefined);
    return {
        longPressProps: (0, $89b39774f3b79dbb$exports.mergeProps)(pressProps, descriptionProps)
    };
}


//# sourceMappingURL=useLongPress.cjs.map
