import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {readFromDataTransfer as $a279fa400589a731$export$d9e760437831f8b3, writeToDataTransfer as $a279fa400589a731$export$f9c1490890ddd063} from "./utils.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useFocus as $a19d0c473b0e0cad$export$f8168d8dd8fd66e6} from "../interactions/useFocus.js";
import {useRef as $8kBjt$useRef, useEffect as $8kBjt$useEffect} from "react";

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




const $7344348c506eba19$var$globalEvents = new Map();
function $7344348c506eba19$var$addGlobalEventListener(event, fn) {
    let eventData = $7344348c506eba19$var$globalEvents.get(event);
    if (!eventData) {
        let handlers = new Set();
        let listener = (e)=>{
            for (let handler of handlers)handler(e);
        };
        eventData = {
            listener: listener,
            handlers: handlers
        };
        $7344348c506eba19$var$globalEvents.set(event, eventData);
        document.addEventListener(event, listener);
    }
    eventData.handlers.add(fn);
    return ()=>{
        eventData.handlers.delete(fn);
        if (eventData.handlers.size === 0) {
            document.removeEventListener(event, eventData.listener);
            $7344348c506eba19$var$globalEvents.delete(event);
        }
    };
}
function $7344348c506eba19$export$2314ca2a3e892862(options) {
    let { isDisabled: isDisabled } = options;
    let isFocusedRef = (0, $8kBjt$useRef)(false);
    let { focusProps: focusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)({
        onFocusChange: (isFocused)=>{
            isFocusedRef.current = isFocused;
        }
    });
    let onBeforeCopy = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        // Enable the "Copy" menu item in Safari if this element is focused and copying is supported.
        if (isFocusedRef.current && options.getItems) e.preventDefault();
    });
    let onCopy = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            var _options_onCopy;
            (0, $a279fa400589a731$export$f9c1490890ddd063)(e.clipboardData, options.getItems({
                action: 'copy'
            }));
            (_options_onCopy = options.onCopy) === null || _options_onCopy === void 0 ? void 0 : _options_onCopy.call(options);
        }
    });
    let onBeforeCut = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (isFocusedRef.current && options.onCut && options.getItems) e.preventDefault();
    });
    let onCut = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.onCut || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            (0, $a279fa400589a731$export$f9c1490890ddd063)(e.clipboardData, options.getItems({
                action: 'cut'
            }));
            options.onCut();
        }
    });
    let onBeforePaste = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        // Unfortunately, e.clipboardData.types is not available in this event so we always
        // have to enable the Paste menu item even if the type of data is unsupported.
        if (isFocusedRef.current && options.onPaste) e.preventDefault();
    });
    let onPaste = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (!isFocusedRef.current || !options.onPaste) return;
        e.preventDefault();
        if (e.clipboardData) {
            let items = (0, $a279fa400589a731$export$d9e760437831f8b3)(e.clipboardData);
            options.onPaste(items);
        }
    });
    (0, $8kBjt$useEffect)(()=>{
        if (isDisabled) return;
        return (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)($7344348c506eba19$var$addGlobalEventListener('beforecopy', onBeforeCopy), $7344348c506eba19$var$addGlobalEventListener('copy', onCopy), $7344348c506eba19$var$addGlobalEventListener('beforecut', onBeforeCut), $7344348c506eba19$var$addGlobalEventListener('cut', onCut), $7344348c506eba19$var$addGlobalEventListener('beforepaste', onBeforePaste), $7344348c506eba19$var$addGlobalEventListener('paste', onPaste));
    }, [
        isDisabled
    ]);
    return {
        clipboardProps: focusProps
    };
}


export {$7344348c506eba19$export$2314ca2a3e892862 as useClipboard};
//# sourceMappingURL=useClipboard.js.map
