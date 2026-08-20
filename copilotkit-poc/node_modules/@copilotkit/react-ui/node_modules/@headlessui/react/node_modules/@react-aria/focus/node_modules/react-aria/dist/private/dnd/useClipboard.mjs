import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {readFromDataTransfer as $d40e85a29b831dd6$export$d9e760437831f8b3, writeToDataTransfer as $d40e85a29b831dd6$export$f9c1490890ddd063} from "./utils.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useFocus as $1e74c67db218ce67$export$f8168d8dd8fd66e6} from "../interactions/useFocus.mjs";
import {useRef as $d3JvD$useRef, useEffect as $d3JvD$useEffect} from "react";

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




const $692863997030a376$var$globalEvents = new Map();
function $692863997030a376$var$addGlobalEventListener(event, fn) {
    let eventData = $692863997030a376$var$globalEvents.get(event);
    if (!eventData) {
        let handlers = new Set();
        let listener = (e)=>{
            for (let handler of handlers)handler(e);
        };
        eventData = {
            listener: listener,
            handlers: handlers
        };
        $692863997030a376$var$globalEvents.set(event, eventData);
        document.addEventListener(event, listener);
    }
    eventData.handlers.add(fn);
    return ()=>{
        eventData.handlers.delete(fn);
        if (eventData.handlers.size === 0) {
            document.removeEventListener(event, eventData.listener);
            $692863997030a376$var$globalEvents.delete(event);
        }
    };
}
function $692863997030a376$export$2314ca2a3e892862(options) {
    let { isDisabled: isDisabled } = options;
    let isFocusedRef = (0, $d3JvD$useRef)(false);
    let { focusProps: focusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)({
        onFocusChange: (isFocused)=>{
            isFocusedRef.current = isFocused;
        }
    });
    let onBeforeCopy = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        // Enable the "Copy" menu item in Safari if this element is focused and copying is supported.
        if (isFocusedRef.current && options.getItems) e.preventDefault();
    });
    let onCopy = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            (0, $d40e85a29b831dd6$export$f9c1490890ddd063)(e.clipboardData, options.getItems({
                action: 'copy'
            }));
            options.onCopy?.();
        }
    });
    let onBeforeCut = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (isFocusedRef.current && options.onCut && options.getItems) e.preventDefault();
    });
    let onCut = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.onCut || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            (0, $d40e85a29b831dd6$export$f9c1490890ddd063)(e.clipboardData, options.getItems({
                action: 'cut'
            }));
            options.onCut();
        }
    });
    let onBeforePaste = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        // Unfortunately, e.clipboardData.types is not available in this event so we always
        // have to enable the Paste menu item even if the type of data is unsupported.
        if (isFocusedRef.current && options.onPaste) e.preventDefault();
    });
    let onPaste = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.onPaste) return;
        e.preventDefault();
        if (e.clipboardData) {
            let items = (0, $d40e85a29b831dd6$export$d9e760437831f8b3)(e.clipboardData);
            options.onPaste(items);
        }
    });
    (0, $d3JvD$useEffect)(()=>{
        if (isDisabled) return;
        return (0, $a4e76a5424781910$export$e08e3b67e392101e)($692863997030a376$var$addGlobalEventListener('beforecopy', onBeforeCopy), $692863997030a376$var$addGlobalEventListener('copy', onCopy), $692863997030a376$var$addGlobalEventListener('beforecut', onBeforeCut), $692863997030a376$var$addGlobalEventListener('cut', onCut), $692863997030a376$var$addGlobalEventListener('beforepaste', onBeforePaste), $692863997030a376$var$addGlobalEventListener('paste', onPaste));
    }, [
        isDisabled
    ]);
    return {
        clipboardProps: focusProps
    };
}


export {$692863997030a376$export$2314ca2a3e892862 as useClipboard};
//# sourceMappingURL=useClipboard.mjs.map
