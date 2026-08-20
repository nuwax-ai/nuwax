var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $a9918c67a493892d$exports = require("./utils.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $8f130d4aeb0f65e8$exports = require("../utils/isVirtualEvent.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $gBwJs$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "addWindowFocusTracking", function () { return $d0df89f3abe2c2ca$export$2f1888112f558a7d; });
$parcel$export(module.exports, "isFocusVisible", function () { return $d0df89f3abe2c2ca$export$b9b3dfddab17db27; });
$parcel$export(module.exports, "getInteractionModality", function () { return $d0df89f3abe2c2ca$export$630ff653c5ada6a9; });
$parcel$export(module.exports, "setInteractionModality", function () { return $d0df89f3abe2c2ca$export$8397ddfc504fdb9a; });
$parcel$export(module.exports, "getPointerType", function () { return $d0df89f3abe2c2ca$export$887a228355cf7d95; });
$parcel$export(module.exports, "useInteractionModality", function () { return $d0df89f3abe2c2ca$export$98e20ec92f614cfe; });
$parcel$export(module.exports, "useFocusVisible", function () { return $d0df89f3abe2c2ca$export$ffd9e5021c1fb2d6; });
$parcel$export(module.exports, "useFocusVisibleListener", function () { return $d0df89f3abe2c2ca$export$ec71b4b83ac08ec3; });
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








let $d0df89f3abe2c2ca$var$currentModality = null;
let $d0df89f3abe2c2ca$var$currentPointerType = 'keyboard';
const $d0df89f3abe2c2ca$export$901e90a13c50a14e = new Set();
let $d0df89f3abe2c2ca$export$d90243b58daecda7 = new Map(); // We use a map here to support setting event listeners across multiple document objects.
let $d0df89f3abe2c2ca$var$hasEventBeforeFocus = false;
let $d0df89f3abe2c2ca$var$hasBlurredWindowRecently = false;
// Only Tab or Esc keys will make focus visible on text input elements
const $d0df89f3abe2c2ca$var$FOCUS_VISIBLE_INPUT_KEYS = {
    Tab: true,
    Escape: true
};
function $d0df89f3abe2c2ca$var$triggerChangeHandlers(modality, e) {
    for (let handler of $d0df89f3abe2c2ca$export$901e90a13c50a14e)handler(modality, e);
}
/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus
 * styles visible.
 */ function $d0df89f3abe2c2ca$var$isValidKey(e) {
    // Control and Shift keys trigger when navigating back to the tab with keyboard.
    return !(e.metaKey || !(0, $d0b4a781cf26e80b$exports.isMac)() && e.altKey || e.ctrlKey || e.key === 'Control' || e.key === 'Shift' || e.key === 'Meta');
}
function $d0df89f3abe2c2ca$var$handleKeyboardEvent(e) {
    $d0df89f3abe2c2ca$var$hasEventBeforeFocus = true;
    if (!(0, $75bd88aab025820b$exports.openLink).isOpening && $d0df89f3abe2c2ca$var$isValidKey(e)) {
        $d0df89f3abe2c2ca$var$currentModality = 'keyboard';
        $d0df89f3abe2c2ca$var$currentPointerType = 'keyboard';
        $d0df89f3abe2c2ca$var$triggerChangeHandlers('keyboard', e);
    }
}
function $d0df89f3abe2c2ca$var$handlePointerEvent(e) {
    $d0df89f3abe2c2ca$var$currentModality = 'pointer';
    $d0df89f3abe2c2ca$var$currentPointerType = 'pointerType' in e ? e.pointerType : 'mouse';
    if (e.type === 'mousedown' || e.type === 'pointerdown') {
        $d0df89f3abe2c2ca$var$hasEventBeforeFocus = true;
        $d0df89f3abe2c2ca$var$triggerChangeHandlers('pointer', e);
    }
}
function $d0df89f3abe2c2ca$var$handleClickEvent(e) {
    if (!(0, $75bd88aab025820b$exports.openLink).isOpening && (0, $8f130d4aeb0f65e8$exports.isVirtualClick)(e)) {
        $d0df89f3abe2c2ca$var$hasEventBeforeFocus = true;
        $d0df89f3abe2c2ca$var$currentModality = 'virtual';
        $d0df89f3abe2c2ca$var$currentPointerType = 'virtual';
    }
}
function $d0df89f3abe2c2ca$var$handleFocusEvent(e) {
    // Firefox fires two extra focus events when the user first clicks into an iframe:
    // first on the window, then on the document. We ignore these events so they don't
    // cause keyboard focus rings to appear.
    let ownerWindow = (0, $49582955cc364b1c$exports.getOwnerWindow)((0, $da02ee888921bc9e$exports.getEventTarget)(e));
    let ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)((0, $da02ee888921bc9e$exports.getEventTarget)(e));
    if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === ownerWindow || (0, $da02ee888921bc9e$exports.getEventTarget)(e) === ownerDocument || (0, $a9918c67a493892d$exports.ignoreFocusEvent) || !e.isTrusted) return;
    // If a focus event occurs without a preceding keyboard or pointer event, switch to virtual modality.
    // This occurs, for example, when navigating a form with the next/previous buttons on iOS.
    if (!$d0df89f3abe2c2ca$var$hasEventBeforeFocus && !$d0df89f3abe2c2ca$var$hasBlurredWindowRecently) {
        $d0df89f3abe2c2ca$var$currentModality = 'virtual';
        $d0df89f3abe2c2ca$var$currentPointerType = 'virtual';
        $d0df89f3abe2c2ca$var$triggerChangeHandlers('virtual', e);
    }
    $d0df89f3abe2c2ca$var$hasEventBeforeFocus = false;
    $d0df89f3abe2c2ca$var$hasBlurredWindowRecently = false;
}
function $d0df89f3abe2c2ca$var$handleWindowBlur() {
    if (0, $a9918c67a493892d$exports.ignoreFocusEvent) return;
    // When the window is blurred, reset state. This is necessary when tabbing out of the window,
    // for example, since a subsequent focus event won't be fired.
    $d0df89f3abe2c2ca$var$hasEventBeforeFocus = false;
    $d0df89f3abe2c2ca$var$hasBlurredWindowRecently = true;
}
/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */ function $d0df89f3abe2c2ca$var$setupGlobalFocusEvents(element) {
    // eslint-disable-next-line no-restricted-globals
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const windowObject = (0, $49582955cc364b1c$exports.getOwnerWindow)(element);
    const documentObject = (0, $49582955cc364b1c$exports.getOwnerDocument)(element);
    if ($d0df89f3abe2c2ca$export$d90243b58daecda7.get(windowObject)) return;
    // Programmatic focus() calls shouldn't affect the current input modality.
    // However, we need to detect other cases when a focus event occurs without
    // a preceding user event (e.g. screen reader focus). Overriding the focus
    // method on HTMLElement.prototype is a bit hacky, but works.
    let focus = windowObject.HTMLElement.prototype.focus;
    windowObject.HTMLElement.prototype.focus = function() {
        $d0df89f3abe2c2ca$var$hasEventBeforeFocus = true;
        focus.apply(this, arguments);
    };
    documentObject.addEventListener('keydown', $d0df89f3abe2c2ca$var$handleKeyboardEvent, true);
    documentObject.addEventListener('keyup', $d0df89f3abe2c2ca$var$handleKeyboardEvent, true);
    documentObject.addEventListener('click', $d0df89f3abe2c2ca$var$handleClickEvent, true);
    // Register focus events on the window so they are sure to happen
    // before React's event listeners (registered on the document).
    windowObject.addEventListener('focus', $d0df89f3abe2c2ca$var$handleFocusEvent, true);
    windowObject.addEventListener('blur', $d0df89f3abe2c2ca$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.addEventListener('pointerdown', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.addEventListener('pointermove', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.addEventListener('pointerup', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.addEventListener('mousedown', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.addEventListener('mousemove', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.addEventListener('mouseup', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
    }
    // Add unmount handler
    windowObject.addEventListener('beforeunload', ()=>{
        $d0df89f3abe2c2ca$var$tearDownWindowFocusTracking(element);
    }, {
        once: true
    });
    $d0df89f3abe2c2ca$export$d90243b58daecda7.set(windowObject, {
        focus: focus
    });
}
const $d0df89f3abe2c2ca$var$tearDownWindowFocusTracking = (element, loadListener)=>{
    const windowObject = (0, $49582955cc364b1c$exports.getOwnerWindow)(element);
    const documentObject = (0, $49582955cc364b1c$exports.getOwnerDocument)(element);
    if (loadListener) documentObject.removeEventListener('DOMContentLoaded', loadListener);
    if (!$d0df89f3abe2c2ca$export$d90243b58daecda7.has(windowObject)) return;
    windowObject.HTMLElement.prototype.focus = $d0df89f3abe2c2ca$export$d90243b58daecda7.get(windowObject).focus;
    documentObject.removeEventListener('keydown', $d0df89f3abe2c2ca$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('keyup', $d0df89f3abe2c2ca$var$handleKeyboardEvent, true);
    documentObject.removeEventListener('click', $d0df89f3abe2c2ca$var$handleClickEvent, true);
    windowObject.removeEventListener('focus', $d0df89f3abe2c2ca$var$handleFocusEvent, true);
    windowObject.removeEventListener('blur', $d0df89f3abe2c2ca$var$handleWindowBlur, false);
    if (typeof PointerEvent !== 'undefined') {
        documentObject.removeEventListener('pointerdown', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointermove', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.removeEventListener('pointerup', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
    } else if (process.env.NODE_ENV === 'test') {
        documentObject.removeEventListener('mousedown', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.removeEventListener('mousemove', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
        documentObject.removeEventListener('mouseup', $d0df89f3abe2c2ca$var$handlePointerEvent, true);
    }
    $d0df89f3abe2c2ca$export$d90243b58daecda7.delete(windowObject);
};
function $d0df89f3abe2c2ca$export$2f1888112f558a7d(element) {
    const documentObject = (0, $49582955cc364b1c$exports.getOwnerDocument)(element);
    let loadListener;
    if (documentObject.readyState !== 'loading') $d0df89f3abe2c2ca$var$setupGlobalFocusEvents(element);
    else {
        loadListener = ()=>{
            $d0df89f3abe2c2ca$var$setupGlobalFocusEvents(element);
        };
        documentObject.addEventListener('DOMContentLoaded', loadListener);
    }
    return ()=>$d0df89f3abe2c2ca$var$tearDownWindowFocusTracking(element, loadListener);
}
// Server-side rendering does not have the document object defined
// eslint-disable-next-line no-restricted-globals
if (typeof document !== 'undefined') $d0df89f3abe2c2ca$export$2f1888112f558a7d();
function $d0df89f3abe2c2ca$export$b9b3dfddab17db27() {
    return $d0df89f3abe2c2ca$var$currentModality !== 'pointer';
}
function $d0df89f3abe2c2ca$export$630ff653c5ada6a9() {
    return $d0df89f3abe2c2ca$var$currentModality;
}
function $d0df89f3abe2c2ca$export$8397ddfc504fdb9a(modality) {
    $d0df89f3abe2c2ca$var$currentModality = modality;
    $d0df89f3abe2c2ca$var$currentPointerType = modality === 'pointer' ? 'mouse' : modality;
    $d0df89f3abe2c2ca$var$triggerChangeHandlers(modality, null);
}
function $d0df89f3abe2c2ca$export$887a228355cf7d95() {
    return $d0df89f3abe2c2ca$var$currentPointerType;
}
function $d0df89f3abe2c2ca$export$98e20ec92f614cfe() {
    $d0df89f3abe2c2ca$var$setupGlobalFocusEvents();
    let [modality, setModality] = (0, $gBwJs$react.useState)($d0df89f3abe2c2ca$var$currentModality);
    (0, $gBwJs$react.useEffect)(()=>{
        let handler = ()=>{
            setModality($d0df89f3abe2c2ca$var$currentModality);
        };
        $d0df89f3abe2c2ca$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $d0df89f3abe2c2ca$export$901e90a13c50a14e.delete(handler);
        };
    }, []);
    return (0, $25c7fefe1bb8073e$exports.useIsSSR)() ? null : modality;
}
const $d0df89f3abe2c2ca$var$nonTextInputTypes = new Set([
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
 */ function $d0df89f3abe2c2ca$var$isKeyboardFocusEvent(isTextInput, modality, e) {
    let eventTarget = e ? (0, $da02ee888921bc9e$exports.getEventTarget)(e) : undefined;
    let document1 = (0, $49582955cc364b1c$exports.getOwnerDocument)(eventTarget);
    let ownerWindow = (0, $49582955cc364b1c$exports.getOwnerWindow)(eventTarget);
    const IHTMLInputElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLInputElement : HTMLInputElement;
    const IHTMLTextAreaElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLTextAreaElement : HTMLTextAreaElement;
    const IHTMLElement = typeof ownerWindow !== 'undefined' ? ownerWindow.HTMLElement : HTMLElement;
    const IKeyboardEvent = typeof ownerWindow !== 'undefined' ? ownerWindow.KeyboardEvent : KeyboardEvent;
    // For keyboard events that occur on a non-input element that will move focus into input element (aka ArrowLeft going from Datepicker button to the main input group)
    // we need to rely on the user passing isTextInput into here. This way we can skip toggling focus visiblity for said input element
    let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)(document1);
    isTextInput = isTextInput || activeElement instanceof IHTMLInputElement && !$d0df89f3abe2c2ca$var$nonTextInputTypes.has(activeElement.type) || activeElement instanceof IHTMLTextAreaElement || activeElement instanceof IHTMLElement && activeElement.isContentEditable;
    return !(isTextInput && modality === 'keyboard' && e instanceof IKeyboardEvent && !$d0df89f3abe2c2ca$var$FOCUS_VISIBLE_INPUT_KEYS[e.key]);
}
function $d0df89f3abe2c2ca$export$ffd9e5021c1fb2d6(props = {}) {
    let { isTextInput: isTextInput, autoFocus: autoFocus } = props;
    let [isFocusVisibleState, setFocusVisible] = (0, $gBwJs$react.useState)(autoFocus || $d0df89f3abe2c2ca$export$b9b3dfddab17db27());
    $d0df89f3abe2c2ca$export$ec71b4b83ac08ec3((isFocusVisible)=>{
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
function $d0df89f3abe2c2ca$export$ec71b4b83ac08ec3(fn, deps, opts) {
    $d0df89f3abe2c2ca$var$setupGlobalFocusEvents();
    (0, $gBwJs$react.useEffect)(()=>{
        if (opts?.enabled === false) return;
        let handler = (modality, e)=>{
            // We want to early return for any keyboard events that occur inside text inputs EXCEPT for Tab and Escape
            if (!$d0df89f3abe2c2ca$var$isKeyboardFocusEvent(!!opts?.isTextInput, modality, e)) return;
            fn($d0df89f3abe2c2ca$export$b9b3dfddab17db27());
        };
        $d0df89f3abe2c2ca$export$901e90a13c50a14e.add(handler);
        return ()=>{
            $d0df89f3abe2c2ca$export$901e90a13c50a14e.delete(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}


//# sourceMappingURL=useFocusVisible.cjs.map
