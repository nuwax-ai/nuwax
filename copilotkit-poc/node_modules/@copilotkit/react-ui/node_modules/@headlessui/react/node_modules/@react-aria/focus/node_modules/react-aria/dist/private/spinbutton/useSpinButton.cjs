var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $ef060905ca0063f8$exports = require("./intlStrings.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $04affd2086a7db64$exports = require("../utils/useGlobalListeners.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $i5stR$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSpinButton", function () { return $fcf004be7e8533a5$export$e908e06f4b8e3402; });
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





const $fcf004be7e8533a5$var$noop = ()=>{};
function $fcf004be7e8533a5$export$e908e06f4b8e3402(props) {
    const _async = (0, $i5stR$react.useRef)(undefined);
    let { value: value, textValue: textValue, minValue: minValue, maxValue: maxValue, isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, onIncrement: onIncrement, onIncrementPage: onIncrementPage, onDecrement: onDecrement, onDecrementPage: onDecrementPage, onDecrementToMin: onDecrementToMin, onIncrementToMax: onIncrementToMax } = props;
    const stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($ef060905ca0063f8$exports))), '@react-aria/spinbutton');
    let isSpinning = (0, $i5stR$react.useRef)(false);
    const clearAsync = (0, $i5stR$react.useCallback)(()=>{
        clearTimeout(_async.current);
        isSpinning.current = false;
    }, []);
    const clearAsyncEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>{
        clearAsync();
    });
    (0, $i5stR$react.useEffect)(()=>{
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
    let isFocused = (0, $i5stR$react.useRef)(false);
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
    (0, $i5stR$react.useEffect)(()=>{
        if (isFocused.current) {
            (0, $74b2c5b1e7ea9589$exports.clearAnnouncer)('assertive');
            (0, $74b2c5b1e7ea9589$exports.announce)(ariaTextValue, 'assertive');
        }
    }, [
        ariaTextValue
    ]);
    // For touch users, if they move their finger like they're scrolling, we don't want to trigger a spin.
    let onPointerCancel = (0, $i5stR$react.useCallback)(()=>{
        clearAsync();
    }, [
        clearAsync
    ]);
    const onIncrementEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(onIncrement ?? $fcf004be7e8533a5$var$noop);
    const onDecrementEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(onDecrement ?? $fcf004be7e8533a5$var$noop);
    const stepUpEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>{
        if (maxValue === undefined || isNaN(maxValue) || value === undefined || isNaN(value) || value < maxValue) {
            onIncrementEvent();
            onIncrementPressStartEvent(60);
        }
    });
    const onIncrementPressStartEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((initialStepDelay)=>{
        clearAsyncEvent();
        isSpinning.current = true;
        // Start spinning after initial delay
        _async.current = window.setTimeout(stepUpEvent, initialStepDelay);
    });
    const stepDownEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>{
        if (minValue === undefined || isNaN(minValue) || value === undefined || isNaN(value) || value > minValue) {
            onDecrementEvent();
            onDecrementPressStartEvent(60);
        }
    });
    const onDecrementPressStartEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((initialStepDelay)=>{
        clearAsyncEvent();
        isSpinning.current = true;
        // Start spinning after initial delay
        _async.current = window.setTimeout(stepDownEvent, initialStepDelay);
    });
    let cancelContextMenu = (e)=>{
        e.preventDefault();
    };
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $04affd2086a7db64$exports.useGlobalListeners)();
    // Tracks in touch if the press end event was preceded by a press up.
    // If it wasn't, then we know the finger left the button while still in contact with the screen.
    // This means that the user is trying to scroll or interact in some way that shouldn't trigger
    // an increment or decrement.
    let isUp = (0, $i5stR$react.useRef)(false);
    let [isIncrementPressed, setIsIncrementPressed] = (0, $i5stR$react.useState)(null);
    (0, $i5stR$react.useEffect)(()=>{
        if (isIncrementPressed === 'touch') onIncrementPressStartEvent(600);
        else if (isIncrementPressed) onIncrementPressStartEvent(400);
        else if (!isIncrementPressed) clearAsyncEvent();
    }, [
        isIncrementPressed
    ]);
    let [isDecrementPressed, setIsDecrementPressed] = (0, $i5stR$react.useState)(null);
    (0, $i5stR$react.useEffect)(()=>{
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


//# sourceMappingURL=useSpinButton.cjs.map
