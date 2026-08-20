import {useState as $b7qeM$useState, useMemo as $b7qeM$useMemo, useCallback as $b7qeM$useCallback} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $5b3242e27644e8f1$export$cfc51cf86138bf98(props, state) {
    let { triggerKey: triggerKey } = props;
    let { expandedKeysStack: expandedKeysStack, openSubmenu: openSubmenu, closeSubmenu: closeSubmenu, close: closeAll } = state;
    let [submenuLevel] = (0, $b7qeM$useState)(expandedKeysStack?.length);
    let isOpen = (0, $b7qeM$useMemo)(()=>expandedKeysStack[submenuLevel] === triggerKey, [
        expandedKeysStack,
        triggerKey,
        submenuLevel
    ]);
    let [focusStrategy, setFocusStrategy] = (0, $b7qeM$useState)(null);
    let open = (0, $b7qeM$useCallback)((focusStrategy)=>{
        setFocusStrategy(focusStrategy ?? null);
        openSubmenu(triggerKey, submenuLevel);
    }, [
        openSubmenu,
        submenuLevel,
        triggerKey
    ]);
    let close = (0, $b7qeM$useCallback)(()=>{
        setFocusStrategy(null);
        closeSubmenu(triggerKey, submenuLevel);
    }, [
        closeSubmenu,
        submenuLevel,
        triggerKey
    ]);
    let toggle = (0, $b7qeM$useCallback)((focusStrategy)=>{
        setFocusStrategy(focusStrategy ?? null);
        if (isOpen) close();
        else open(focusStrategy);
    }, [
        close,
        open,
        isOpen
    ]);
    return (0, $b7qeM$useMemo)(()=>({
            focusStrategy: focusStrategy,
            isOpen: isOpen,
            open: open,
            close: close,
            closeAll: closeAll,
            submenuLevel: submenuLevel,
            // TODO: Placeholders that aren't used but give us parity with OverlayTriggerState so we can use this in Popover. Refactor if we update Popover via
            // https://github.com/adobe/react-spectrum/pull/4976#discussion_r1336472863
            setOpen: ()=>{},
            toggle: toggle
        }), [
        isOpen,
        open,
        close,
        closeAll,
        focusStrategy,
        toggle,
        submenuLevel
    ]);
}


export {$5b3242e27644e8f1$export$cfc51cf86138bf98 as useSubmenuTriggerState};
//# sourceMappingURL=useSubmenuTriggerState.mjs.map
