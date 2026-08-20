import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import $6zmuR$intlStringsjs from "./intlStrings.js";
import {isAndroid as $d5a2be505488529f$export$a11b0059900ceec8, isIOS as $d5a2be505488529f$export$fedb369cb70207f1, isIPhone as $d5a2be505488529f$export$186c6964ca17d99} from "../utils/platform.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocus as $a19d0c473b0e0cad$export$f8168d8dd8fd66e6} from "../interactions/useFocus.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useFormattedTextField as $a97100a6dd40f368$export$4f384c9210e583c3} from "../textfield/useFormattedTextField.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useNumberFormatter as $1dc719caba1a3f1f$export$b7a616150fdb9f44} from "../i18n/useNumberFormatter.js";
import {useScrollWheel as $387080635b69cb2d$export$2123ff2b87c81ca} from "../interactions/useScrollWheel.js";
import {useSpinButton as $b36f0efc8d77b16f$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.js";
import {useCallback as $6zmuR$useCallback, useMemo as $6zmuR$useMemo, useState as $6zmuR$useState} from "react";
import {flushSync as $6zmuR$flushSync} from "react-dom";
import {privateValidationStateProp as $6zmuR$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";


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



















function $f5cd4e5cf0095772$export$23f548e970bdf099(props, state, inputRef) {
    let { id: id, decrementAriaLabel: decrementAriaLabel, incrementAriaLabel: incrementAriaLabel, isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, minValue: minValue, maxValue: maxValue, autoFocus: autoFocus, label: label, formatOptions: formatOptions, onBlur: onBlur = ()=>{}, onFocus: onFocus, onFocusChange: onFocusChange, onKeyDown: onKeyDown, onKeyUp: onKeyUp, description: description, errorMessage: errorMessage, isWheelDisabled: isWheelDisabled, ...otherProps } = props;
    let { increment: increment, incrementToMax: incrementToMax, decrement: decrement, decrementToMin: decrementToMin, numberValue: numberValue, inputValue: inputValue, commit: commit, commitValidation: commitValidation } = state;
    const stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($6zmuR$intlStringsjs))), '@react-aria/numberfield');
    let commitAndAnnounce = (0, $6zmuR$useCallback)(()=>{
        var _inputRef_current, _inputRef_current1, _inputRef_current2;
        var _inputRef_current_value;
        let oldValue = (_inputRef_current_value = (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.value) !== null && _inputRef_current_value !== void 0 ? _inputRef_current_value : '';
        // Set input value to normalized valid value
        (0, $6zmuR$flushSync)(()=>{
            commit();
        });
        var _inputRef_current_value1;
        if (((_inputRef_current1 = inputRef.current) === null || _inputRef_current1 === void 0 ? void 0 : _inputRef_current1.value) !== oldValue) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)((_inputRef_current_value1 = (_inputRef_current2 = inputRef.current) === null || _inputRef_current2 === void 0 ? void 0 : _inputRef_current2.value) !== null && _inputRef_current_value1 !== void 0 ? _inputRef_current_value1 : '', 'assertive');
    }, [
        commit,
        inputRef
    ]);
    let inputId = (0, $0292efe68908de6b$export$f680877a34711e37)(id);
    let { focusProps: focusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)({
        onBlur () {
            commitAndAnnounce();
        }
    });
    let numberFormatter = (0, $1dc719caba1a3f1f$export$b7a616150fdb9f44)(formatOptions);
    let intlOptions = (0, $6zmuR$useMemo)(()=>numberFormatter.resolvedOptions(), [
        numberFormatter
    ]);
    // Replace negative textValue formatted using currencySign: 'accounting'
    // with a textValue that can be announced using a minus sign.
    let textValueFormatter = (0, $1dc719caba1a3f1f$export$b7a616150fdb9f44)({
        ...formatOptions,
        currencySign: undefined
    });
    let textValue = (0, $6zmuR$useMemo)(()=>isNaN(numberValue) ? '' : textValueFormatter.format(numberValue), [
        textValueFormatter,
        numberValue
    ]);
    let { spinButtonProps: spinButtonProps, incrementButtonProps: incButtonProps, decrementButtonProps: decButtonProps } = (0, $b36f0efc8d77b16f$export$e908e06f4b8e3402)({
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isRequired: isRequired,
        maxValue: maxValue,
        minValue: minValue,
        onIncrement: increment,
        onIncrementToMax: incrementToMax,
        onDecrement: decrement,
        onDecrementToMin: decrementToMin,
        value: numberValue,
        textValue: textValue
    });
    let [focusWithin, setFocusWithin] = (0, $6zmuR$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $6zmuR$useCallback)((e)=>{
        // if on a trackpad, users can scroll in both X and Y at once, check the magnitude of the change
        // if it's mostly in the X direction, then just return, the user probably doesn't mean to inc/dec
        // this isn't perfect, events come in fast with small deltas and a part of the scroll may give a false indication
        // especially if the user is scrolling near 45deg
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        if (e.deltaY > 0) increment();
        else if (e.deltaY < 0) decrement();
    }, [
        decrement,
        increment
    ]);
    // If the input isn't supposed to receive input, disable scrolling.
    let scrollingDisabled = isWheelDisabled || isDisabled || isReadOnly || !focusWithin;
    (0, $387080635b69cb2d$export$2123ff2b87c81ca)({
        onScroll: onWheel,
        isDisabled: scrollingDisabled
    }, inputRef);
    var _intlOptions_maximumFractionDigits;
    // The inputMode attribute influences the software keyboard that is shown on touch devices.
    // Browsers and operating systems are quite inconsistent about what keys are available, however.
    // We choose between numeric and decimal based on whether we allow negative and fractional numbers,
    // and based on testing on various devices to determine what keys are available in each inputMode.
    let hasDecimals = ((_intlOptions_maximumFractionDigits = intlOptions.maximumFractionDigits) !== null && _intlOptions_maximumFractionDigits !== void 0 ? _intlOptions_maximumFractionDigits : 0) > 0;
    let hasNegative = state.minValue === undefined || isNaN(state.minValue) || state.minValue < 0;
    let inputMode = 'numeric';
    if ((0, $d5a2be505488529f$export$186c6964ca17d99)()) {
        // iPhone doesn't have a minus sign in either numeric or decimal.
        // Note this is only for iPhone, not iPad, which always has both
        // minus and decimal in numeric.
        if (hasNegative) inputMode = 'text';
        else if (hasDecimals) inputMode = 'decimal';
    } else if ((0, $d5a2be505488529f$export$a11b0059900ceec8)()) {
        // Android numeric has both a decimal point and minus key.
        // decimal does not have a minus key.
        if (hasNegative) inputMode = 'numeric';
        else if (hasDecimals) inputMode = 'decimal';
    }
    let onChange = (value)=>{
        if (state.validate(value)) state.setInputValue(value);
    };
    let onPaste = (e)=>{
        var _props_onPaste;
        (_props_onPaste = props.onPaste) === null || _props_onPaste === void 0 ? void 0 : _props_onPaste.call(props, e);
        let inputElement = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        var _inputElement_selectionEnd, _inputElement_selectionStart;
        // we can only handle the case where the paste takes over the entire input, otherwise things get very complicated
        // trying to calculate the new string based on what the paste is replacing and where in the source string it is
        if (inputElement && ((_inputElement_selectionEnd = inputElement.selectionEnd) !== null && _inputElement_selectionEnd !== void 0 ? _inputElement_selectionEnd : -1) - ((_inputElement_selectionStart = inputElement.selectionStart) !== null && _inputElement_selectionStart !== void 0 ? _inputElement_selectionStart : 0) === inputElement.value.length) {
            var _e_clipboardData_getData, _e_clipboardData_getData1, _e_clipboardData;
            e.preventDefault();
            var _e_clipboardData_getData_trim;
            // commit so that the user gets to see what it formats to immediately
            // paste happens before inputRef's value is updated, so have to prevent the default and do it ourselves
            // spin button will then handle announcing the new value, this should work with controlled state as well
            // because the announcement is done as a result of the new rendered input value if there is one
            commit((_e_clipboardData_getData_trim = (_e_clipboardData = e.clipboardData) === null || _e_clipboardData === void 0 ? void 0 : (_e_clipboardData_getData1 = _e_clipboardData.getData) === null || _e_clipboardData_getData1 === void 0 ? void 0 : (_e_clipboardData_getData = _e_clipboardData_getData1.call(_e_clipboardData, 'text/plain')) === null || _e_clipboardData_getData === void 0 ? void 0 : _e_clipboardData_getData.trim()) !== null && _e_clipboardData_getData_trim !== void 0 ? _e_clipboardData_getData_trim : '');
        }
    };
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    let onKeyDownEnter = (0, $6zmuR$useCallback)((e)=>{
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            (0, $6zmuR$flushSync)(()=>{
                commit();
            });
            commitValidation();
        } else e.continuePropagation();
    }, [
        commit,
        commitValidation
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: textFieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $a97100a6dd40f368$export$4f384c9210e583c3)({
        ...otherProps,
        ...domProps,
        // These props are added to a hidden input rather than the formatted textfield.
        name: undefined,
        form: undefined,
        label: label,
        autoFocus: autoFocus,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isRequired: isRequired,
        validate: undefined,
        [(0, $6zmuR$privateValidationStateProp)]: state,
        value: inputValue,
        defaultValue: '!',
        autoComplete: 'off',
        'aria-label': props['aria-label'] || undefined,
        'aria-labelledby': props['aria-labelledby'] || undefined,
        id: inputId,
        type: 'text',
        inputMode: inputMode,
        onChange: onChange,
        onBlur: onBlur,
        onFocus: onFocus,
        onFocusChange: onFocusChange,
        onKeyDown: (0, $6zmuR$useMemo)(()=>(0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(onKeyDownEnter, onKeyDown), [
            onKeyDownEnter,
            onKeyDown
        ]),
        onKeyUp: onKeyUp,
        onPaste: onPaste,
        description: description,
        errorMessage: errorMessage
    }, state, inputRef);
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(inputRef, state.defaultNumberValue, state.setNumberValue);
    $f5cd4e5cf0095772$var$useNativeValidation(state, props.validationBehavior, props.commitBehavior, inputRef, state.minValue, state.maxValue, props.step, state.numberValue);
    let inputProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(spinButtonProps, focusProps, textFieldProps, {
        // override the spinbutton role, we can't focus a spin button with VO
        role: null,
        // ignore aria-roledescription on iOS so that required state will announce when it is present
        'aria-roledescription': !(0, $d5a2be505488529f$export$fedb369cb70207f1)() ? stringFormatter.format('numberField') : null,
        'aria-valuemax': null,
        'aria-valuemin': null,
        'aria-valuenow': null,
        'aria-valuetext': null,
        autoCorrect: 'off',
        spellCheck: 'false'
    });
    if (props.validationBehavior === 'native') inputProps['aria-required'] = undefined;
    let onButtonPressStart = (e)=>{
        var _inputRef_current;
        // If focus is already on the input, keep it there so we don't hide the
        // software keyboard when tapping the increment/decrement buttons.
        if ((0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === inputRef.current) return;
        // Otherwise, when using a mouse, move focus to the input.
        // On touch, or with a screen reader, focus the button so that the software
        // keyboard does not appear and the screen reader cursor is not moved off the button.
        if (e.pointerType === 'mouse') (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.focus();
        else e.target.focus();
    };
    // Determine the label for the increment and decrement buttons. There are 4 cases:
    //
    // 1. With a visible label that is a string: aria-label: `Increase ${props.label}`
    // 2. With a visible label that is JSX: aria-label: 'Increase', aria-labelledby: '${incrementId} ${labelId}'
    // 3. With an aria-label: aria-label: `Increase ${props['aria-label']}`
    // 4. With an aria-labelledby: aria-label: 'Increase', aria-labelledby: `${incrementId} ${props['aria-labelledby']}`
    //
    // (1) and (2) could possibly be combined and both use aria-labelledby. However, placing the label in
    // the aria-label string rather than using aria-labelledby gives more flexibility to translators to change
    // the order or add additional words around the label if needed.
    let fieldLabel = props['aria-label'] || (typeof props.label === 'string' ? props.label : '');
    let ariaLabelledby;
    if (!fieldLabel) ariaLabelledby = props.label != null ? labelProps.id : props['aria-labelledby'];
    let incrementId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let decrementId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let incrementButtonProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(incButtonProps, {
        'aria-label': incrementAriaLabel || stringFormatter.format('increase', {
            fieldLabel: fieldLabel
        }).trim(),
        id: ariaLabelledby && !incrementAriaLabel ? incrementId : null,
        'aria-labelledby': ariaLabelledby && !incrementAriaLabel ? `${incrementId} ${ariaLabelledby}` : null,
        'aria-controls': inputId,
        excludeFromTabOrder: true,
        preventFocusOnPress: true,
        allowFocusWhenDisabled: true,
        isDisabled: !state.canIncrement,
        onPressStart: onButtonPressStart
    });
    let decrementButtonProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(decButtonProps, {
        'aria-label': decrementAriaLabel || stringFormatter.format('decrease', {
            fieldLabel: fieldLabel
        }).trim(),
        id: ariaLabelledby && !decrementAriaLabel ? decrementId : null,
        'aria-labelledby': ariaLabelledby && !decrementAriaLabel ? `${decrementId} ${ariaLabelledby}` : null,
        'aria-controls': inputId,
        excludeFromTabOrder: true,
        preventFocusOnPress: true,
        allowFocusWhenDisabled: true,
        isDisabled: !state.canDecrement,
        onPressStart: onButtonPressStart
    });
    return {
        groupProps: {
            ...focusWithinProps,
            role: 'group',
            'aria-disabled': isDisabled,
            'aria-invalid': isInvalid ? 'true' : undefined
        },
        labelProps: labelProps,
        inputProps: inputProps,
        incrementButtonProps: incrementButtonProps,
        decrementButtonProps: decrementButtonProps,
        errorMessageProps: errorMessageProps,
        descriptionProps: descriptionProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}
let $f5cd4e5cf0095772$var$numberInput = null;
function $f5cd4e5cf0095772$var$useNativeValidation(state, validationBehavior, commitBehavior, inputRef, min, max, step, value) {
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        let input = inputRef.current;
        if (commitBehavior !== 'validate' || state.realtimeValidation.isInvalid || !input || input.disabled) return;
        // Create a native number input and use it to implement validation of min/max/step.
        // This lets us get the native validation message provided by the browser instead of needing our own translations.
        if (!$f5cd4e5cf0095772$var$numberInput && typeof document !== 'undefined') {
            $f5cd4e5cf0095772$var$numberInput = document.createElement('input');
            $f5cd4e5cf0095772$var$numberInput.type = 'number';
        }
        if (!$f5cd4e5cf0095772$var$numberInput) // For TypeScript.
        return;
        $f5cd4e5cf0095772$var$numberInput.min = min != null && !isNaN(min) ? String(min) : '';
        $f5cd4e5cf0095772$var$numberInput.max = max != null && !isNaN(max) ? String(max) : '';
        $f5cd4e5cf0095772$var$numberInput.step = step != null && !isNaN(step) ? String(step) : '';
        $f5cd4e5cf0095772$var$numberInput.value = value != null && !isNaN(value) ? String(value) : '';
        // Merge validity with the visible text input (for other validations like required).
        let valid = input.validity.valid && $f5cd4e5cf0095772$var$numberInput.validity.valid;
        let validationMessage = input.validationMessage || $f5cd4e5cf0095772$var$numberInput.validationMessage;
        let validity = {
            isInvalid: !valid,
            validationErrors: validationMessage ? [
                validationMessage
            ] : [],
            validationDetails: {
                badInput: input.validity.badInput,
                customError: input.validity.customError,
                patternMismatch: input.validity.patternMismatch,
                rangeOverflow: $f5cd4e5cf0095772$var$numberInput.validity.rangeOverflow,
                rangeUnderflow: $f5cd4e5cf0095772$var$numberInput.validity.rangeUnderflow,
                stepMismatch: $f5cd4e5cf0095772$var$numberInput.validity.stepMismatch,
                tooLong: input.validity.tooLong,
                tooShort: input.validity.tooShort,
                typeMismatch: input.validity.typeMismatch,
                valueMissing: input.validity.valueMissing,
                valid: valid
            }
        };
        state.updateValidation(validity);
        // Block form submission if validation behavior is native.
        // This won't overwrite any user-defined validation message because we checked realtimeValidation above.
        if (validationBehavior === 'native' && !$f5cd4e5cf0095772$var$numberInput.validity.valid) input.setCustomValidity($f5cd4e5cf0095772$var$numberInput.validationMessage);
    });
}


export {$f5cd4e5cf0095772$export$23f548e970bdf099 as useNumberField};
//# sourceMappingURL=useNumberField.js.map
