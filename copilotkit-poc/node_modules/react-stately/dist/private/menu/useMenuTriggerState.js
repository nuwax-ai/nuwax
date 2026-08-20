import {useOverlayTriggerState as $3b152ed05cfdb7e2$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.js";
import {useState as $1qWKe$useState} from "react";

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

function $521dae7892f4f7a6$export$79fefeb1c2091ac3(props) {
    let overlayTriggerState = (0, $3b152ed05cfdb7e2$export$61c6a8c84e605fb6)(props);
    let [focusStrategy, setFocusStrategy] = (0, $1qWKe$useState)(null);
    let [expandedKeysStack, setExpandedKeysStack] = (0, $1qWKe$useState)([]);
    let closeAll = ()=>{
        setExpandedKeysStack([]);
        overlayTriggerState.close();
    };
    let openSubmenu = (triggerKey, level)=>{
        setExpandedKeysStack((oldStack)=>{
            if (level > oldStack.length) return oldStack;
            return [
                ...oldStack.slice(0, level),
                triggerKey
            ];
        });
    };
    let closeSubmenu = (triggerKey, level)=>{
        setExpandedKeysStack((oldStack)=>{
            let key = oldStack[level];
            if (key === triggerKey) return oldStack.slice(0, level);
            else return oldStack;
        });
    };
    return {
        focusStrategy: focusStrategy,
        ...overlayTriggerState,
        open (focusStrategy = null) {
            setFocusStrategy(focusStrategy);
            overlayTriggerState.open();
        },
        toggle (focusStrategy = null) {
            setFocusStrategy(focusStrategy);
            overlayTriggerState.toggle();
        },
        close () {
            closeAll();
        },
        expandedKeysStack: expandedKeysStack,
        openSubmenu: openSubmenu,
        closeSubmenu: closeSubmenu
    };
}


export {$521dae7892f4f7a6$export$79fefeb1c2091ac3 as useMenuTriggerState};
//# sourceMappingURL=useMenuTriggerState.js.map
