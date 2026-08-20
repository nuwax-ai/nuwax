import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {createSyntheticEvent as $819bf6b2be9219ca$export$525bc4921d56d4a, preventFocus as $819bf6b2be9219ca$export$cabe61c495ee3649, setEventTarget as $819bf6b2be9219ca$export$c2b7abe5d61ec696} from "./utils.js";
import {disableTextSelection as $913e9bb378fa8235$export$16a4697467175487, restoreTextSelection as $913e9bb378fa8235$export$b0d6fa1ab32e3295} from "./textSelection.js";
import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getNonce as $fb5d33e131fca75a$export$2b85b721e524d74b} from "../utils/getNonce.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac, getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {isMac as $d5a2be505488529f$export$9ac100e40613ea10} from "../utils/platform.js";
import {isVirtualClick as $fa0ef9dfcca012a7$export$60278871457622de, isVirtualPointerEvent as $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63} from "../utils/isVirtualEvent.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {openLink as $044d3c97ce5d6621$export$95185d699e05d4d7} from "../utils/openLink.js";
import {PressResponderContext as $dacd55d881558a20$export$5165eccb35aaadb5} from "./context.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useSyncRef as $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.js";
import {_ as $cnVPj$_} from "@swc/helpers/_/_class_private_field_get";
import {_ as $cnVPj$_1} from "@swc/helpers/_/_class_private_field_init";
import {_ as $cnVPj$_2} from "@swc/helpers/_/_class_private_field_set";
import {flushSync as $cnVPj$flushSync} from "react-dom";
import {useContext as $cnVPj$useContext, useState as $cnVPj$useState, useRef as $cnVPj$useRef, useCallback as $cnVPj$useCallback, useEffect as $cnVPj$useEffect, useMemo as $cnVPj$useMemo} from "react";

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




















function $a87f4c40785e693b$var$usePressResponderContext(props) {
    // Consume context from <PressResponder> and merge with props.
    let context = (0, $cnVPj$useContext)((0, $dacd55d881558a20$export$5165eccb35aaadb5));
    if (context) {
        // Prevent mergeProps from merging ref.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let { register: register, ref: ref, ...contextProps } = context;
        props = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(contextProps, props);
        register();
    }
    (0, $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e)(context, props.ref);
    return props;
}
var $a87f4c40785e693b$var$_shouldStopPropagation = /*#__PURE__*/ new WeakMap();
class $a87f4c40785e693b$var$PressEvent {
    continuePropagation() {
        (0, $cnVPj$_2)(this, $a87f4c40785e693b$var$_shouldStopPropagation, false);
    }
    get shouldStopPropagation() {
        return (0, $cnVPj$_)(this, $a87f4c40785e693b$var$_shouldStopPropagation);
    }
    constructor(type, pointerType, originalEvent, state){
        (0, $cnVPj$_1)(this, $a87f4c40785e693b$var$_shouldStopPropagation, {
            writable: true,
            value: void 0
        });
        (0, $cnVPj$_2)(this, $a87f4c40785e693b$var$_shouldStopPropagation, true);
        var _state_target;
        let currentTarget = (_state_target = state === null || state === void 0 ? void 0 : state.target) !== null && _state_target !== void 0 ? _state_target : originalEvent.currentTarget;
        const rect = currentTarget === null || currentTarget === void 0 ? void 0 : currentTarget.getBoundingClientRect();
        let x, y = 0;
        let clientX, clientY = null;
        if (originalEvent.clientX != null && originalEvent.clientY != null) {
            clientX = originalEvent.clientX;
            clientY = originalEvent.clientY;
        }
        if (rect) {
            if (clientX != null && clientY != null) {
                x = clientX - rect.left;
                y = clientY - rect.top;
            } else {
                x = rect.width / 2;
                y = rect.height / 2;
            }
        }
        this.type = type;
        this.pointerType = pointerType;
        this.target = originalEvent.currentTarget;
        this.shiftKey = originalEvent.shiftKey;
        this.metaKey = originalEvent.metaKey;
        this.ctrlKey = originalEvent.ctrlKey;
        this.altKey = originalEvent.altKey;
        this.x = x;
        this.y = y;
        this.key = originalEvent.key;
    }
}
const $a87f4c40785e693b$var$LINK_CLICKED = Symbol('linkClicked');
const $a87f4c40785e693b$var$STYLE_ID = 'react-aria-pressable-style';
const $a87f4c40785e693b$var$PRESSABLE_ATTRIBUTE = 'data-react-aria-pressable';
function $a87f4c40785e693b$export$45712eceda6fad21(props) {
    let { onPress: onPress, onPressChange: onPressChange, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressUp: onPressUp, onClick: onClick, isDisabled: isDisabled, isPressed: isPressedProp, preventFocusOnPress: preventFocusOnPress, shouldCancelOnPointerExit: shouldCancelOnPointerExit, allowTextSelectionOnPress: allowTextSelectionOnPress, ref: domRef, ...domProps } = $a87f4c40785e693b$var$usePressResponderContext(props);
    let [isPressed, setPressed] = (0, $cnVPj$useState)(false);
    let ref = (0, $cnVPj$useRef)({
        isPressed: false,
        ignoreEmulatedMouseEvents: false,
        didFirePressStart: false,
        isTriggeringEvent: false,
        activePointerId: null,
        target: null,
        isOverTarget: false,
        pointerType: null,
        disposables: []
    });
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let triggerPressStart = (0, $cnVPj$useCallback)((originalEvent, pointerType)=>{
        let state = ref.current;
        if (isDisabled || state.didFirePressStart) return false;
        let shouldStopPropagation = true;
        state.isTriggeringEvent = true;
        if (onPressStart) {
            let event = new $a87f4c40785e693b$var$PressEvent('pressstart', pointerType, originalEvent);
            onPressStart(event);
            shouldStopPropagation = event.shouldStopPropagation;
        }
        if (onPressChange) onPressChange(true);
        state.isTriggeringEvent = false;
        state.didFirePressStart = true;
        setPressed(true);
        return shouldStopPropagation;
    }, [
        isDisabled,
        onPressStart,
        onPressChange
    ]);
    let triggerPressEnd = (0, $cnVPj$useCallback)((originalEvent, pointerType, wasPressed = true)=>{
        let state = ref.current;
        if (!state.didFirePressStart) return false;
        state.didFirePressStart = false;
        state.isTriggeringEvent = true;
        let shouldStopPropagation = true;
        if (onPressEnd) {
            let event = new $a87f4c40785e693b$var$PressEvent('pressend', pointerType, originalEvent);
            onPressEnd(event);
            shouldStopPropagation = event.shouldStopPropagation;
        }
        if (onPressChange) onPressChange(false);
        setPressed(false);
        if (onPress && wasPressed && !isDisabled) {
            let event = new $a87f4c40785e693b$var$PressEvent('press', pointerType, originalEvent);
            onPress(event);
            shouldStopPropagation && (shouldStopPropagation = event.shouldStopPropagation);
        }
        state.isTriggeringEvent = false;
        return shouldStopPropagation;
    }, [
        isDisabled,
        onPressEnd,
        onPressChange,
        onPress
    ]);
    let triggerPressEndEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(triggerPressEnd);
    let triggerPressUp = (0, $cnVPj$useCallback)((originalEvent, pointerType)=>{
        let state = ref.current;
        if (isDisabled) return false;
        if (onPressUp) {
            state.isTriggeringEvent = true;
            let event = new $a87f4c40785e693b$var$PressEvent('pressup', pointerType, originalEvent);
            onPressUp(event);
            state.isTriggeringEvent = false;
            return event.shouldStopPropagation;
        }
        return true;
    }, [
        isDisabled,
        onPressUp
    ]);
    let triggerPressUpEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(triggerPressUp);
    let cancel = (0, $cnVPj$useCallback)((e)=>{
        let state = ref.current;
        if (state.isPressed && state.target) {
            if (state.didFirePressStart && state.pointerType != null) triggerPressEnd($a87f4c40785e693b$var$createEvent(state.target, e), state.pointerType, false);
            state.isPressed = false;
            state.isOverTarget = false;
            state.activePointerId = null;
            state.pointerType = null;
            removeAllGlobalListeners();
            if (!allowTextSelectionOnPress) (0, $913e9bb378fa8235$export$b0d6fa1ab32e3295)(state.target);
            for (let dispose of state.disposables)dispose();
            state.disposables = [];
        }
    }, [
        allowTextSelectionOnPress,
        removeAllGlobalListeners,
        triggerPressEnd
    ]);
    let cancelEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(cancel);
    (0, $cnVPj$useEffect)(()=>{
        if (isDisabled && ref.current.isPressed) cancelEvent({
            currentTarget: ref.current.target,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            altKey: false
        });
    }, [
        isDisabled
    ]);
    let cancelOnPointerExit = (0, $cnVPj$useCallback)((e)=>{
        if (shouldCancelOnPointerExit) cancel(e);
    }, [
        shouldCancelOnPointerExit,
        cancel
    ]);
    let triggerClick = (0, $cnVPj$useCallback)((e)=>{
        if (isDisabled) return;
        onClick === null || onClick === void 0 ? void 0 : onClick(e);
    }, [
        isDisabled,
        onClick
    ]);
    let triggerSyntheticClick = (0, $cnVPj$useCallback)((e, target)=>{
        if (isDisabled) return;
        // Some third-party libraries pass in onClick instead of onPress.
        // Create a fake mouse event and trigger onClick as well.
        // This matches the browser's native activation behavior for certain elements (e.g. button).
        // https://html.spec.whatwg.org/#activation
        // https://html.spec.whatwg.org/#fire-a-synthetic-pointer-event
        if (onClick) {
            let event = new MouseEvent('click', e);
            (0, $819bf6b2be9219ca$export$c2b7abe5d61ec696)(event, target);
            onClick((0, $819bf6b2be9219ca$export$525bc4921d56d4a)(event));
        }
    }, [
        isDisabled,
        onClick
    ]);
    let pressProps = (0, $cnVPj$useMemo)(()=>{
        let state = ref.current;
        let pressProps = {
            onKeyDown (e) {
                if ($a87f4c40785e693b$var$isValidKeyboardEvent(e.nativeEvent, e.currentTarget) && (0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                    var _state_metaKeyEvents;
                    if ($a87f4c40785e693b$var$shouldPreventDefaultKeyboard((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e), e.key)) e.preventDefault();
                    // If the event is repeating, it may have started on a different element
                    // after which focus moved to the current element. Ignore these events and
                    // only handle the first key down event.
                    let shouldStopPropagation = true;
                    if (!state.isPressed && !e.repeat) {
                        state.target = e.currentTarget;
                        state.isPressed = true;
                        state.pointerType = 'keyboard';
                        shouldStopPropagation = triggerPressStart(e, 'keyboard');
                    }
                    // Focus may move before the key up event, so register the event on the document
                    // instead of the same element where the key down event occurred. Make it capturing so that it will trigger
                    // before stopPropagation from useKeyboard on a child element may happen and thus we can still call triggerPress for the parent element.
                    let originalTarget = e.currentTarget;
                    let pressUp = (e)=>{
                        if ($a87f4c40785e693b$var$isValidKeyboardEvent(e, originalTarget) && !e.repeat && (0, $d8ac7ed472840322$export$4282f70798064fe0)(originalTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) && state.target) // eslint-disable-next-line react-hooks/rules-of-hooks
                        triggerPressUpEvent($a87f4c40785e693b$var$createEvent(state.target, e), 'keyboard');
                    };
                    addGlobalListener((0, $cc3c3666b64debad$export$b204af158042fbac)(e.currentTarget), 'keyup', (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(pressUp, onKeyUp), true);
                    if (shouldStopPropagation) e.stopPropagation();
                    // Keep track of the keydown events that occur while the Meta (e.g. Command) key is held.
                    // macOS has a bug where keyup events are not fired while the Meta key is down.
                    // When the Meta key itself is released we will get an event for that, and we'll act as if
                    // all of these other keys were released as well.
                    // https://bugs.chromium.org/p/chromium/issues/detail?id=1393524
                    // https://bugs.webkit.org/show_bug.cgi?id=55291
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=1299553
                    if (e.metaKey && (0, $d5a2be505488529f$export$9ac100e40613ea10)()) (_state_metaKeyEvents = state.metaKeyEvents) === null || _state_metaKeyEvents === void 0 ? void 0 : _state_metaKeyEvents.set(e.key, e.nativeEvent);
                } else if (e.key === 'Meta') state.metaKeyEvents = new Map();
            },
            onClick (e) {
                if (e && !(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (e && e.button === 0 && !state.isTriggeringEvent && !(0, $044d3c97ce5d6621$export$95185d699e05d4d7).isOpening) {
                    let shouldStopPropagation = true;
                    if (isDisabled) e.preventDefault();
                    // If triggered from a screen reader or by using element.click(),
                    // trigger as if it were a keyboard click.
                    if (!state.ignoreEmulatedMouseEvents && !state.isPressed && (state.pointerType === 'virtual' || (0, $fa0ef9dfcca012a7$export$60278871457622de)(e.nativeEvent))) {
                        let stopPressStart = triggerPressStart(e, 'virtual');
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        let stopPressUp = triggerPressUpEvent(e, 'virtual');
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        let stopPressEnd = triggerPressEndEvent(e, 'virtual');
                        triggerClick(e);
                        shouldStopPropagation = stopPressStart && stopPressUp && stopPressEnd;
                    } else if (state.isPressed && state.pointerType !== 'keyboard') {
                        let pointerType = state.pointerType || e.nativeEvent.pointerType || 'virtual';
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        let stopPressUp = triggerPressUpEvent($a87f4c40785e693b$var$createEvent(e.currentTarget, e), pointerType);
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        let stopPressEnd = triggerPressEndEvent($a87f4c40785e693b$var$createEvent(e.currentTarget, e), pointerType, true);
                        shouldStopPropagation = stopPressUp && stopPressEnd;
                        state.isOverTarget = false;
                        triggerClick(e);
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        cancelEvent(e);
                    }
                    state.ignoreEmulatedMouseEvents = false;
                    if (shouldStopPropagation) e.stopPropagation();
                }
            }
        };
        let onKeyUp = (e)=>{
            var _state_metaKeyEvents;
            if (state.isPressed && state.target && $a87f4c40785e693b$var$isValidKeyboardEvent(e, state.target)) {
                var _state_metaKeyEvents1;
                if ($a87f4c40785e693b$var$shouldPreventDefaultKeyboard((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e), e.key)) e.preventDefault();
                let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                let wasPressed = (0, $d8ac7ed472840322$export$4282f70798064fe0)(state.target, target);
                // eslint-disable-next-line react-hooks/rules-of-hooks
                triggerPressEndEvent($a87f4c40785e693b$var$createEvent(state.target, e), 'keyboard', wasPressed);
                if (wasPressed) triggerSyntheticClick(e, state.target);
                removeAllGlobalListeners();
                // If a link was triggered with a key other than Enter, open the URL ourselves.
                // This means the link has a role override, and the default browser behavior
                // only applies when using the Enter key.
                if (e.key !== 'Enter' && $a87f4c40785e693b$var$isHTMLAnchorLink(state.target) && (0, $d8ac7ed472840322$export$4282f70798064fe0)(state.target, target) && !e[$a87f4c40785e693b$var$LINK_CLICKED]) {
                    // Store a hidden property on the event so we only trigger link click once,
                    // even if there are multiple usePress instances attached to the element.
                    e[$a87f4c40785e693b$var$LINK_CLICKED] = true;
                    (0, $044d3c97ce5d6621$export$95185d699e05d4d7)(state.target, e, false);
                }
                state.isPressed = false;
                (_state_metaKeyEvents1 = state.metaKeyEvents) === null || _state_metaKeyEvents1 === void 0 ? void 0 : _state_metaKeyEvents1.delete(e.key);
            } else if (e.key === 'Meta' && ((_state_metaKeyEvents = state.metaKeyEvents) === null || _state_metaKeyEvents === void 0 ? void 0 : _state_metaKeyEvents.size)) {
                var _state_target;
                // If we recorded keydown events that occurred while the Meta key was pressed,
                // and those haven't received keyup events already, fire keyup events ourselves.
                // See comment above for more info about the macOS bug causing this.
                let events = state.metaKeyEvents;
                state.metaKeyEvents = undefined;
                for (let event of events.values())(_state_target = state.target) === null || _state_target === void 0 ? void 0 : _state_target.dispatchEvent(new KeyboardEvent('keyup', event));
            }
        };
        if (typeof PointerEvent !== 'undefined') {
            pressProps.onPointerDown = (e)=>{
                // Only handle left clicks, and ignore events that bubbled through portals.
                if (e.button !== 0 || !(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                // iOS safari fires pointer events from VoiceOver with incorrect coordinates/target.
                // Ignore and let the onClick handler take care of it instead.
                // https://bugs.webkit.org/show_bug.cgi?id=222627
                // https://bugs.webkit.org/show_bug.cgi?id=223202
                if ((0, $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63)(e.nativeEvent)) {
                    state.pointerType = 'virtual';
                    return;
                }
                state.pointerType = e.pointerType;
                let shouldStopPropagation = true;
                if (!state.isPressed) {
                    state.isPressed = true;
                    state.isOverTarget = true;
                    state.activePointerId = e.pointerId;
                    state.target = e.currentTarget;
                    if (!allowTextSelectionOnPress) (0, $913e9bb378fa8235$export$16a4697467175487)(state.target);
                    shouldStopPropagation = triggerPressStart(e, state.pointerType);
                    // Release pointer capture so that touch interactions can leave the original target.
                    // This enables onPointerLeave and onPointerEnter to fire.
                    let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                    if ('releasePointerCapture' in target) {
                        if ('hasPointerCapture' in target) {
                            if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
                        } else target.releasePointerCapture(e.pointerId);
                    }
                    addGlobalListener((0, $cc3c3666b64debad$export$b204af158042fbac)(e.currentTarget), 'pointerup', onPointerUp, false);
                    addGlobalListener((0, $cc3c3666b64debad$export$b204af158042fbac)(e.currentTarget), 'pointercancel', onPointerCancel, false);
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onMouseDown = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (e.button === 0) {
                    if (preventFocusOnPress) {
                        let dispose = (0, $819bf6b2be9219ca$export$cabe61c495ee3649)(e.target);
                        if (dispose) state.disposables.push(dispose);
                    }
                    e.stopPropagation();
                }
            };
            pressProps.onPointerUp = (e)=>{
                // iOS fires pointerup with zero width and height, so check the pointerType recorded during pointerdown.
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) || state.pointerType === 'virtual') return;
                // Only handle left clicks. If isPressed is true, delay until onClick.
                if (e.button === 0 && !state.isPressed) // eslint-disable-next-line react-hooks/rules-of-hooks
                triggerPressUpEvent(e, state.pointerType || e.pointerType);
            };
            pressProps.onPointerEnter = (e)=>{
                if (e.pointerId === state.activePointerId && state.target && !state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = true;
                    triggerPressStart($a87f4c40785e693b$var$createEvent(state.target, e), state.pointerType);
                }
            };
            pressProps.onPointerLeave = (e)=>{
                if (e.pointerId === state.activePointerId && state.target && state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = false;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    triggerPressEndEvent($a87f4c40785e693b$var$createEvent(state.target, e), state.pointerType, false);
                    cancelOnPointerExit(e);
                }
            };
            let onPointerUp = (e)=>{
                if (e.pointerId === state.activePointerId && state.isPressed && e.button === 0 && state.target) {
                    if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(state.target, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) && state.pointerType != null) {
                        // Wait for onClick to fire onPress. This avoids browser issues when the DOM
                        // is mutated between onPointerUp and onClick, and is more compatible with third party libraries.
                        // https://github.com/adobe/react-spectrum/issues/1513
                        // https://issues.chromium.org/issues/40732224
                        // However, iOS and Android do not focus or fire onClick after a long press.
                        // We work around this by triggering a click ourselves after a timeout.
                        // This timeout is canceled during the click event in case the real one fires first.
                        // The timeout must be at least 32ms, because Safari on iOS delays the click event on
                        // non-form elements without certain ARIA roles (for hover emulation).
                        // https://github.com/WebKit/WebKit/blob/dccfae42bb29bd4bdef052e469f604a9387241c0/Source/WebKit/WebProcess/WebPage/ios/WebPageIOS.mm#L875-L892
                        let clicked = false;
                        let timeout = setTimeout(()=>{
                            if (state.isPressed && state.target instanceof HTMLElement) {
                                if (clicked) // eslint-disable-next-line react-hooks/rules-of-hooks
                                cancelEvent(e);
                                else {
                                    (0, $d559d872031c749f$export$de79e2c695e052f3)(state.target);
                                    state.target.click();
                                }
                            }
                        }, 80);
                        // Use a capturing listener to track if a click occurred.
                        // If stopPropagation is called it may never reach our handler.
                        addGlobalListener(e.currentTarget, 'click', ()=>clicked = true, true);
                        state.disposables.push(()=>clearTimeout(timeout));
                    } else // eslint-disable-next-line react-hooks/rules-of-hooks
                    cancelEvent(e);
                    // Ignore subsequent onPointerLeave event before onClick on touch devices.
                    state.isOverTarget = false;
                }
            };
            let onPointerCancel = (e)=>{
                // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
            };
            pressProps.onDragStart = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                // Safari does not call onPointerCancel when a drag starts, whereas Chrome and Firefox do.
                // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
            };
        } else if (process.env.NODE_ENV === 'test') {
            // NOTE: this fallback branch is entirely used by unit tests.
            // All browsers now support pointer events, but JSDOM still does not.
            pressProps.onMouseDown = (e)=>{
                // Only handle left clicks
                if (e.button !== 0 || !(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (state.ignoreEmulatedMouseEvents) {
                    e.stopPropagation();
                    return;
                }
                state.isPressed = true;
                state.isOverTarget = true;
                state.target = e.currentTarget;
                state.pointerType = (0, $fa0ef9dfcca012a7$export$60278871457622de)(e.nativeEvent) ? 'virtual' : 'mouse';
                // Flush sync so that focus moved during react re-renders occurs before we yield back to the browser.
                let shouldStopPropagation = (0, $cnVPj$flushSync)(()=>triggerPressStart(e, state.pointerType));
                if (shouldStopPropagation) e.stopPropagation();
                if (preventFocusOnPress) {
                    let dispose = (0, $819bf6b2be9219ca$export$cabe61c495ee3649)(e.target);
                    if (dispose) state.disposables.push(dispose);
                }
                addGlobalListener((0, $cc3c3666b64debad$export$b204af158042fbac)(e.currentTarget), 'mouseup', onMouseUp, false);
            };
            pressProps.onMouseEnter = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                let shouldStopPropagation = true;
                if (state.isPressed && !state.ignoreEmulatedMouseEvents && state.pointerType != null) {
                    state.isOverTarget = true;
                    shouldStopPropagation = triggerPressStart(e, state.pointerType);
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onMouseLeave = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                let shouldStopPropagation = true;
                if (state.isPressed && !state.ignoreEmulatedMouseEvents && state.pointerType != null) {
                    state.isOverTarget = false;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    shouldStopPropagation = triggerPressEndEvent(e, state.pointerType, false);
                    cancelOnPointerExit(e);
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onMouseUp = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (!state.ignoreEmulatedMouseEvents && e.button === 0 && !state.isPressed) // eslint-disable-next-line react-hooks/rules-of-hooks
                triggerPressUpEvent(e, state.pointerType || 'mouse');
            };
            let onMouseUp = (e)=>{
                // Only handle left clicks
                if (e.button !== 0) return;
                if (state.ignoreEmulatedMouseEvents) {
                    state.ignoreEmulatedMouseEvents = false;
                    return;
                }
                if (state.target && (0, $d8ac7ed472840322$export$4282f70798064fe0)(state.target, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) && state.pointerType != null) ;
                else // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
                state.isOverTarget = false;
            };
            pressProps.onTouchStart = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                let touch = $a87f4c40785e693b$var$getTouchFromEvent(e.nativeEvent);
                if (!touch) return;
                state.activePointerId = touch.identifier;
                state.ignoreEmulatedMouseEvents = true;
                state.isOverTarget = true;
                state.isPressed = true;
                state.target = e.currentTarget;
                state.pointerType = 'touch';
                if (!allowTextSelectionOnPress) (0, $913e9bb378fa8235$export$16a4697467175487)(state.target);
                let shouldStopPropagation = triggerPressStart($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType);
                if (shouldStopPropagation) e.stopPropagation();
                addGlobalListener((0, $cc3c3666b64debad$export$f21a1ffae260145a)(e.currentTarget), 'scroll', onScroll, true);
            };
            pressProps.onTouchMove = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (!state.isPressed) {
                    e.stopPropagation();
                    return;
                }
                let touch = $a87f4c40785e693b$var$getTouchById(e.nativeEvent, state.activePointerId);
                let shouldStopPropagation = true;
                if (touch && $a87f4c40785e693b$var$isOverTarget(touch, e.currentTarget)) {
                    if (!state.isOverTarget && state.pointerType != null) {
                        state.isOverTarget = true;
                        shouldStopPropagation = triggerPressStart($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType);
                    }
                } else if (state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = false;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    shouldStopPropagation = triggerPressEndEvent($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType, false);
                    cancelOnPointerExit($a87f4c40785e693b$var$createTouchEvent(state.target, e));
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onTouchEnd = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                if (!state.isPressed) {
                    e.stopPropagation();
                    return;
                }
                let touch = $a87f4c40785e693b$var$getTouchById(e.nativeEvent, state.activePointerId);
                let shouldStopPropagation = true;
                if (touch && $a87f4c40785e693b$var$isOverTarget(touch, e.currentTarget) && state.pointerType != null) {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    triggerPressUpEvent($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType);
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    shouldStopPropagation = triggerPressEndEvent($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType);
                    triggerSyntheticClick(e.nativeEvent, state.target);
                } else if (state.isOverTarget && state.pointerType != null) // eslint-disable-next-line react-hooks/rules-of-hooks
                shouldStopPropagation = triggerPressEndEvent($a87f4c40785e693b$var$createTouchEvent(state.target, e), state.pointerType, false);
                if (shouldStopPropagation) e.stopPropagation();
                state.isPressed = false;
                state.activePointerId = null;
                state.isOverTarget = false;
                state.ignoreEmulatedMouseEvents = true;
                if (state.target && !allowTextSelectionOnPress) (0, $913e9bb378fa8235$export$b0d6fa1ab32e3295)(state.target);
                removeAllGlobalListeners();
            };
            pressProps.onTouchCancel = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                e.stopPropagation();
                if (state.isPressed) // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent($a87f4c40785e693b$var$createTouchEvent(state.target, e));
            };
            let onScroll = (e)=>{
                if (state.isPressed && (0, $d8ac7ed472840322$export$4282f70798064fe0)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e), state.target)) // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent({
                    currentTarget: state.target,
                    shiftKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    altKey: false
                });
            };
            pressProps.onDragStart = (e)=>{
                if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
            };
        }
        return pressProps;
    }, [
        addGlobalListener,
        isDisabled,
        preventFocusOnPress,
        removeAllGlobalListeners,
        allowTextSelectionOnPress,
        cancelOnPointerExit,
        triggerPressStart,
        triggerClick,
        triggerSyntheticClick
    ]);
    // Avoid onClick delay for double tap to zoom by default.
    (0, $cnVPj$useEffect)(()=>{
        if (!domRef || process.env.NODE_ENV === 'test') return;
        const ownerDocument = (0, $cc3c3666b64debad$export$b204af158042fbac)(domRef.current);
        if (!ownerDocument || !ownerDocument.head || ownerDocument.getElementById($a87f4c40785e693b$var$STYLE_ID)) return;
        const style = ownerDocument.createElement('style');
        style.id = $a87f4c40785e693b$var$STYLE_ID;
        let nonce = (0, $fb5d33e131fca75a$export$2b85b721e524d74b)(ownerDocument);
        if (nonce) style.nonce = nonce;
        // touchAction: 'manipulation' is supposed to be equivalent, but in
        // Safari it causes onPointerCancel not to fire on scroll.
        // https://bugs.webkit.org/show_bug.cgi?id=240917
        style.textContent = `
@layer {
  [${$a87f4c40785e693b$var$PRESSABLE_ATTRIBUTE}] {
    touch-action: pan-x pan-y pinch-zoom;
  }
}
    `.trim();
        ownerDocument.head.prepend(style);
    }, [
        domRef
    ]);
    // Remove user-select: none in case component unmounts immediately after pressStart
    (0, $cnVPj$useEffect)(()=>{
        let state = ref.current;
        return ()=>{
            var _state_target;
            if (!allowTextSelectionOnPress) (0, $913e9bb378fa8235$export$b0d6fa1ab32e3295)((_state_target = state.target) !== null && _state_target !== void 0 ? _state_target : undefined);
            for (let dispose of state.disposables)dispose();
            state.disposables = [];
        };
    }, [
        allowTextSelectionOnPress
    ]);
    return {
        isPressed: isPressedProp || isPressed,
        pressProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, pressProps, {
            [$a87f4c40785e693b$var$PRESSABLE_ATTRIBUTE]: true
        })
    };
}
function $a87f4c40785e693b$var$isHTMLAnchorLink(target) {
    return target.tagName === 'A' && target.hasAttribute('href');
}
function $a87f4c40785e693b$var$isValidKeyboardEvent(event, currentTarget) {
    const { key: key, code: code } = event;
    const element = currentTarget;
    const role = element.getAttribute('role');
    // Accessibility for keyboards. Space and Enter only.
    // "Spacebar" is for IE 11
    return (key === 'Enter' || key === ' ' || key === 'Spacebar' || code === 'Space') && !(element instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(element).HTMLInputElement && !$a87f4c40785e693b$var$isValidInputKey(element, key) || element instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(element).HTMLTextAreaElement || element.isContentEditable) && // Links should only trigger with Enter key
    !((role === 'link' || !role && $a87f4c40785e693b$var$isHTMLAnchorLink(element)) && key !== 'Enter');
}
function $a87f4c40785e693b$var$getTouchFromEvent(event) {
    const { targetTouches: targetTouches } = event;
    if (targetTouches.length > 0) return targetTouches[0];
    return null;
}
function $a87f4c40785e693b$var$getTouchById(event, pointerId) {
    const changedTouches = event.changedTouches;
    for(let i = 0; i < changedTouches.length; i++){
        const touch = changedTouches[i];
        if (touch.identifier === pointerId) return touch;
    }
    return null;
}
function $a87f4c40785e693b$var$createTouchEvent(target, e) {
    let clientX = 0;
    let clientY = 0;
    if (e.targetTouches && e.targetTouches.length === 1) {
        clientX = e.targetTouches[0].clientX;
        clientY = e.targetTouches[0].clientY;
    }
    return {
        currentTarget: target,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        clientX: clientX,
        clientY: clientY
    };
}
function $a87f4c40785e693b$var$createEvent(target, e) {
    let clientX = e.clientX;
    let clientY = e.clientY;
    return {
        currentTarget: target,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        clientX: clientX,
        clientY: clientY,
        key: e.key
    };
}
function $a87f4c40785e693b$var$getPointClientRect(point) {
    let offsetX = 0;
    let offsetY = 0;
    if (point.width !== undefined) offsetX = point.width / 2;
    else if (point.radiusX !== undefined) offsetX = point.radiusX;
    if (point.height !== undefined) offsetY = point.height / 2;
    else if (point.radiusY !== undefined) offsetY = point.radiusY;
    return {
        top: point.clientY - offsetY,
        right: point.clientX + offsetX,
        bottom: point.clientY + offsetY,
        left: point.clientX - offsetX
    };
}
function $a87f4c40785e693b$var$areRectanglesOverlapping(a, b) {
    // check if they cannot overlap on x axis
    if (a.left > b.right || b.left > a.right) return false;
    // check if they cannot overlap on y axis
    if (a.top > b.bottom || b.top > a.bottom) return false;
    return true;
}
function $a87f4c40785e693b$var$isOverTarget(point, target) {
    let rect = target.getBoundingClientRect();
    let pointRect = $a87f4c40785e693b$var$getPointClientRect(point);
    return $a87f4c40785e693b$var$areRectanglesOverlapping(rect, pointRect);
}
function $a87f4c40785e693b$var$shouldPreventDefaultUp(target) {
    if (target instanceof HTMLInputElement) return false;
    if (target instanceof HTMLButtonElement) return target.type !== 'submit' && target.type !== 'reset';
    if ($a87f4c40785e693b$var$isHTMLAnchorLink(target)) return false;
    return true;
}
function $a87f4c40785e693b$var$shouldPreventDefaultKeyboard(target, key) {
    if (target instanceof HTMLInputElement) return !$a87f4c40785e693b$var$isValidInputKey(target, key);
    return $a87f4c40785e693b$var$shouldPreventDefaultUp(target);
}
const $a87f4c40785e693b$var$nonTextInputTypes = new Set([
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
function $a87f4c40785e693b$var$isValidInputKey(target, key) {
    // Only space should toggle checkboxes and radios, not enter.
    return target.type === 'checkbox' || target.type === 'radio' ? key === ' ' : $a87f4c40785e693b$var$nonTextInputTypes.has(target.type);
}


export {$a87f4c40785e693b$export$45712eceda6fad21 as usePress};
//# sourceMappingURL=usePress.js.map
