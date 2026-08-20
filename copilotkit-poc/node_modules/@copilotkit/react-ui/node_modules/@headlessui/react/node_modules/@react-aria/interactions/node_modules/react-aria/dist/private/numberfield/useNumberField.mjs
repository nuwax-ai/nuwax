import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import $jCxNY$intlStringsmjs from "./intlStrings.mjs";
import {isAndroid as $2add3ce32c6007eb$export$a11b0059900ceec8, isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1, isIPhone as $2add3ce32c6007eb$export$186c6964ca17d99} from "../utils/platform.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocus as $1e74c67db218ce67$export$f8168d8dd8fd66e6} from "../interactions/useFocus.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useFormattedTextField as $62888b2ec35be488$export$4f384c9210e583c3} from "../textfield/useFormattedTextField.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useNumberFormatter as $bd90acf18e792be6$export$b7a616150fdb9f44} from "../i18n/useNumberFormatter.mjs";
import {useScrollWheel as $14554ba6a2007b17$export$2123ff2b87c81ca} from "../interactions/useScrollWheel.mjs";
import {useSpinButton as $757ec6630f26125c$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.mjs";
import {useCallback as $jCxNY$useCallback, useMemo as $jCxNY$useMemo, useState as $jCxNY$useState} from "react";
import {flushSync as $jCxNY$flushSync} from "react-dom";
import {privateValidationStateProp as $jCxNY$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";


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



















function $cd2fa56213693c5e$export$23f548e970bdf099(props, state, inputRef) {
    let { id: id, decrementAriaLabel: decrementAriaLabel, incrementAriaLabel: incrementAriaLabel, isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, minValue: minValue, maxValue: maxValue, autoFocus: autoFocus, label: label, formatOptions: formatOptions, onBlur: onBlur = ()=>{}, onFocus: onFocus, onFocusChange: onFocusChange, onKeyDown: onKeyDown, onKeyUp: onKeyUp, description: description, errorMessage: errorMessage, isWheelDisabled: isWheelDisabled, ...otherProps } = props;
    let { increment: increment, incrementToMax: incrementToMax, decrement: decrement, decrementToMin: decrementToMin, numberValue: numberValue, inputValue: inputValue, commit: commit, commitValidation: commitValidation } = state;
    const stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($jCxNY$intlStringsmjs))), '@react-aria/numberfield');
    let commitAndAnnounce = (0, $jCxNY$useCallback)(()=>{
        let oldValue = inputRef.current?.value ?? '';
        // Set input value to normalized valid value
        (0, $jCxNY$flushSync)(()=>{
            commit();
        });
        if (inputRef.current?.value !== oldValue) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(inputRef.current?.value ?? '', 'assertive');
    }, [
        commit,
        inputRef
    ]);
    let inputId = (0, $390e54f620492c70$export$f680877a34711e37)(id);
    let { focusProps: focusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)({
        onBlur () {
            commitAndAnnounce();
        }
    });
    let numberFormatter = (0, $bd90acf18e792be6$export$b7a616150fdb9f44)(formatOptions);
    let intlOptions = (0, $jCxNY$useMemo)(()=>numberFormatter.resolvedOptions(), [
        numberFormatter
    ]);
    // Replace negative textValue formatted using currencySign: 'accounting'
    // with a textValue that can be announced using a minus sign.
    let textValueFormatter = (0, $bd90acf18e792be6$export$b7a616150fdb9f44)({
        ...formatOptions,
        currencySign: undefined
    });
    let textValue = (0, $jCxNY$useMemo)(()=>isNaN(numberValue) ? '' : textValueFormatter.format(numberValue), [
        textValueFormatter,
        numberValue
    ]);
    let { spinButtonProps: spinButtonProps, incrementButtonProps: incButtonProps, decrementButtonProps: decButtonProps } = (0, $757ec6630f26125c$export$e908e06f4b8e3402)({
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
    let [focusWithin, setFocusWithin] = (0, $jCxNY$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $jCxNY$useCallback)((e)=>{
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
    (0, $14554ba6a2007b17$export$2123ff2b87c81ca)({
        onScroll: onWheel,
        isDisabled: scrollingDisabled
    }, inputRef);
    // The inputMode attribute influences the software keyboard that is shown on touch devices.
    // Browsers and operating systems are quite inconsistent about what keys are available, however.
    // We choose between numeric and decimal based on whether we allow negative and fractional numbers,
    // and based on testing on various devices to determine what keys are available in each inputMode.
    let hasDecimals = (intlOptions.maximumFractionDigits ?? 0) > 0;
    let hasNegative = state.minValue === undefined || isNaN(state.minValue) || state.minValue < 0;
    let inputMode = 'numeric';
    if ((0, $2add3ce32c6007eb$export$186c6964ca17d99)()) {
        // iPhone doesn't have a minus sign in either numeric or decimal.
        // Note this is only for iPhone, not iPad, which always has both
        // minus and decimal in numeric.
        if (hasNegative) inputMode = 'text';
        else if (hasDecimals) inputMode = 'decimal';
    } else if ((0, $2add3ce32c6007eb$export$a11b0059900ceec8)()) {
        // Android numeric has both a decimal point and minus key.
        // decimal does not have a minus key.
        if (hasNegative) inputMode = 'numeric';
        else if (hasDecimals) inputMode = 'decimal';
    }
    let onChange = (value)=>{
        if (state.validate(value)) state.setInputValue(value);
    };
    let onPaste = (e)=>{
        props.onPaste?.(e);
        let inputElement = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        // we can only handle the case where the paste takes over the entire input, otherwise things get very complicated
        // trying to calculate the new string based on what the paste is replacing and where in the source string it is
        if (inputElement && (inputElement.selectionEnd ?? -1) - (inputElement.selectionStart ?? 0) === inputElement.value.length) {
            e.preventDefault();
            // commit so that the user gets to see what it formats to immediately
            // paste happens before inputRef's value is updated, so have to prevent the default and do it ourselves
            // spin button will then handle announcing the new value, this should work with controlled state as well
            // because the announcement is done as a result of the new rendered input value if there is one
            commit(e.clipboardData?.getData?.('text/plain')?.trim() ?? '');
        }
    };
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props);
    let onKeyDownEnter = (0, $jCxNY$useCallback)((e)=>{
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            (0, $jCxNY$flushSync)(()=>{
                commit();
            });
            commitValidation();
        } else e.continuePropagation();
    }, [
        commit,
        commitValidation
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: textFieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $62888b2ec35be488$export$4f384c9210e583c3)({
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
        [(0, $jCxNY$privateValidationStateProp)]: state,
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
        onKeyDown: (0, $jCxNY$useMemo)(()=>(0, $a4e76a5424781910$export$e08e3b67e392101e)(onKeyDownEnter, onKeyDown), [
            onKeyDownEnter,
            onKeyDown
        ]),
        onKeyUp: onKeyUp,
        onPaste: onPaste,
        description: description,
        errorMessage: errorMessage
    }, state, inputRef);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(inputRef, state.defaultNumberValue, state.setNumberValue);
    $cd2fa56213693c5e$var$useNativeValidation(state, props.validationBehavior, props.commitBehavior, inputRef, state.minValue, state.maxValue, props.step, state.numberValue);
    let inputProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(spinButtonProps, focusProps, textFieldProps, {
        // override the spinbutton role, we can't focus a spin button with VO
        role: null,
        // ignore aria-roledescription on iOS so that required state will announce when it is present
        'aria-roledescription': !(0, $2add3ce32c6007eb$export$fedb369cb70207f1)() ? stringFormatter.format('numberField') : null,
        'aria-valuemax': null,
        'aria-valuemin': null,
        'aria-valuenow': null,
        'aria-valuetext': null,
        autoCorrect: 'off',
        spellCheck: 'false'
    });
    if (props.validationBehavior === 'native') inputProps['aria-required'] = undefined;
    let onButtonPressStart = (e)=>{
        // If focus is already on the input, keep it there so we don't hide the
        // software keyboard when tapping the increment/decrement buttons.
        if ((0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() === inputRef.current) return;
        // Otherwise, when using a mouse, move focus to the input.
        // On touch, or with a screen reader, focus the button so that the software
        // keyboard does not appear and the screen reader cursor is not moved off the button.
        if (e.pointerType === 'mouse') inputRef.current?.focus();
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
    let incrementId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let decrementId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let incrementButtonProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(incButtonProps, {
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
    let decrementButtonProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(decButtonProps, {
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
let $cd2fa56213693c5e$var$numberInput = null;
function $cd2fa56213693c5e$var$useNativeValidation(state, validationBehavior, commitBehavior, inputRef, min, max, step, value) {
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let input = inputRef.current;
        if (commitBehavior !== 'validate' || state.realtimeValidation.isInvalid || !input || input.disabled) return;
        // Create a native number input and use it to implement validation of min/max/step.
        // This lets us get the native validation message provided by the browser instead of needing our own translations.
        if (!$cd2fa56213693c5e$var$numberInput && typeof document !== 'undefined') {
            $cd2fa56213693c5e$var$numberInput = document.createElement('input');
            $cd2fa56213693c5e$var$numberInput.type = 'number';
        }
        if (!$cd2fa56213693c5e$var$numberInput) // For TypeScript.
        return;
        $cd2fa56213693c5e$var$numberInput.min = min != null && !isNaN(min) ? String(min) : '';
        $cd2fa56213693c5e$var$numberInput.max = max != null && !isNaN(max) ? String(max) : '';
        $cd2fa56213693c5e$var$numberInput.step = step != null && !isNaN(step) ? String(step) : '';
        $cd2fa56213693c5e$var$numberInput.value = value != null && !isNaN(value) ? String(value) : '';
        // Merge validity with the visible text input (for other validations like required).
        let valid = input.validity.valid && $cd2fa56213693c5e$var$numberInput.validity.valid;
        let validationMessage = input.validationMessage || $cd2fa56213693c5e$var$numberInput.validationMessage;
        let validity = {
            isInvalid: !valid,
            validationErrors: validationMessage ? [
                validationMessage
            ] : [],
            validationDetails: {
                badInput: input.validity.badInput,
                customError: input.validity.customError,
                patternMismatch: input.validity.patternMismatch,
                rangeOverflow: $cd2fa56213693c5e$var$numberInput.validity.rangeOverflow,
                rangeUnderflow: $cd2fa56213693c5e$var$numberInput.validity.rangeUnderflow,
                stepMismatch: $cd2fa56213693c5e$var$numberInput.validity.stepMismatch,
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
        if (validationBehavior === 'native' && !$cd2fa56213693c5e$var$numberInput.validity.valid) input.setCustomValidity($cd2fa56213693c5e$var$numberInput.validationMessage);
    });
}


export {$cd2fa56213693c5e$export$23f548e970bdf099 as useNumberField};
//# sourceMappingURL=useNumberField.mjs.map
