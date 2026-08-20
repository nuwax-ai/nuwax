import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {ignoreFocusEvent as $a92dc41f639950be$export$fda7da73ab5d4c48} from "./utils.mjs";
import {isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "../utils/platform.mjs";
import {isVirtualClick as $b5c62b033c25b96d$export$60278871457622de} from "../utils/isVirtualEvent.mjs";
import {openLink as $caaf0dd3060ed57c$export$95185d699e05d4d7} from "../utils/openLink.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {useState as $7U4qw$useState, useEffect as $7U4qw$useEffect} from "react";

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








let $8f5a2122b0992be3$var$currentModality = null;
let $8f5a2122b0992be3$var$currentPointerType = 'keyboard';
const $8f5a2122b0992be3$export$901e90a13c50a14e = new Set();
let $8f5a2122b0992be3$export$d90243b58daecda7 = new Map(); // We use a map here to support setting event listeners across multiple document objects.
let $8f5a2122b0992be3$var$hasEventBeforeFocus = false;
let $8f5a2122b0992be3$var$hasBlurredWindowRecently = false;
// Only Tab or Esc keys will make focus visible on text input elements
const $8f5a2122b0992be3$var$FOCUS_VISIBLE_INPUT_KEYS = {
    Tab: true,
    Escape: true
};
function $8f5a2122b0992be3$var$triggerChangeHandlers(modality, e) {
    for (let handler of $8f5a2122b0992be3$export$901e90a13c50a14e)handler(modality, e);
}
/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus
 * styles visible.
 */ function $8f5a2122b0992be3$var$isValidKey(e) {
    // Control and Shift keys trigger when navigating back to the tab with keyboard.
    return !(e.metaKey || !(0, $2add3ce32c6007eb$export$9ac100e40613ea10)() && e.altKey || e.ctrlKey || e.key === 'Control' || e.key === 'Shift' || e.key === 'Meta');
}
function $8f5a2122b0992be3$var$handleKeyboardEvent(e) {
    $8f5a2122b0992be3$var$hasEventBeforeFocus = true;
    if (!(0, $caaf0dd3060ed57c$export$95185d699e05d4d7).isOpening && $8f5a2122b0992be3$var$isValidKey(e)) {
        $8f5a2122b0992be3$var$currentModality = 'keyboard';
        $8f5a2122b0992be3$var$currentPointerType = 'keyboard';
        $8f5a2122b0992be3$var$triggerChangeHandlers('keyboard', e);
    }
}
function $8f5a2122b0992be3$var$handlePointerEvent(e) {
    $8f5a2122b0992be3$var$currentModality = 'pointer';
    $8f5a2122b0992be3$var$currentPointerType = 'pointerType' in e ? e.pointerType : 'mouse';
    if (e.type === 'mousedown' || e.type === 'pointerdown') {
        $8f5a2122b0992be3$var$hasEventBeforeFocus = true;
        $8f5a2122b0992be3$var$triggerChangeHandlers('pointer', e);
    }
}
function $8f5a2122b0992be3$var$handleClickEvent(e) {
    if (!(0, $caaf0dd3060ed57c$export$95185d699e05d4d7).isOpening && (0, $b5c62b033c25b96d$export$60278871457622de)(e)) {
        $8f5a2122b0992be3$var$hasEventBeforeFocus = true;
        $8f5a2122b0992be3$var$currentModality = 'virtual';
        $8f5a2122b0992be3$var$currentPointerType = 'virtual';
    }
}
function $8f5a2122b0992be3$var$handleFocusEvent(e) {
    // Firefox fires two extra focus events when the user first clicks into an iframe:
    // first on the window, then on the document. We ignore these events so they don't
    // cause keyboard focus rings to appear.
    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
    let ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
    if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === ownerWindow || (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === ownerDocument || (0, $a92dc41f639950be$export$fda7da73ab5d4c48) || !e.isTrusted) return;
    // If a focus event occurs without a preceding keyboard or pointer event, switch to virtual modality.
    // This occurs, for example, when navigating a form with the next/previous buttons on iOS.
    if (!$8f5a2122b0992be3$var$hasEventBeforeFocus && !$8f5a2122b0992be3$var$hasBlurredWindowRecently) {
        $8f5a2122b0992be3$var$currentModality = 'virtual';
        $8f5a2122b0992be3$var$currentPointerType = 'virtual';
        $8f5a2122b0992be3$var$triggerChangeHandlers('virtual', e);
    }
    $8f5a2122b0992be3$var$hasEventBeforeFocus = false;
    $8f5a2122b0992be3$var$hasBlurredWindowRecently = false;
}
function $8f5a2122b0992be3$var$handleWindowBlur() {
    if (0, $a92dc41f639950be$export$fda7da73ab5d4c48) return;
    // When the window is blurred, reset state. This is necessary when tabbing out of the window,
    // for example, since a subsequent focus event won't be fired.
    $8f5a2122b0992be3$var$hasEventBeforeFocus = false;
    $8f5a2122b0992be3$var$hasBlurredWindowRecently = true;
}
/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */ function $8f5a2122b0992be3$var$setupGlobalFocusEvents(element) {
    // eslint-disable-next-line no-restricted-globals
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const windowObject = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element);
    const documentObject = (0, $d447af545b77c9f1$export$b204af158042fbac)(element);
    if ($8f5a2122b0992be3$export$d90243b58daecda7.get(windowObject)) return;
    // Programmatic focus() calls shouldn't affect the current input modality.
    // However, we need to detect other cases when a focus event occurs without
    // a preceding user event (e.g. screen reader focus). Overriding the focus
    // method on HTMLElement.prototype is a bit hacky, but works.
    let focus = windowObject.HTMLElement.prototype.focus;
    windowObject.HTMLElement.prototype.focus = function() {
        $8f5a2122b0992be3$var$hasEventBeforeFocus = true;
        focus.apply(this, arguments);
    };
    documentObject.addEventListener('keydown', $8f5a2122b0992be3$var$handleKeyboardEvent, true);
    documentObject.addEventListener('keyup', $8f5a2122b0992be3$var$handleKeyboardEvent, true);
    documentObject.addEventListener('click', $8f5a2122b0992be3$var$handleClickEvent, true);
    // Register focus events on the window so they are sure to happen
    // before React's event listeners (registered on the document).
    windowObject.addEventListener('focus', $8f5a2122b0992be3$var$handleFocusEvent, true);
    windowObject.addEventListener('blur', $8f5a2122b0992be3$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.addEventListener('pointerdown', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.addEventListener('pointermove', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.addEventListener('pointerup', $8f5a2122b0992be3$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.addEventListener('mousedown', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.addEventListener('mousemove', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.addEventListener('mouseup', $8f5a2122b0992be3$var$handlePointerEvent, true);
    }
    // Add unmount handler
    windowObject.addEventListener('beforeunload', ()=>{
        $8f5a2122b0992be3$var$tearDownWindowFocusTracking(element);
    }, {
        once: true
    });
    $8f5a2122b0992be3$export$d90243b58daecda7.set(windowObject, {
        focus: focus
    });
}
const $8f5a2122b0992be3$var$tearDownWindowFocusTracking = (element, loadListener)=>{
    const windowObject = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element);
    const documentObject = (0, $d447af545b77c9f1$export$b204af158042fbac)(element);
    if (loadListener) documentObject.removeEventListener('DOMContentLoaded', loadListener);
    if (!$8f5a2122b0992be3$export$d90243b58daecda7.has(windowObject)) return;
    windowObject.HTMLElement.prototype.focus = $8f5a2122b0992be3$export$d90243b58daecda7.get(windowObject).focus;
    documentObject.removeEventListener('keydown', $8f5a2122b0992be3$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('keyup', $8f5a2122b0992be3$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('click', $8f5a2122b0992be3$var$handleClickEvent, true);
    windowObject.removeEventListener('focus', $8f5a2122b0992be3$var$handleFocusEvent, true);
    windowObject.removeEventListener('blur', $8f5a2122b0992be3$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.removeEventListener('pointerdown', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointermove', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointerup', $8f5a2122b0992be3$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.removeEventListener('mousedown', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.removeEventListener('mousemove', $8f5a2122b0992be3$var$handlePointerEvent, true);
        documentObject.removeEventListener('mouseup', $8f5a2122b0992be3$var$handlePointerEvent, true);
    }
    $8f5a2122b0992be3$export$d90243b58daecda7.delete(windowObject);
};
function $8f5a2122b0992be3$export$2f1888112f558a7d(element) {
    const documentObject = (0, $d447af545b77c9f1$export$b204af158042fbac)(element);
    let loadListener;
    if (documentObject.readyState !== 'loading') $8f5a2122b0992be3$var$setupGlobalFocusEvents(element);
    else {
        loadListener = ()=>{
            $8f5a2122b0992be3$var$setupGlobalFocusEvents(element);
        };
        documentObject.addEventListener('DOMContentLoaded', loadListener);
    }
    return ()=>$8f5a2122b0992be3$var$tearDownWindowFocusTracking(element, loadListener);
}
// Server-side rendering does not have the document object defined
// eslint-disable-next-line no-restricted-globals
if (typeof document !== 'undefined') $8f5a2122b0992be3$export$2f1888112f558a7d();
function $8f5a2122b0992be3$export$b9b3dfddab17db27() {
    return $8f5a2122b0992be3$var$currentModality !== 'pointer';
}
function $8f5a2122b0992be3$export$630ff653c5ada6a9() {
    return $8f5a2122b0992be3$var$currentModality;
}
function $8f5a2122b0992be3$export$8397ddfc504fdb9a(modality) {
    $8f5a2122b0992be3$var$currentModality = modality;
    $8f5a2122b0992be3$var$currentPointerType = modality === 'pointer' ? 'mouse' : modality;
    $8f5a2122b0992be3$var$triggerChangeHandlers(modality, null);
}
function $8f5a2122b0992be3$export$887a228355cf7d95() {
    return $8f5a2122b0992be3$var$currentPointerType;
}
function $8f5a2122b0992be3$export$98e20ec92f614cfe() {
    $8f5a2122b0992be3$var$setupGlobalFocusEvents();
    let [modality, setModality] = (0, $7U4qw$useState)($8f5a2122b0992be3$var$currentModality);
    (0, $7U4qw$useEffect)(()=>{
        let handler = ()=>{
            setModality($8f5a2122b0992be3$var$currentModality);
        };
        $8f5a2122b0992be3$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $8f5a2122b0992be3$export$901e90a13c50a14e.delete(handler);
        };
    }, []);
    return (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)() ? null : modality;
}
const $8f5a2122b0992be3$var$nonTextInputTypes = new Set([
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
 */ function $8f5a2122b0992be3$var$isKeyboardFocusEvent(isTextInput, modality, e) {
    let eventTarget = e ? (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) : undefined;
    let document1 = (0, $d447af545b77c9f1$export$b204af158042fbac)(eventTarget);
    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(eventTarget);
    const IHTMLInputElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLInputElement : HTMLInputElement;
    const IHTMLTextAreaElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLTextAreaElement : HTMLTextAreaElement;
    const IHTMLElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLElement : HTMLElement;
    const IKeyboardEvent = typeof ownerWindow !== 'undefined' ? ownerWindow.KeyboardEvent : KeyboardEvent;
    // For keyboard events that occur on a non-input element that will move focus into input element (aka ArrowLeft going from Datepicker button to the main input group)
    // we need to rely on the user passing isTextInput into here. This way we can skip toggling focus visiblity for said input element
    let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(document1);
    isTextInput = isTextInput || activeElement instanceof IHTMLInputElement && !$8f5a2122b0992be3$var$nonTextInputTypes.has(activeElement.type) || activeElement instanceof IHTMLTextAreaElement || activeElement instanceof IHTMLElement && activeElement.isContentEditable;
    return !(isTextInput && modality === 'keyboard' && e instanceof IKeyboardEvent && !$8f5a2122b0992be3$var$FOCUS_VISIBLE_INPUT_KEYS[e.key]);
}
function $8f5a2122b0992be3$export$ffd9e5021c1fb2d6(props = {}) {
    let { isTextInput: isTextInput, autoFocus: autoFocus } = props;
    let [isFocusVisibleState, setFocusVisible] = (0, $7U4qw$useState)(autoFocus || $8f5a2122b0992be3$export$b9b3dfddab17db27());
    $8f5a2122b0992be3$export$ec71b4b83ac08ec3((isFocusVisible)=>{
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
function $8f5a2122b0992be3$export$ec71b4b83ac08ec3(fn, deps, opts) {
    $8f5a2122b0992be3$var$setupGlobalFocusEvents();
    (0, $7U4qw$useEffect)(()=>{
        if (opts?.enabled === false) return;
        let handler = (modality, e)=>{
            // We want to early return for any keyboard events that occur inside text inputs EXCEPT for Tab and Escape
            if (!$8f5a2122b0992be3$var$isKeyboardFocusEvent(!!opts?.isTextInput, modality, e)) return;
            fn($8f5a2122b0992be3$export$b9b3dfddab17db27());
        };
        $8f5a2122b0992be3$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $8f5a2122b0992be3$export$901e90a13c50a14e.delete(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}


export {$8f5a2122b0992be3$export$901e90a13c50a14e as changeHandlers, $8f5a2122b0992be3$export$d90243b58daecda7 as hasSetupGlobalListeners, $8f5a2122b0992be3$export$2f1888112f558a7d as addWindowFocusTracking, $8f5a2122b0992be3$export$b9b3dfddab17db27 as isFocusVisible, $8f5a2122b0992be3$export$630ff653c5ada6a9 as getInteractionModality, $8f5a2122b0992be3$export$8397ddfc504fdb9a as setInteractionModality, $8f5a2122b0992be3$export$887a228355cf7d95 as getPointerType, $8f5a2122b0992be3$export$98e20ec92f614cfe as useInteractionModality, $8f5a2122b0992be3$export$ffd9e5021c1fb2d6 as useFocusVisible, $8f5a2122b0992be3$export$ec71b4b83ac08ec3 as useFocusVisibleListener};
//# sourceMappingURL=useFocusVisible.mjs.map
