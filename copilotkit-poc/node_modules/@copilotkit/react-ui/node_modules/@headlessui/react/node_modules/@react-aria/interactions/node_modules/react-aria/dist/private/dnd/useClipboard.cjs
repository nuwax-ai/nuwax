var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $5e1a09eb20a4a484$exports = require("../interactions/useFocus.cjs");
var $1uczx$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useClipboard", function () { return $224e454d4f38aede$export$2314ca2a3e892862; });
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




const $224e454d4f38aede$var$globalEvents = new Map();
function $224e454d4f38aede$var$addGlobalEventListener(event, fn) {
    let eventData = $224e454d4f38aede$var$globalEvents.get(event);
    if (!eventData) {
        let handlers = new Set();
        let listener = (e)=>{
            for (let handler of handlers)handler(e);
        };
        eventData = {
            listener: listener,
            handlers: handlers
        };
        $224e454d4f38aede$var$globalEvents.set(event, eventData);
        document.addEventListener(event, listener);
    }
    eventData.handlers.add(fn);
    return ()=>{
        eventData.handlers.delete(fn);
        if (eventData.handlers.size === 0) {
            document.removeEventListener(event, eventData.listener);
            $224e454d4f38aede$var$globalEvents.delete(event);
        }
    };
}
function $224e454d4f38aede$export$2314ca2a3e892862(options) {
    let { isDisabled: isDisabled } = options;
    let isFocusedRef = (0, $1uczx$react.useRef)(false);
    let { focusProps: focusProps } = (0, $5e1a09eb20a4a484$exports.useFocus)({
        onFocusChange: (isFocused)=>{
            isFocusedRef.current = isFocused;
        }
    });
    let onBeforeCopy = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        // Enable the "Copy" menu item in Safari if this element is focused and copying is supported.
        if (isFocusedRef.current && options.getItems) e.preventDefault();
    });
    let onCopy = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (!isFocusedRef.current || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            (0, $c67ff3d36836a1c1$exports.writeToDataTransfer)(e.clipboardData, options.getItems({
                action: 'copy'
            }));
            options.onCopy?.();
        }
    });
    let onBeforeCut = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (isFocusedRef.current && options.onCut && options.getItems) e.preventDefault();
    });
    let onCut = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (!isFocusedRef.current || !options.onCut || !options.getItems) return;
        e.preventDefault();
        if (e.clipboardData) {
            (0, $c67ff3d36836a1c1$exports.writeToDataTransfer)(e.clipboardData, options.getItems({
                action: 'cut'
            }));
            options.onCut();
        }
    });
    let onBeforePaste = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        // Unfortunately, e.clipboardData.types is not available in this event so we always
        // have to enable the Paste menu item even if the type of data is unsupported.
        if (isFocusedRef.current && options.onPaste) e.preventDefault();
    });
    let onPaste = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (!isFocusedRef.current || !options.onPaste) return;
        e.preventDefault();
        if (e.clipboardData) {
            let items = (0, $c67ff3d36836a1c1$exports.readFromDataTransfer)(e.clipboardData);
            options.onPaste(items);
        }
    });
    (0, $1uczx$react.useEffect)(()=>{
        if (isDisabled) return;
        return (0, $2f95486cfdaa743c$exports.chain)($224e454d4f38aede$var$addGlobalEventListener('beforecopy', onBeforeCopy), $224e454d4f38aede$var$addGlobalEventListener('copy', onCopy), $224e454d4f38aede$var$addGlobalEventListener('beforecut', onBeforeCut), $224e454d4f38aede$var$addGlobalEventListener('cut', onCut), $224e454d4f38aede$var$addGlobalEventListener('beforepaste', onBeforePaste), $224e454d4f38aede$var$addGlobalEventListener('paste', onPaste));
    }, [
        isDisabled
    ]);
    return {
        clipboardProps: focusProps
    };
}


//# sourceMappingURL=useClipboard.cjs.map
