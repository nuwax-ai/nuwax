import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {isFocusable as $3b8b240c1bf84ab9$export$4c063cf1350e6fed} from "../utils/isFocusable.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useRef as $lIB5W$useRef, useCallback as $lIB5W$useCallback} from "react";

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





function $a92dc41f639950be$export$525bc4921d56d4a(nativeEvent) {
    let event = nativeEvent;
    event.nativeEvent = nativeEvent;
    event.isDefaultPrevented = ()=>event.defaultPrevented;
    // cancelBubble is technically deprecated in the spec, but still supported in all browsers.
    event.isPropagationStopped = ()=>event.cancelBubble;
    event.persist = ()=>{};
    return event;
}
function $a92dc41f639950be$export$c2b7abe5d61ec696(event, target) {
    Object.defineProperty(event, 'target', {
        value: target
    });
    Object.defineProperty(event, 'currentTarget', {
        value: target
    });
}
function $a92dc41f639950be$export$715c682d09d639cc(onBlur) {
    let stateRef = (0, $lIB5W$useRef)({
        isFocused: false,
        observer: null
    });
    // Clean up MutationObserver on unmount. See below.
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        const state = stateRef.current;
        return ()=>{
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
        };
    }, []);
    // This function is called during a React onFocus event.
    return (0, $lIB5W$useCallback)((e)=>{
        // React does not fire onBlur when an element is disabled. https://github.com/facebook/react/issues/9142
        // Most browsers fire a native focusout event in this case, except for Firefox. In that case, we use a
        // MutationObserver to watch for the disabled attribute, and dispatch these events ourselves.
        // For browsers that do, focusout fires before the MutationObserver, so onBlur should not fire twice.
        let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        if (eventTarget instanceof HTMLButtonElement || eventTarget instanceof HTMLInputElement || eventTarget instanceof HTMLTextAreaElement || eventTarget instanceof HTMLSelectElement) {
            stateRef.current.isFocused = true;
            let target = eventTarget;
            let onBlurHandler = (e)=>{
                stateRef.current.isFocused = false;
                if (target.disabled) {
                    // For backward compatibility, dispatch a (fake) React synthetic event.
                    let event = $a92dc41f639950be$export$525bc4921d56d4a(e);
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
                    let relatedTargetEl = target === (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() ? null : (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
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
let $a92dc41f639950be$export$fda7da73ab5d4c48 = false;
function $a92dc41f639950be$export$cabe61c495ee3649(target) {
    // The browser will focus the nearest focusable ancestor of our target.
    while(target && !(0, $3b8b240c1bf84ab9$export$4c063cf1350e6fed)(target, {
        skipVisibilityCheck: true
    }))target = target.parentElement;
    let window = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(target);
    let activeElement = window.document.activeElement;
    if (!activeElement || activeElement === target) return;
    $a92dc41f639950be$export$fda7da73ab5d4c48 = true;
    let isRefocusing = false;
    let onBlur = (e)=>{
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === activeElement || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusOut = (e)=>{
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === activeElement || isRefocusing) {
            e.stopImmediatePropagation();
            // If there was no focusable ancestor, we don't expect a focus event.
            // Re-focus the original active element here.
            if (!target && !isRefocusing) {
                isRefocusing = true;
                (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(activeElement);
                cleanup();
            }
        }
    };
    let onFocus = (e)=>{
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === target || isRefocusing) e.stopImmediatePropagation();
    };
    let onFocusIn = (e)=>{
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === target || isRefocusing) {
            e.stopImmediatePropagation();
            if (!isRefocusing) {
                isRefocusing = true;
                (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(activeElement);
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
        $a92dc41f639950be$export$fda7da73ab5d4c48 = false;
        isRefocusing = false;
    };
    let raf = requestAnimationFrame(cleanup);
    return cleanup;
}


export {$a92dc41f639950be$export$525bc4921d56d4a as createSyntheticEvent, $a92dc41f639950be$export$c2b7abe5d61ec696 as setEventTarget, $a92dc41f639950be$export$715c682d09d639cc as useSyntheticBlurEvent, $a92dc41f639950be$export$fda7da73ab5d4c48 as ignoreFocusEvent, $a92dc41f639950be$export$cabe61c495ee3649 as preventFocus};
//# sourceMappingURL=utils.mjs.map
