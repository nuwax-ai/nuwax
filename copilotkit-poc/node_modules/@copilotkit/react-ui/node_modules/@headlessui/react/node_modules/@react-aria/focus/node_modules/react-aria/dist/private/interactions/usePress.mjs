import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {createSyntheticEvent as $a92dc41f639950be$export$525bc4921d56d4a, preventFocus as $a92dc41f639950be$export$cabe61c495ee3649, setEventTarget as $a92dc41f639950be$export$c2b7abe5d61ec696} from "./utils.mjs";
import {disableTextSelection as $cbf007e418543821$export$16a4697467175487, restoreTextSelection as $cbf007e418543821$export$b0d6fa1ab32e3295} from "./textSelection.mjs";
import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getNonce as $2b2d34ff061957fb$export$2b85b721e524d74b} from "../utils/getNonce.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "../utils/platform.mjs";
import {isVirtualClick as $b5c62b033c25b96d$export$60278871457622de, isVirtualPointerEvent as $b5c62b033c25b96d$export$29bf1b5f2c56cf63} from "../utils/isVirtualEvent.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {openLink as $caaf0dd3060ed57c$export$95185d699e05d4d7} from "../utils/openLink.mjs";
import {PressResponderContext as $24f9a20f226ad820$export$5165eccb35aaadb5} from "./context.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useSyncRef as $b7115c395c64f7b5$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.mjs";
import {flushSync as $fL2C6$flushSync} from "react-dom";
import {useContext as $fL2C6$useContext, useState as $fL2C6$useState, useRef as $fL2C6$useRef, useCallback as $fL2C6$useCallback, useEffect as $fL2C6$useEffect, useMemo as $fL2C6$useMemo} from "react";

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

















function $d27d541f9569d26d$var$usePressResponderContext(props) {
    // Consume context from <PressResponder> and merge with props.
    let context = (0, $fL2C6$useContext)((0, $24f9a20f226ad820$export$5165eccb35aaadb5));
    if (context) {
        // Prevent mergeProps from merging ref.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let { register: register, ref: ref, ...contextProps } = context;
        props = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(contextProps, props);
        register();
    }
    (0, $b7115c395c64f7b5$export$4debdb1a3f0fa79e)(context, props.ref);
    return props;
}
class $d27d541f9569d26d$var$PressEvent {
    #shouldStopPropagation;
    constructor(type, pointerType, originalEvent, state){
        this.#shouldStopPropagation = true;
        let currentTarget = state?.target ?? originalEvent.currentTarget;
        const rect = currentTarget?.getBoundingClientRect();
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
    continuePropagation() {
        this.#shouldStopPropagation = false;
    }
    get shouldStopPropagation() {
        return this.#shouldStopPropagation;
    }
}
const $d27d541f9569d26d$var$LINK_CLICKED = Symbol('linkClicked');
const $d27d541f9569d26d$var$STYLE_ID = 'react-aria-pressable-style';
const $d27d541f9569d26d$var$PRESSABLE_ATTRIBUTE = 'data-react-aria-pressable';
function $d27d541f9569d26d$export$45712eceda6fad21(props) {
    let { onPress: onPress, onPressChange: onPressChange, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressUp: onPressUp, onClick: onClick, isDisabled: isDisabled, isPressed: isPressedProp, preventFocusOnPress: preventFocusOnPress, shouldCancelOnPointerExit: shouldCancelOnPointerExit, allowTextSelectionOnPress: allowTextSelectionOnPress, ref: domRef, ...domProps } = $d27d541f9569d26d$var$usePressResponderContext(props);
    let [isPressed, setPressed] = (0, $fL2C6$useState)(false);
    let ref = (0, $fL2C6$useRef)({
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
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let triggerPressStart = (0, $fL2C6$useCallback)((originalEvent, pointerType)=>{
        let state = ref.current;
        if (isDisabled || state.didFirePressStart) return false;
        let shouldStopPropagation = true;
        state.isTriggeringEvent = true;
        if (onPressStart) {
            let event = new $d27d541f9569d26d$var$PressEvent('pressstart', pointerType, originalEvent);
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
    let triggerPressEnd = (0, $fL2C6$useCallback)((originalEvent, pointerType, wasPressed = true)=>{
        let state = ref.current;
        if (!state.didFirePressStart) return false;
        state.didFirePressStart = false;
        state.isTriggeringEvent = true;
        let shouldStopPropagation = true;
        if (onPressEnd) {
            let event = new $d27d541f9569d26d$var$PressEvent('pressend', pointerType, originalEvent);
            onPressEnd(event);
            shouldStopPropagation = event.shouldStopPropagation;
        }
        if (onPressChange) onPressChange(false);
        setPressed(false);
        if (onPress && wasPressed && !isDisabled) {
            let event = new $d27d541f9569d26d$var$PressEvent('press', pointerType, originalEvent);
            onPress(event);
            shouldStopPropagation &&= event.shouldStopPropagation;
        }
        state.isTriggeringEvent = false;
        return shouldStopPropagation;
    }, [
        isDisabled,
        onPressEnd,
        onPressChange,
        onPress
    ]);
    let triggerPressEndEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(triggerPressEnd);
    let triggerPressUp = (0, $fL2C6$useCallback)((originalEvent, pointerType)=>{
        let state = ref.current;
        if (isDisabled) return false;
        if (onPressUp) {
            state.isTriggeringEvent = true;
            let event = new $d27d541f9569d26d$var$PressEvent('pressup', pointerType, originalEvent);
            onPressUp(event);
            state.isTriggeringEvent = false;
            return event.shouldStopPropagation;
        }
        return true;
    }, [
        isDisabled,
        onPressUp
    ]);
    let triggerPressUpEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(triggerPressUp);
    let cancel = (0, $fL2C6$useCallback)((e)=>{
        let state = ref.current;
        if (state.isPressed && state.target) {
            if (state.didFirePressStart && state.pointerType != null) triggerPressEnd($d27d541f9569d26d$var$createEvent(state.target, e), state.pointerType, false);
            state.isPressed = false;
            state.isOverTarget = false;
            state.activePointerId = null;
            state.pointerType = null;
            removeAllGlobalListeners();
            if (!allowTextSelectionOnPress) (0, $cbf007e418543821$export$b0d6fa1ab32e3295)(state.target);
            for (let dispose of state.disposables)dispose();
            state.disposables = [];
        }
    }, [
        allowTextSelectionOnPress,
        removeAllGlobalListeners,
        triggerPressEnd
    ]);
    let cancelEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(cancel);
    (0, $fL2C6$useEffect)(()=>{
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
    let cancelOnPointerExit = (0, $fL2C6$useCallback)((e)=>{
        if (shouldCancelOnPointerExit) cancel(e);
    }, [
        shouldCancelOnPointerExit,
        cancel
    ]);
    let triggerClick = (0, $fL2C6$useCallback)((e)=>{
        if (isDisabled) return;
        onClick?.(e);
    }, [
        isDisabled,
        onClick
    ]);
    let triggerSyntheticClick = (0, $fL2C6$useCallback)((e, target)=>{
        if (isDisabled) return;
        // Some third-party libraries pass in onClick instead of onPress.
        // Create a fake mouse event and trigger onClick as well.
        // This matches the browser's native activation behavior for certain elements (e.g. button).
        // https://html.spec.whatwg.org/#activation
        // https://html.spec.whatwg.org/#fire-a-synthetic-pointer-event
        if (onClick) {
            let event = new MouseEvent('click', e);
            (0, $a92dc41f639950be$export$c2b7abe5d61ec696)(event, target);
            onClick((0, $a92dc41f639950be$export$525bc4921d56d4a)(event));
        }
    }, [
        isDisabled,
        onClick
    ]);
    let pressProps = (0, $fL2C6$useMemo)(()=>{
        let state = ref.current;
        let pressProps = {
            onKeyDown (e) {
                if ($d27d541f9569d26d$var$isValidKeyboardEvent(e.nativeEvent, e.currentTarget) && (0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
                    if ($d27d541f9569d26d$var$shouldPreventDefaultKeyboard((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), e.key)) e.preventDefault();
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
                        if ($d27d541f9569d26d$var$isValidKeyboardEvent(e, originalTarget) && !e.repeat && (0, $23f2114a1b82827e$export$4282f70798064fe0)(originalTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) && state.target) // eslint-disable-next-line react-hooks/rules-of-hooks
                        triggerPressUpEvent($d27d541f9569d26d$var$createEvent(state.target, e), 'keyboard');
                    };
                    addGlobalListener((0, $d447af545b77c9f1$export$b204af158042fbac)(e.currentTarget), 'keyup', (0, $a4e76a5424781910$export$e08e3b67e392101e)(pressUp, onKeyUp), true);
                    if (shouldStopPropagation) e.stopPropagation();
                    // Keep track of the keydown events that occur while the Meta (e.g. Command) key is held.
                    // macOS has a bug where keyup events are not fired while the Meta key is down.
                    // When the Meta key itself is released we will get an event for that, and we'll act as if
                    // all of these other keys were released as well.
                    // https://bugs.chromium.org/p/chromium/issues/detail?id=1393524
                    // https://bugs.webkit.org/show_bug.cgi?id=55291
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=1299553
                    if (e.metaKey && (0, $2add3ce32c6007eb$export$9ac100e40613ea10)()) state.metaKeyEvents?.set(e.key, e.nativeEvent);
                } else if (e.key === 'Meta') state.metaKeyEvents = new Map();
            },
            onClick (e) {
                if (e && !(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                if (e && e.button === 0 && !state.isTriggeringEvent && !(0, $caaf0dd3060ed57c$export$95185d699e05d4d7).isOpening) {
                    let shouldStopPropagation = true;
                    if (isDisabled) e.preventDefault();
                    // If triggered from a screen reader or by using element.click(),
                    // trigger as if it were a keyboard click.
                    if (!state.ignoreEmulatedMouseEvents && !state.isPressed && (state.pointerType === 'virtual' || (0, $b5c62b033c25b96d$export$60278871457622de)(e.nativeEvent))) {
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
                        let stopPressUp = triggerPressUpEvent($d27d541f9569d26d$var$createEvent(e.currentTarget, e), pointerType);
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        let stopPressEnd = triggerPressEndEvent($d27d541f9569d26d$var$createEvent(e.currentTarget, e), pointerType, true);
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
            if (state.isPressed && state.target && $d27d541f9569d26d$var$isValidKeyboardEvent(e, state.target)) {
                if ($d27d541f9569d26d$var$shouldPreventDefaultKeyboard((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), e.key)) e.preventDefault();
                let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
                let wasPressed = (0, $23f2114a1b82827e$export$4282f70798064fe0)(state.target, target);
                // eslint-disable-next-line react-hooks/rules-of-hooks
                triggerPressEndEvent($d27d541f9569d26d$var$createEvent(state.target, e), 'keyboard', wasPressed);
                if (wasPressed) triggerSyntheticClick(e, state.target);
                removeAllGlobalListeners();
                // If a link was triggered with a key other than Enter, open the URL ourselves.
                // This means the link has a role override, and the default browser behavior
                // only applies when using the Enter key.
                if (e.key !== 'Enter' && $d27d541f9569d26d$var$isHTMLAnchorLink(state.target) && (0, $23f2114a1b82827e$export$4282f70798064fe0)(state.target, target) && !e[$d27d541f9569d26d$var$LINK_CLICKED]) {
                    // Store a hidden property on the event so we only trigger link click once,
                    // even if there are multiple usePress instances attached to the element.
                    e[$d27d541f9569d26d$var$LINK_CLICKED] = true;
                    (0, $caaf0dd3060ed57c$export$95185d699e05d4d7)(state.target, e, false);
                }
                state.isPressed = false;
                state.metaKeyEvents?.delete(e.key);
            } else if (e.key === 'Meta' && state.metaKeyEvents?.size) {
                // If we recorded keydown events that occurred while the Meta key was pressed,
                // and those haven't received keyup events already, fire keyup events ourselves.
                // See comment above for more info about the macOS bug causing this.
                let events = state.metaKeyEvents;
                state.metaKeyEvents = undefined;
                for (let event of events.values())state.target?.dispatchEvent(new KeyboardEvent('keyup', event));
            }
        };
        if (typeof PointerEvent !== 'undefined') {
            pressProps.onPointerDown = (e)=>{
                // Only handle left clicks, and ignore events that bubbled through portals.
                if (e.button !== 0 || !(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                // iOS safari fires pointer events from VoiceOver with incorrect coordinates/target.
                // Ignore and let the onClick handler take care of it instead.
                // https://bugs.webkit.org/show_bug.cgi?id=222627
                // https://bugs.webkit.org/show_bug.cgi?id=223202
                if ((0, $b5c62b033c25b96d$export$29bf1b5f2c56cf63)(e.nativeEvent)) {
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
                    if (!allowTextSelectionOnPress) (0, $cbf007e418543821$export$16a4697467175487)(state.target);
                    shouldStopPropagation = triggerPressStart(e, state.pointerType);
                    // Release pointer capture so that touch interactions can leave the original target.
                    // This enables onPointerLeave and onPointerEnter to fire.
                    let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
                    if ('releasePointerCapture' in target) {
                        if ('hasPointerCapture' in target) {
                            if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
                        } else target.releasePointerCapture(e.pointerId);
                    }
                    addGlobalListener((0, $d447af545b77c9f1$export$b204af158042fbac)(e.currentTarget), 'pointerup', onPointerUp, false);
                    addGlobalListener((0, $d447af545b77c9f1$export$b204af158042fbac)(e.currentTarget), 'pointercancel', onPointerCancel, false);
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onMouseDown = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                if (e.button === 0) {
                    if (preventFocusOnPress) {
                        let dispose = (0, $a92dc41f639950be$export$cabe61c495ee3649)(e.target);
                        if (dispose) state.disposables.push(dispose);
                    }
                    e.stopPropagation();
                }
            };
            pressProps.onPointerUp = (e)=>{
                // iOS fires pointerup with zero width and height, so check the pointerType recorded during pointerdown.
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) || state.pointerType === 'virtual') return;
                // Only handle left clicks. If isPressed is true, delay until onClick.
                if (e.button === 0 && !state.isPressed) // eslint-disable-next-line react-hooks/rules-of-hooks
                triggerPressUpEvent(e, state.pointerType || e.pointerType);
            };
            pressProps.onPointerEnter = (e)=>{
                if (e.pointerId === state.activePointerId && state.target && !state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = true;
                    triggerPressStart($d27d541f9569d26d$var$createEvent(state.target, e), state.pointerType);
                }
            };
            pressProps.onPointerLeave = (e)=>{
                if (e.pointerId === state.activePointerId && state.target && state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = false;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    triggerPressEndEvent($d27d541f9569d26d$var$createEvent(state.target, e), state.pointerType, false);
                    cancelOnPointerExit(e);
                }
            };
            let onPointerUp = (e)=>{
                if (e.pointerId === state.activePointerId && state.isPressed && e.button === 0 && state.target) {
                    if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(state.target, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) && state.pointerType != null) {
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
                                    (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(state.target);
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
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                // Safari does not call onPointerCancel when a drag starts, whereas Chrome and Firefox do.
                // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
            };
        } else if (process.env.NODE_ENV === 'test') {
            // NOTE: this fallback branch is entirely used by unit tests.
            // All browsers now support pointer events, but JSDOM still does not.
            pressProps.onMouseDown = (e)=>{
                // Only handle left clicks
                if (e.button !== 0 || !(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                if (state.ignoreEmulatedMouseEvents) {
                    e.stopPropagation();
                    return;
                }
                state.isPressed = true;
                state.isOverTarget = true;
                state.target = e.currentTarget;
                state.pointerType = (0, $b5c62b033c25b96d$export$60278871457622de)(e.nativeEvent) ? 'virtual' : 'mouse';
                // Flush sync so that focus moved during react re-renders occurs before we yield back to the browser.
                let shouldStopPropagation = (0, $fL2C6$flushSync)(()=>triggerPressStart(e, state.pointerType));
                if (shouldStopPropagation) e.stopPropagation();
                if (preventFocusOnPress) {
                    let dispose = (0, $a92dc41f639950be$export$cabe61c495ee3649)(e.target);
                    if (dispose) state.disposables.push(dispose);
                }
                addGlobalListener((0, $d447af545b77c9f1$export$b204af158042fbac)(e.currentTarget), 'mouseup', onMouseUp, false);
            };
            pressProps.onMouseEnter = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                let shouldStopPropagation = true;
                if (state.isPressed && !state.ignoreEmulatedMouseEvents && state.pointerType != null) {
                    state.isOverTarget = true;
                    shouldStopPropagation = triggerPressStart(e, state.pointerType);
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onMouseLeave = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
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
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
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
                if (state.target && (0, $23f2114a1b82827e$export$4282f70798064fe0)(state.target, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) && state.pointerType != null) ;
                else // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent(e);
                state.isOverTarget = false;
            };
            pressProps.onTouchStart = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                let touch = $d27d541f9569d26d$var$getTouchFromEvent(e.nativeEvent);
                if (!touch) return;
                state.activePointerId = touch.identifier;
                state.ignoreEmulatedMouseEvents = true;
                state.isOverTarget = true;
                state.isPressed = true;
                state.target = e.currentTarget;
                state.pointerType = 'touch';
                if (!allowTextSelectionOnPress) (0, $cbf007e418543821$export$16a4697467175487)(state.target);
                let shouldStopPropagation = triggerPressStart($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType);
                if (shouldStopPropagation) e.stopPropagation();
                addGlobalListener((0, $d447af545b77c9f1$export$f21a1ffae260145a)(e.currentTarget), 'scroll', onScroll, true);
            };
            pressProps.onTouchMove = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                if (!state.isPressed) {
                    e.stopPropagation();
                    return;
                }
                let touch = $d27d541f9569d26d$var$getTouchById(e.nativeEvent, state.activePointerId);
                let shouldStopPropagation = true;
                if (touch && $d27d541f9569d26d$var$isOverTarget(touch, e.currentTarget)) {
                    if (!state.isOverTarget && state.pointerType != null) {
                        state.isOverTarget = true;
                        shouldStopPropagation = triggerPressStart($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType);
                    }
                } else if (state.isOverTarget && state.pointerType != null) {
                    state.isOverTarget = false;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    shouldStopPropagation = triggerPressEndEvent($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType, false);
                    cancelOnPointerExit($d27d541f9569d26d$var$createTouchEvent(state.target, e));
                }
                if (shouldStopPropagation) e.stopPropagation();
            };
            pressProps.onTouchEnd = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                if (!state.isPressed) {
                    e.stopPropagation();
                    return;
                }
                let touch = $d27d541f9569d26d$var$getTouchById(e.nativeEvent, state.activePointerId);
                let shouldStopPropagation = true;
                if (touch && $d27d541f9569d26d$var$isOverTarget(touch, e.currentTarget) && state.pointerType != null) {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    triggerPressUpEvent($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType);
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    shouldStopPropagation = triggerPressEndEvent($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType);
                    triggerSyntheticClick(e.nativeEvent, state.target);
                } else if (state.isOverTarget && state.pointerType != null) // eslint-disable-next-line react-hooks/rules-of-hooks
                shouldStopPropagation = triggerPressEndEvent($d27d541f9569d26d$var$createTouchEvent(state.target, e), state.pointerType, false);
                if (shouldStopPropagation) e.stopPropagation();
                state.isPressed = false;
                state.activePointerId = null;
                state.isOverTarget = false;
                state.ignoreEmulatedMouseEvents = true;
                if (state.target && !allowTextSelectionOnPress) (0, $cbf007e418543821$export$b0d6fa1ab32e3295)(state.target);
                removeAllGlobalListeners();
            };
            pressProps.onTouchCancel = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
                e.stopPropagation();
                if (state.isPressed) // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent($d27d541f9569d26d$var$createTouchEvent(state.target, e));
            };
            let onScroll = (e)=>{
                if (state.isPressed && (0, $23f2114a1b82827e$export$4282f70798064fe0)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), state.target)) // eslint-disable-next-line react-hooks/rules-of-hooks
                cancelEvent({
                    currentTarget: state.target,
                    shiftKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    altKey: false
                });
            };
            pressProps.onDragStart = (e)=>{
                if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
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
    (0, $fL2C6$useEffect)(()=>{
        if (!domRef || process.env.NODE_ENV === 'test') return;
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(domRef.current);
        if (!ownerDocument || !ownerDocument.head || ownerDocument.getElementById($d27d541f9569d26d$var$STYLE_ID)) return;
        const style = ownerDocument.createElement('style');
        style.id = $d27d541f9569d26d$var$STYLE_ID;
        let nonce = (0, $2b2d34ff061957fb$export$2b85b721e524d74b)(ownerDocument);
        if (nonce) style.nonce = nonce;
        // touchAction: 'manipulation' is supposed to be equivalent, but in
        // Safari it causes onPointerCancel not to fire on scroll.
        // https://bugs.webkit.org/show_bug.cgi?id=240917
        style.textContent = `
@layer {
  [${$d27d541f9569d26d$var$PRESSABLE_ATTRIBUTE}] {
    touch-action: pan-x pan-y pinch-zoom;
  }
}
    `.trim();
        ownerDocument.head.prepend(style);
    }, [
        domRef
    ]);
    // Remove user-select: none in case component unmounts immediately after pressStart
    (0, $fL2C6$useEffect)(()=>{
        let state = ref.current;
        return ()=>{
            if (!allowTextSelectionOnPress) (0, $cbf007e418543821$export$b0d6fa1ab32e3295)(state.target ?? undefined);
            for (let dispose of state.disposables)dispose();
            state.disposables = [];
        };
    }, [
        allowTextSelectionOnPress
    ]);
    return {
        isPressed: isPressedProp || isPressed,
        pressProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, pressProps, {
            [$d27d541f9569d26d$var$PRESSABLE_ATTRIBUTE]: true
        })
    };
}
function $d27d541f9569d26d$var$isHTMLAnchorLink(target) {
    return target.tagName === 'A' && target.hasAttribute('href');
}
function $d27d541f9569d26d$var$isValidKeyboardEvent(event, currentTarget) {
    const { key: key, code: code } = event;
    const element = currentTarget;
    const role = element.getAttribute('role');
    // Accessibility for keyboards. Space and Enter only.
    // "Spacebar" is for IE 11
    return (key === 'Enter' || key === ' ' || key === 'Spacebar' || code === 'Space') && !(element instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element).HTMLInputElement && !$d27d541f9569d26d$var$isValidInputKey(element, key) || element instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element).HTMLTextAreaElement || element.isContentEditable) && // Links should only trigger with Enter key
    !((role === 'link' || !role && $d27d541f9569d26d$var$isHTMLAnchorLink(element)) && key !== 'Enter');
}
function $d27d541f9569d26d$var$getTouchFromEvent(event) {
    const { targetTouches: targetTouches } = event;
    if (targetTouches.length > 0) return targetTouches[0];
    return null;
}
function $d27d541f9569d26d$var$getTouchById(event, pointerId) {
    const changedTouches = event.changedTouches;
    for(let i = 0; i < changedTouches.length; i++){
        const touch = changedTouches[i];
        if (touch.identifier === pointerId) return touch;
    }
    return null;
}
function $d27d541f9569d26d$var$createTouchEvent(target, e) {
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
function $d27d541f9569d26d$var$createEvent(target, e) {
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
function $d27d541f9569d26d$var$getPointClientRect(point) {
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
function $d27d541f9569d26d$var$areRectanglesOverlapping(a, b) {
    // check if they cannot overlap on x axis
    if (a.left > b.right || b.left > a.right) return false;
    // check if they cannot overlap on y axis
    if (a.top > b.bottom || b.top > a.bottom) return false;
    return true;
}
function $d27d541f9569d26d$var$isOverTarget(point, target) {
    let rect = target.getBoundingClientRect();
    let pointRect = $d27d541f9569d26d$var$getPointClientRect(point);
    return $d27d541f9569d26d$var$areRectanglesOverlapping(rect, pointRect);
}
function $d27d541f9569d26d$var$shouldPreventDefaultUp(target) {
    if (target instanceof HTMLInputElement) return false;
    if (target instanceof HTMLButtonElement) return target.type !== 'submit' && target.type !== 'reset';
    if ($d27d541f9569d26d$var$isHTMLAnchorLink(target)) return false;
    return true;
}
function $d27d541f9569d26d$var$shouldPreventDefaultKeyboard(target, key) {
    if (target instanceof HTMLInputElement) return !$d27d541f9569d26d$var$isValidInputKey(target, key);
    return $d27d541f9569d26d$var$shouldPreventDefaultUp(target);
}
const $d27d541f9569d26d$var$nonTextInputTypes = new Set([
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
function $d27d541f9569d26d$var$isValidInputKey(target, key) {
    // Only space should toggle checkboxes and radios, not enter.
    return target.type === 'checkbox' || target.type === 'radio' ? key === ' ' : $d27d541f9569d26d$var$nonTextInputTypes.has(target.type);
}


export {$d27d541f9569d26d$export$45712eceda6fad21 as usePress};
//# sourceMappingURL=usePress.mjs.map
