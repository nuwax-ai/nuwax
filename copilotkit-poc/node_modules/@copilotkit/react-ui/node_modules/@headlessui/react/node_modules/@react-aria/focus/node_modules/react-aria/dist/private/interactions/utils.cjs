var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $48f566b6becd50da$exports = require("../utils/isFocusable.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $i1qeW$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "createSyntheticEvent", function () { return $a9918c67a493892d$export$525bc4921d56d4a; });
$parcel$export(module.exports, "setEventTarget", function () { return $a9918c67a493892d$export$c2b7abe5d61ec696; });
$parcel$export(module.exports, "useSyntheticBlurEvent", function () { return $a9918c67a493892d$export$715c682d09d639cc; });
$parcel$export(module.exports, "ignoreFocusEvent", function () { return $a9918c67a493892d$export$fda7da73ab5d4c48; });
$parcel$export(module.exports, "preventFocus", function () { return $a9918c67a493892d$export$cabe61c495ee3649; });
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





function $a9918c67a493892d$export$525bc4921d56d4a(nativeEvent) {
    let event = nativeEvent;
    event.nativeEvent = nativeEvent;
    event.isDefaultPrevented = ()=>event.defaultPrevented;
    // cancelBubble is technically deprecated in the spec, but still supported in all browsers.
    event.isPropagationStopped = ()=>event.cancelBubble;
    event.persist = ()=>{};
    return event;
}
function $a9918c67a493892d$export$c2b7abe5d61ec696(event, target) {
    Object.defineProperty(event, 'target', {
        value: target
    });
    Object.defineProperty(event, 'currentTarget', {
        value: target
    });
}
function $a9918c67a493892d$export$715c682d09d639cc(onBlur) {
    let stateRef = (0, $i1qeW$react.useRef)({
        isFocused: false,
        observer: null
    });
    // Clean up MutationObserver on unmount. See below.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        const state = stateRef.current;
        return ()=>{
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
        };
    }, []);
    // This function is called during a React onFocus event.
    return (0, $i1qeW$react.useCallback)((e)=>{
        // React does not fire onBlur when an element is disabled. https://github.com/facebook/react/issues/9142
        // Most browsers fire a native focusout event in this case, except for Firefox. In that case, we use a
        // MutationObserver to watch for the disabled attribute, and dispatch these events ourselves.
        // For browsers that do, focusout fires before the MutationObserver, so onBlur should not fire twice.
        let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        if (eventTarget instanceof HTMLButtonElement || eventTarget instanceof HTMLInputElement || eventTarget instanceof HTMLTextAreaElement || eventTarget instanceof HTMLSelectElement) {
            stateRef.current.isFocused = true;
            let target = eventTarget;
            let onBlurHandler = (e)=>{
                stateRef.current.isFocused = false;
                if (target.disabled) {
                    // For backward compatibility, dispatch a (fake) React synthetic event.
                    let event = $a9918c67a493892d$export$525bc4921d56d4a(e);
                    onBlur?.(event);
                }
                // We no longer need the MutationObserver once the target is blurred.
                if (stateRef.current.observer) {
                    stateRef.current.observer.disconnect();
                    stateRef.current.observer = null;
                }
            };
            target.addEventListener('focusout', onBlurHandler, {
                once: true
            });
            stateRef.current.observer = new MutationObserver(()=>{
                if (stateRef.current.isFocused && target.disabled) {
                    stateRef.current.observer?.disconnect();
                    let relatedTargetEl = target === (0, $da02ee888921bc9e$exports.getActiveElement)() ? null : (0, $da02ee888921bc9e$exports.getActiveElement)();
                    target.dispatchEvent(new FocusEvent('blur', {
                        relatedTarget: relatedTargetEl
                    }));
                    target.dispatchEvent(new FocusEvent('focusout', {
                        bubbles: true,
                        relatedTarget: relatedTargetEl
                    }));
                }
            });
            stateRef.current.observer.observe(target, {
                attributes: true,
                attributeFilter: [
                    'disabled'
                ]
            });
        }
    }, [
        onBlur
    ]);
}
let $a9918c67a493892d$export$fda7da73ab5d4c48 = false;
function $a9918c67a493892d$export$cabe61c495ee3649(target) {
    // The browser will focus the nearest focusable ancestor of our target.
    while(target && !(0, $48f566b6becd50da$exports.isFocusable)(target, {
        skipVisibilityCheck: true
    }))target = target.parentElement;
    let window = (0, $49582955cc364b1c$exports.getOwnerWindow)(target);
    let activeElement = window.document.activeElement;
    if (!activeElement || activeElement === target) return;
    $a9918c67a493892d$export$fda7da73ab5d4c48 = true;
    let isRefocusing = false;
    let onBlur = (e)=>{
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === activeElement || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusOut = (e)=>{
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === activeElement || isRefocusing) {
            e.stopImmediatePropagation();
            // If there was no focusable ancestor, we don't expect a focus event.
            // Re-focus the original active element here.
            if (!target && !isRefocusing) {
                isRefocusing = true;
                (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(activeElement);
                cleanup();
            }
        }
    };
    let onFocus = (e)=>{
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === target || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusIn = (e)=>{
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === target || isRefocusing) {
            e.stopImmediatePropagation();
            if (!isRefocusing) {
                isRefocusing = true;
                (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(activeElement);
                cleanup();
            }
        }
    };
    window.addEventListener('blur', onBlur, true);
    window.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('focus', onFocus, true);
    let cleanup = ()=>{
        cancelAnimationFrame(raf);
        window.removeEventListener('blur', onBlur, true);
        window.removeEventListener('focusout', onFocusOut, true);
        window.removeEventListener('focusin', onFocusIn, true);
        window.removeEventListener('focus', onFocus, true);
        $a9918c67a493892d$export$fda7da73ab5d4c48 = false;
        isRefocusing = false;
    };
    let raf = requestAnimationFrame(cleanup);
    return cleanup;
}


//# sourceMappingURL=utils.cjs.map
