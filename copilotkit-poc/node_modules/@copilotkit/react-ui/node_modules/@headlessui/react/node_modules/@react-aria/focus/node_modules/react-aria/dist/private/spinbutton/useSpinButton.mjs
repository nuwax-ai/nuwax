import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9, clearAnnouncer as $a46cf152bb926da5$export$d10ae4f68404609a} from "../live-announcer/LiveAnnouncer.mjs";
import $bBWcS$intlStringsmjs from "./intlStrings.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useRef as $bBWcS$useRef, useCallback as $bBWcS$useCallback, useEffect as $bBWcS$useEffect, useState as $bBWcS$useState} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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





const $757ec6630f26125c$var$noop = ()=>{};
function $757ec6630f26125c$export$e908e06f4b8e3402(props) {
    const _async = (0, $bBWcS$useRef)(undefined);
    let { value: value, textValue: textValue, minValue: minValue, maxValue: maxValue, isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, onIncrement: onIncrement, onIncrementPage: onIncrementPage, onDecrement: onDecrement, onDecrementPage: onDecrementPage, onDecrementToMin: onDecrementToMin, onIncrementToMax: onIncrementToMax } = props;
    const stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($bBWcS$intlStringsmjs))), '@react-aria/spinbutton');
    let isSpinning = (0, $bBWcS$useRef)(false);
    const clearAsync = (0, $bBWcS$useCallback)(()=>{
        clearTimeout(_async.current);
        isSpinning.current = false;
    }, []);
    const clearAsyncEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(()=>{
        clearAsync();
    });
    (0, $bBWcS$useEffect)(()=>{
        return ()=>clearAsyncEvent();
    }, []);
    let onKeyDown = (e)=>{
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || isReadOnly || e.nativeEvent.isComposing) return;
        switch(e.key){
            case 'PageUp':
                if (onIncrementPage) {
                    e.preventDefault();
                    onIncrementPage?.();
                    break;
                }
            // fallthrough!
            case 'ArrowUp':
            case 'Up':
                if (onIncrement) {
                    e.preventDefault();
                    onIncrement?.();
                }
                break;
            case 'PageDown':
                if (onDecrementPage) {
                    e.preventDefault();
                    onDecrementPage?.();
                    break;
                }
            // fallthrough
            case 'ArrowDown':
            case 'Down':
                if (onDecrement) {
                    e.preventDefault();
                    onDecrement?.();
                }
                break;
            case 'Home':
                if (onDecrementToMin) {
                    e.preventDefault();
                    onDecrementToMin?.();
                }
                break;
            case 'End':
                if (onIncrementToMax) {
                    e.preventDefault();
                    onIncrementToMax?.();
                }
                break;
        }
    };
    let isFocused = (0, $bBWcS$useRef)(false);
    let onFocus = ()=>{
        isFocused.current = true;
    };
    let onBlur = ()=>{
        isFocused.current = false;
    };
    // Replace Unicode hyphen-minus (U+002D) with minus sign (U+2212).
    // This ensures that macOS VoiceOver announces it as "minus" even with other characters between the minus sign
    // and the number (e.g. currency symbol). Otherwise it announces nothing because it assumes the character is a hyphen.
    // In addition, replace the empty string with the word "Empty" so that iOS VoiceOver does not read "50%" for an empty field.
    let ariaTextValue = textValue === '' ? stringFormatter.format('Empty') : (textValue || `${value}`).replace('-', '\u2212');
    (0, $bBWcS$useEffect)(()=>{
        if (isFocused.current) {
            (0, $a46cf152bb926da5$export$d10ae4f68404609a)('assertive');
            (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(ariaTextValue, 'assertive');
        }
    }, [
        ariaTextValue
    ]);
    // For touch users, if they move their finger like they're scrolling, we don't want to trigger a spin.
    let onPointerCancel = (0, $bBWcS$useCallback)(()=>{
        clearAsync();
    }, [
        clearAsync
    ]);
    const onIncrementEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(onIncrement ?? $757ec6630f26125c$var$noop);
    const onDecrementEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(onDecrement ?? $757ec6630f26125c$var$noop);
    const stepUpEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(()=>{
        if (maxValue === undefined || isNaN(maxValue) || value === undefined || isNaN(value) || value < maxValue) {
            onIncrementEvent();
            onIncrementPressStartEvent(60);
        }
    });
    const onIncrementPressStartEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((initialStepDelay)=>{
        clearAsyncEvent();
        isSpinning.current = true;
        // Start spinning after initial delay
        _async.current = window.setTimeout(stepUpEvent, initialStepDelay);
    });
    const stepDownEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(()=>{
        if (minValue === undefined || isNaN(minValue) || value === undefined || isNaN(value) || value > minValue) {
            onDecrementEvent();
            onDecrementPressStartEvent(60);
        }
    });
    const onDecrementPressStartEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((initialStepDelay)=>{
        clearAsyncEvent();
        isSpinning.current = true;
        // Start spinning after initial delay
        _async.current = window.setTimeout(stepDownEvent, initialStepDelay);
    });
    let cancelContextMenu = (e)=>{
        e.preventDefault();
    };
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    // Tracks in touch if the press end event was preceded by a press up.
    // If it wasn't, then we know the finger left the button while still in contact with the screen.
    // This means that the user is trying to scroll or interact in some way that shouldn't trigger
    // an increment or decrement.
    let isUp = (0, $bBWcS$useRef)(false);
    let [isIncrementPressed, setIsIncrementPressed] = (0, $bBWcS$useState)(null);
    (0, $bBWcS$useEffect)(()=>{
        if (isIncrementPressed === 'touch') onIncrementPressStartEvent(600);
        else if (isIncrementPressed) onIncrementPressStartEvent(400);
        else if (!isIncrementPressed) clearAsyncEvent();
    }, [
        isIncrementPressed
    ]);
    let [isDecrementPressed, setIsDecrementPressed] = (0, $bBWcS$useState)(null);
    (0, $bBWcS$useEffect)(()=>{
        if (isDecrementPressed === 'touch') onDecrementPressStartEvent(600);
        else if (isDecrementPressed) onDecrementPressStartEvent(400);
        else if (!isDecrementPressed) clearAsyncEvent();
    }, [
        isDecrementPressed
    ]);
    return {
        spinButtonProps: {
            role: 'spinbutton',
            'aria-valuenow': value !== undefined && !isNaN(value) ? value : undefined,
            'aria-valuetext': ariaTextValue,
            'aria-valuemin': minValue,
            'aria-valuemax': maxValue,
            'aria-disabled': isDisabled || undefined,
            'aria-readonly': isReadOnly || undefined,
            'aria-required': isRequired || undefined,
            onKeyDown: onKeyDown,
            onFocus: onFocus,
            onBlur: onBlur
        },
        incrementButtonProps: {
            onPressStart: (e)=>{
                clearAsync();
                if (e.pointerType !== 'touch') {
                    onIncrement?.();
                    setIsIncrementPressed('mouse');
                } else {
                    addGlobalListener(window, 'pointercancel', onPointerCancel, {
                        capture: true
                    });
                    isUp.current = false;
                    // For touch users, don't trigger a decrement on press start, we'll wait for the press end to trigger it if
                    // the control isn't spinning.
                    setIsIncrementPressed('touch');
                }
                addGlobalListener(window, 'contextmenu', cancelContextMenu);
            },
            onPressUp: (e)=>{
                clearAsync();
                if (e.pointerType === 'touch') isUp.current = true;
                removeAllGlobalListeners();
                setIsIncrementPressed(null);
            },
            onPressEnd: (e)=>{
                clearAsync();
                if (e.pointerType === 'touch') {
                    if (!isSpinning.current && isUp.current) onIncrement?.();
                }
                isUp.current = false;
                setIsIncrementPressed(null);
            },
            onFocus: onFocus,
            onBlur: onBlur
        },
        decrementButtonProps: {
            onPressStart: (e)=>{
                clearAsync();
                if (e.pointerType !== 'touch') {
                    onDecrement?.();
                    setIsDecrementPressed('mouse');
                } else {
                    addGlobalListener(window, 'pointercancel', onPointerCancel, {
                        capture: true
                    });
                    isUp.current = false;
                    // For touch users, don't trigger a decrement on press start, we'll wait for the press end to trigger it if
                    // the control isn't spinning.
                    setIsDecrementPressed('touch');
                }
            },
            onPressUp: (e)=>{
                clearAsync();
                if (e.pointerType === 'touch') isUp.current = true;
                removeAllGlobalListeners();
                setIsDecrementPressed(null);
            },
            onPressEnd: (e)=>{
                clearAsync();
                if (e.pointerType === 'touch') {
                    if (!isSpinning.current && isUp.current) onDecrement?.();
                }
                isUp.current = false;
                setIsDecrementPressed(null);
            },
            onFocus: onFocus,
            onBlur: onBlur
        }
    };
}


export {$757ec6630f26125c$export$e908e06f4b8e3402 as useSpinButton};
//# sourceMappingURL=useSpinButton.mjs.map
