import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac, getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {ignoreFocusEvent as $819bf6b2be9219ca$export$fda7da73ab5d4c48} from "./utils.js";
import {isMac as $d5a2be505488529f$export$9ac100e40613ea10} from "../utils/platform.js";
import {isVirtualClick as $fa0ef9dfcca012a7$export$60278871457622de} from "../utils/isVirtualEvent.js";
import {openLink as $044d3c97ce5d6621$export$95185d699e05d4d7} from "../utils/openLink.js";
import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {useState as $hk1N0$useState, useEffect as $hk1N0$useEffect} from "react";

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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions








let $b50b1cc8a843ace7$var$currentModality = null;
let $b50b1cc8a843ace7$var$currentPointerType = 'keyboard';
const $b50b1cc8a843ace7$export$901e90a13c50a14e = new Set();
let $b50b1cc8a843ace7$export$d90243b58daecda7 = new Map(); // We use a map here to support setting event listeners across multiple document objects.
let $b50b1cc8a843ace7$var$hasEventBeforeFocus = false;
let $b50b1cc8a843ace7$var$hasBlurredWindowRecently = false;
// Only Tab or Esc keys will make focus visible on text input elements
const $b50b1cc8a843ace7$var$FOCUS_VISIBLE_INPUT_KEYS = {
    Tab: true,
    Escape: true
};
function $b50b1cc8a843ace7$var$triggerChangeHandlers(modality, e) {
    for (let handler of $b50b1cc8a843ace7$export$901e90a13c50a14e)handler(modality, e);
}
/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus
 * styles visible.
 */ function $b50b1cc8a843ace7$var$isValidKey(e) {
    // Control and Shift keys trigger when navigating back to the tab with keyboard.
    return !(e.metaKey || !(0, $d5a2be505488529f$export$9ac100e40613ea10)() && e.altKey || e.ctrlKey || e.key === 'Control' || e.key === 'Shift' || e.key === 'Meta');
}
function $b50b1cc8a843ace7$var$handleKeyboardEvent(e) {
    $b50b1cc8a843ace7$var$hasEventBeforeFocus = true;
    if (!(0, $044d3c97ce5d6621$export$95185d699e05d4d7).isOpening && $b50b1cc8a843ace7$var$isValidKey(e)) {
        $b50b1cc8a843ace7$var$currentModality = 'keyboard';
        $b50b1cc8a843ace7$var$currentPointerType = 'keyboard';
        $b50b1cc8a843ace7$var$triggerChangeHandlers('keyboard', e);
    }
}
function $b50b1cc8a843ace7$var$handlePointerEvent(e) {
    $b50b1cc8a843ace7$var$currentModality = 'pointer';
    $b50b1cc8a843ace7$var$currentPointerType = 'pointerType' in e ? e.pointerType : 'mouse';
    if (e.type === 'mousedown' || e.type === 'pointerdown') {
        $b50b1cc8a843ace7$var$hasEventBeforeFocus = true;
        $b50b1cc8a843ace7$var$triggerChangeHandlers('pointer', e);
    }
}
function $b50b1cc8a843ace7$var$handleClickEvent(e) {
    if (!(0, $044d3c97ce5d6621$export$95185d699e05d4d7).isOpening && (0, $fa0ef9dfcca012a7$export$60278871457622de)(e)) {
        $b50b1cc8a843ace7$var$hasEventBeforeFocus = true;
        $b50b1cc8a843ace7$var$currentModality = 'virtual';
        $b50b1cc8a843ace7$var$currentPointerType = 'virtual';
    }
}
function $b50b1cc8a843ace7$var$handleFocusEvent(e) {
    // Firefox fires two extra focus events when the user first clicks into an iframe:
    // first on the window, then on the document. We ignore these events so they don't
    // cause keyboard focus rings to appear.
    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
    let ownerDocument = (0, $cc3c3666b64debad$export$b204af158042fbac)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
    if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === ownerWindow || (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === ownerDocument || (0, $819bf6b2be9219ca$export$fda7da73ab5d4c48) || !e.isTrusted) return;
    // If a focus event occurs without a preceding keyboard or pointer event, switch to virtual modality.
    // This occurs, for example, when navigating a form with the next/previous buttons on iOS.
    if (!$b50b1cc8a843ace7$var$hasEventBeforeFocus && !$b50b1cc8a843ace7$var$hasBlurredWindowRecently) {
        $b50b1cc8a843ace7$var$currentModality = 'virtual';
        $b50b1cc8a843ace7$var$currentPointerType = 'virtual';
        $b50b1cc8a843ace7$var$triggerChangeHandlers('virtual', e);
    }
    $b50b1cc8a843ace7$var$hasEventBeforeFocus = false;
    $b50b1cc8a843ace7$var$hasBlurredWindowRecently = false;
}
function $b50b1cc8a843ace7$var$handleWindowBlur() {
    if (0, $819bf6b2be9219ca$export$fda7da73ab5d4c48) return;
    // When the window is blurred, reset state. This is necessary when tabbing out of the window,
    // for example, since a subsequent focus event won't be fired.
    $b50b1cc8a843ace7$var$hasEventBeforeFocus = false;
    $b50b1cc8a843ace7$var$hasBlurredWindowRecently = true;
}
/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */ function $b50b1cc8a843ace7$var$setupGlobalFocusEvents(element) {
    // eslint-disable-next-line no-restricted-globals
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const windowObject = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(element);
    const documentObject = (0, $cc3c3666b64debad$export$b204af158042fbac)(element);
    if ($b50b1cc8a843ace7$export$d90243b58daecda7.get(windowObject)) return;
    // Programmatic focus() calls shouldn't affect the current input modality.
    // However, we need to detect other cases when a focus event occurs without
    // a preceding user event (e.g. screen reader focus). Overriding the focus
    // method on HTMLElement.prototype is a bit hacky, but works.
    let focus = windowObject.HTMLElement.prototype.focus;
    windowObject.HTMLElement.prototype.focus = function() {
        $b50b1cc8a843ace7$var$hasEventBeforeFocus = true;
        focus.apply(this, arguments);
    };
    documentObject.addEventListener('keydown', $b50b1cc8a843ace7$var$handleKeyboardEvent, true);
    documentObject.addEventListener('keyup', $b50b1cc8a843ace7$var$handleKeyboardEvent, true);
    documentObject.addEventListener('click', $b50b1cc8a843ace7$var$handleClickEvent, true);
    // Register focus events on the window so they are sure to happen
    // before React's event listeners (registered on the document).
    windowObject.addEventListener('focus', $b50b1cc8a843ace7$var$handleFocusEvent, true);
    windowObject.addEventListener('blur', $b50b1cc8a843ace7$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.addEventListener('pointerdown', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.addEventListener('pointermove', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.addEventListener('pointerup', $b50b1cc8a843ace7$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.addEventListener('mousedown', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.addEventListener('mousemove', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.addEventListener('mouseup', $b50b1cc8a843ace7$var$handlePointerEvent, true);
    }
    // Add unmount handler
    windowObject.addEventListener('beforeunload', ()=>{
        $b50b1cc8a843ace7$var$tearDownWindowFocusTracking(element);
    }, {
        once: true
    });
    $b50b1cc8a843ace7$export$d90243b58daecda7.set(windowObject, {
        focus: focus
    });
}
const $b50b1cc8a843ace7$var$tearDownWindowFocusTracking = (element, loadListener)=>{
    const windowObject = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(element);
    const documentObject = (0, $cc3c3666b64debad$export$b204af158042fbac)(element);
    if (loadListener) documentObject.removeEventListener('DOMContentLoaded', loadListener);
    if (!$b50b1cc8a843ace7$export$d90243b58daecda7.has(windowObject)) return;
    windowObject.HTMLElement.prototype.focus = $b50b1cc8a843ace7$export$d90243b58daecda7.get(windowObject).focus;
    documentObject.removeEventListener('keydown', $b50b1cc8a843ace7$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('keyup', $b50b1cc8a843ace7$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('click', $b50b1cc8a843ace7$var$handleClickEvent, true);
    windowObject.removeEventListener('focus', $b50b1cc8a843ace7$var$handleFocusEvent, true);
    windowObject.removeEventListener('blur', $b50b1cc8a843ace7$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.removeEventListener('pointerdown', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointermove', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointerup', $b50b1cc8a843ace7$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.removeEventListener('mousedown', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.removeEventListener('mousemove', $b50b1cc8a843ace7$var$handlePointerEvent, true);
        documentObject.removeEventListener('mouseup', $b50b1cc8a843ace7$var$handlePointerEvent, true);
    }
    $b50b1cc8a843ace7$export$d90243b58daecda7.delete(windowObject);
};
function $b50b1cc8a843ace7$export$2f1888112f558a7d(element) {
    const documentObject = (0, $cc3c3666b64debad$export$b204af158042fbac)(element);
    let loadListener;
    if (documentObject.readyState !== 'loading') $b50b1cc8a843ace7$var$setupGlobalFocusEvents(element);
    else {
        loadListener = ()=>{
            $b50b1cc8a843ace7$var$setupGlobalFocusEvents(element);
        };
        documentObject.addEventListener('DOMContentLoaded', loadListener);
    }
    return ()=>$b50b1cc8a843ace7$var$tearDownWindowFocusTracking(element, loadListener);
}
// Server-side rendering does not have the document object defined
// eslint-disable-next-line no-restricted-globals
if (typeof document !== 'undefined') $b50b1cc8a843ace7$export$2f1888112f558a7d();
function $b50b1cc8a843ace7$export$b9b3dfddab17db27() {
    return $b50b1cc8a843ace7$var$currentModality !== 'pointer';
}
function $b50b1cc8a843ace7$export$630ff653c5ada6a9() {
    return $b50b1cc8a843ace7$var$currentModality;
}
function $b50b1cc8a843ace7$export$8397ddfc504fdb9a(modality) {
    $b50b1cc8a843ace7$var$currentModality = modality;
    $b50b1cc8a843ace7$var$currentPointerType = modality === 'pointer' ? 'mouse' : modality;
    $b50b1cc8a843ace7$var$triggerChangeHandlers(modality, null);
}
function $b50b1cc8a843ace7$export$887a228355cf7d95() {
    return $b50b1cc8a843ace7$var$currentPointerType;
}
function $b50b1cc8a843ace7$export$98e20ec92f614cfe() {
    $b50b1cc8a843ace7$var$setupGlobalFocusEvents();
    let [modality, setModality] = (0, $hk1N0$useState)($b50b1cc8a843ace7$var$currentModality);
    (0, $hk1N0$useEffect)(()=>{
        let handler = ()=>{
            setModality($b50b1cc8a843ace7$var$currentModality);
        };
        $b50b1cc8a843ace7$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $b50b1cc8a843ace7$export$901e90a13c50a14e.delete(handler);
        };
    }, []);
    return (0, $85138adc03e1f057$export$535bd6ca7f90a273)() ? null : modality;
}
const $b50b1cc8a843ace7$var$nonTextInputTypes = new Set([
    'checkbox',
    'radio',
    'range',
    'color',
    'file',
    'image',
    'button',
    'submit',
    'reset'
]);
/**
 * If this is attached to text input component, return if the event is a focus event (Tab/Escape
 * keys pressed) so that focus visible style can be properly set.
 */ function $b50b1cc8a843ace7$var$isKeyboardFocusEvent(isTextInput, modality, e) {
    let eventTarget = e ? (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) : undefined;
    let document1 = (0, $cc3c3666b64debad$export$b204af158042fbac)(eventTarget);
    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(eventTarget);
    const IHTMLInputElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLInputElement : HTMLInputElement;
    const IHTMLTextAreaElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLTextAreaElement : HTMLTextAreaElement;
    const IHTMLElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLElement : HTMLElement;
    const IKeyboardEvent = typeof ownerWindow !== 'undefined' ? ownerWindow.KeyboardEvent : KeyboardEvent;
    // For keyboard events that occur on a non-input element that will move focus into input element (aka ArrowLeft going from Datepicker button to the main input group)
    // we need to rely on the user passing isTextInput into here. This way we can skip toggling focus visiblity for said input element
    let activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)(document1);
    isTextInput = isTextInput || activeElement instanceof IHTMLInputElement && !$b50b1cc8a843ace7$var$nonTextInputTypes.has(activeElement.type) || activeElement instanceof IHTMLTextAreaElement || activeElement instanceof IHTMLElement && activeElement.isContentEditable;
    return !(isTextInput && modality === 'keyboard' && e instanceof IKeyboardEvent && !$b50b1cc8a843ace7$var$FOCUS_VISIBLE_INPUT_KEYS[e.key]);
}
function $b50b1cc8a843ace7$export$ffd9e5021c1fb2d6(props = {}) {
    let { isTextInput: isTextInput, autoFocus: autoFocus } = props;
    let [isFocusVisibleState, setFocusVisible] = (0, $hk1N0$useState)(autoFocus || $b50b1cc8a843ace7$export$b9b3dfddab17db27());
    $b50b1cc8a843ace7$export$ec71b4b83ac08ec3((isFocusVisible)=>{
        setFocusVisible(isFocusVisible);
    }, [
        isTextInput
    ], {
        isTextInput: isTextInput
    });
    return {
        isFocusVisible: isFocusVisibleState
    };
}
function $b50b1cc8a843ace7$export$ec71b4b83ac08ec3(fn, deps, opts) {
    $b50b1cc8a843ace7$var$setupGlobalFocusEvents();
    (0, $hk1N0$useEffect)(()=>{
        if ((opts === null || opts === void 0 ? void 0 : opts.enabled) === false) return;
        let handler = (modality, e)=>{
            // We want to early return for any keyboard events that occur inside text inputs EXCEPT for Tab and Escape
            if (!$b50b1cc8a843ace7$var$isKeyboardFocusEvent(!!(opts === null || opts === void 0 ? void 0 : opts.isTextInput), modality, e)) return;
            fn($b50b1cc8a843ace7$export$b9b3dfddab17db27());
        };
        $b50b1cc8a843ace7$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $b50b1cc8a843ace7$export$901e90a13c50a14e.delete(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}


export {$b50b1cc8a843ace7$export$901e90a13c50a14e as changeHandlers, $b50b1cc8a843ace7$export$d90243b58daecda7 as hasSetupGlobalListeners, $b50b1cc8a843ace7$export$2f1888112f558a7d as addWindowFocusTracking, $b50b1cc8a843ace7$export$b9b3dfddab17db27 as isFocusVisible, $b50b1cc8a843ace7$export$630ff653c5ada6a9 as getInteractionModality, $b50b1cc8a843ace7$export$8397ddfc504fdb9a as setInteractionModality, $b50b1cc8a843ace7$export$887a228355cf7d95 as getPointerType, $b50b1cc8a843ace7$export$98e20ec92f614cfe as useInteractionModality, $b50b1cc8a843ace7$export$ffd9e5021c1fb2d6 as useFocusVisible, $b50b1cc8a843ace7$export$ec71b4b83ac08ec3 as useFocusVisibleListener};
//# sourceMappingURL=useFocusVisible.js.map
