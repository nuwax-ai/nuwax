import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {isFocusable as $ee5e22534121197a$export$4c063cf1350e6fed} from "../utils/isFocusable.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useRef as $kjNNn$useRef, useCallback as $kjNNn$useCallback} from "react";

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





function $819bf6b2be9219ca$export$525bc4921d56d4a(nativeEvent) {
    let event = nativeEvent;
    event.nativeEvent = nativeEvent;
    event.isDefaultPrevented = ()=>event.defaultPrevented;
    // cancelBubble is technically deprecated in the spec, but still supported in all browsers.
    event.isPropagationStopped = ()=>event.cancelBubble;
    event.persist = ()=>{};
    return event;
}
function $819bf6b2be9219ca$export$c2b7abe5d61ec696(event, target) {
    Object.defineProperty(event, 'target', {
        value: target
    });
    Object.defineProperty(event, 'currentTarget', {
        value: target
    });
}
function $819bf6b2be9219ca$export$715c682d09d639cc(onBlur) {
    let stateRef = (0, $kjNNn$useRef)({
        isFocused: false,
        observer: null
    });
    // Clean up MutationObserver on unmount. See below.
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        const state = stateRef.current;
        return ()=>{
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
        };
    }, []);
    // This function is called during a React onFocus event.
    return (0, $kjNNn$useCallback)((e)=>{
        // React does not fire onBlur when an element is disabled. https://github.com/facebook/react/issues/9142
        // Most browsers fire a native focusout event in this case, except for Firefox. In that case, we use a
        // MutationObserver to watch for the disabled attribute, and dispatch these events ourselves.
        // For browsers that do, focusout fires before the MutationObserver, so onBlur should not fire twice.
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (eventTarget instanceof HTMLButtonElement || eventTarget instanceof HTMLInputElement || eventTarget instanceof HTMLTextAreaElement || eventTarget instanceof HTMLSelectElement) {
            stateRef.current.isFocused = true;
            let target = eventTarget;
            let onBlurHandler = (e)=>{
                stateRef.current.isFocused = false;
                if (target.disabled) {
                    // For backward compatibility, dispatch a (fake) React synthetic event.
                    let event = $819bf6b2be9219ca$export$525bc4921d56d4a(e);
                    onBlur === null || onBlur === void 0 ? void 0 : onBlur(event);
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
                    var _stateRef_current_observer;
                    (_stateRef_current_observer = stateRef.current.observer) === null || _stateRef_current_observer === void 0 ? void 0 : _stateRef_current_observer.disconnect();
                    let relatedTargetEl = target === (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() ? null : (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)();
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
let $819bf6b2be9219ca$export$fda7da73ab5d4c48 = false;
function $819bf6b2be9219ca$export$cabe61c495ee3649(target) {
    // The browser will focus the nearest focusable ancestor of our target.
    while(target && !(0, $ee5e22534121197a$export$4c063cf1350e6fed)(target, {
        skipVisibilityCheck: true
    }))target = target.parentElement;
    let window = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(target);
    let activeElement = window.document.activeElement;
    if (!activeElement || activeElement === target) return;
    $819bf6b2be9219ca$export$fda7da73ab5d4c48 = true;
    let isRefocusing = false;
    let onBlur = (e)=>{
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === activeElement || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusOut = (e)=>{
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === activeElement || isRefocusing) {
            e.stopImmediatePropagation();
            // If there was no focusable ancestor, we don't expect a focus event.
            // Re-focus the original active element here.
            if (!target && !isRefocusing) {
                isRefocusing = true;
                (0, $d559d872031c749f$export$de79e2c695e052f3)(activeElement);
                cleanup();
            }
        }
    };
    let onFocus = (e)=>{
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === target || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusIn = (e)=>{
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === target || isRefocusing) {
            e.stopImmediatePropagation();
            if (!isRefocusing) {
                isRefocusing = true;
                (0, $d559d872031c749f$export$de79e2c695e052f3)(activeElement);
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
        $819bf6b2be9219ca$export$fda7da73ab5d4c48 = false;
        isRefocusing = false;
    };
    let raf = requestAnimationFrame(cleanup);
    return cleanup;
}


export {$819bf6b2be9219ca$export$525bc4921d56d4a as createSyntheticEvent, $819bf6b2be9219ca$export$c2b7abe5d61ec696 as setEventTarget, $819bf6b2be9219ca$export$715c682d09d639cc as useSyntheticBlurEvent, $819bf6b2be9219ca$export$fda7da73ab5d4c48 as ignoreFocusEvent, $819bf6b2be9219ca$export$cabe61c495ee3649 as preventFocus};
//# sourceMappingURL=utils.js.map
