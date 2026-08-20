var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $6192ba4f000b9ab1$exports = require("./intlStrings.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $5e1a09eb20a4a484$exports = require("../interactions/useFocus.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7619b0bd43420560$exports = require("../textfield/useFormattedTextField.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $976551622437d5fc$exports = require("../i18n/useNumberFormatter.cjs");
var $c162bca8afbf554a$exports = require("../interactions/useScrollWheel.cjs");
var $fcf004be7e8533a5$exports = require("../spinbutton/useSpinButton.cjs");
var $9T6S1$react = require("react");
var $9T6S1$reactdom = require("react-dom");
var $9T6S1$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useNumberField", function () { return $5f05c1b9a9183f1f$export$23f548e970bdf099; });
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



















function $5f05c1b9a9183f1f$export$23f548e970bdf099(props, state, inputRef) {
    let { id: id, decrementAriaLabel: decrementAriaLabel, incrementAriaLabel: incrementAriaLabel, isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, minValue: minValue, maxValue: maxValue, autoFocus: autoFocus, label: label, formatOptions: formatOptions, onBlur: onBlur = ()=>{}, onFocus: onFocus, onFocusChange: onFocusChange, onKeyDown: onKeyDown, onKeyUp: onKeyUp, description: description, errorMessage: errorMessage, isWheelDisabled: isWheelDisabled, ...otherProps } = props;
    let { increment: increment, incrementToMax: incrementToMax, decrement: decrement, decrementToMin: decrementToMin, numberValue: numberValue, inputValue: inputValue, commit: commit, commitValidation: commitValidation } = state;
    const stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($6192ba4f000b9ab1$exports))), '@react-aria/numberfield');
    let commitAndAnnounce = (0, $9T6S1$react.useCallback)(()=>{
        let oldValue = inputRef.current?.value ?? '';
        // Set input value to normalized valid value
        (0, $9T6S1$reactdom.flushSync)(()=>{
            commit();
        });
        if (inputRef.current?.value !== oldValue) (0, $74b2c5b1e7ea9589$exports.announce)(inputRef.current?.value ?? '', 'assertive');
    }, [
        commit,
        inputRef
    ]);
    let inputId = (0, $7ac82d1fee77eb8a$exports.useId)(id);
    let { focusProps: focusProps } = (0, $5e1a09eb20a4a484$exports.useFocus)({
        onBlur () {
            commitAndAnnounce();
        }
    });
    let numberFormatter = (0, $976551622437d5fc$exports.useNumberFormatter)(formatOptions);
    let intlOptions = (0, $9T6S1$react.useMemo)(()=>numberFormatter.resolvedOptions(), [
        numberFormatter
    ]);
    // Replace negative textValue formatted using currencySign: 'accounting'
    // with a textValue that can be announced using a minus sign.
    let textValueFormatter = (0, $976551622437d5fc$exports.useNumberFormatter)({
        ...formatOptions,
        currencySign: undefined
    });
    let textValue = (0, $9T6S1$react.useMemo)(()=>isNaN(numberValue) ? '' : textValueFormatter.format(numberValue), [
        textValueFormatter,
        numberValue
    ]);
    let { spinButtonProps: spinButtonProps, incrementButtonProps: incButtonProps, decrementButtonProps: decButtonProps } = (0, $fcf004be7e8533a5$exports.useSpinButton)({
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
    let [focusWithin, setFocusWithin] = (0, $9T6S1$react.useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $9T6S1$react.useCallback)((e)=>{
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
    (0, $c162bca8afbf554a$exports.useScrollWheel)({
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
    if ((0, $d0b4a781cf26e80b$exports.isIPhone)()) {
        // iPhone doesn't have a minus sign in either numeric or decimal.
        // Note this is only for iPhone, not iPad, which always has both
        // minus and decimal in numeric.
        if (hasNegative) inputMode = 'text';
        else if (hasDecimals) inputMode = 'decimal';
    } else if ((0, $d0b4a781cf26e80b$exports.isAndroid)()) {
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
        let inputElement = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
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
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props);
    let onKeyDownEnter = (0, $9T6S1$react.useCallback)((e)=>{
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            (0, $9T6S1$reactdom.flushSync)(()=>{
                commit();
            });
            commitValidation();
        } else e.continuePropagation();
    }, [
        commit,
        commitValidation
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: textFieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $7619b0bd43420560$exports.useFormattedTextField)({
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
        [(0, $9T6S1$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: state,
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
        onKeyDown: (0, $9T6S1$react.useMemo)(()=>(0, $2f95486cfdaa743c$exports.chain)(onKeyDownEnter, onKeyDown), [
            onKeyDownEnter,
            onKeyDown
        ]),
        onKeyUp: onKeyUp,
        onPaste: onPaste,
        description: description,
        errorMessage: errorMessage
    }, state, inputRef);
    (0, $bbab3903416f8d01$exports.useFormReset)(inputRef, state.defaultNumberValue, state.setNumberValue);
    $5f05c1b9a9183f1f$var$useNativeValidation(state, props.validationBehavior, props.commitBehavior, inputRef, state.minValue, state.maxValue, props.step, state.numberValue);
    let inputProps = (0, $89b39774f3b79dbb$exports.mergeProps)(spinButtonProps, focusProps, textFieldProps, {
        // override the spinbutton role, we can't focus a spin button with VO
        role: null,
        // ignore aria-roledescription on iOS so that required state will announce when it is present
        'aria-roledescription': !(0, $d0b4a781cf26e80b$exports.isIOS)() ? stringFormatter.format('numberField') : null,
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
        if ((0, $da02ee888921bc9e$exports.getActiveElement)() === inputRef.current) return;
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
    let incrementId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let decrementId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let incrementButtonProps = (0, $89b39774f3b79dbb$exports.mergeProps)(incButtonProps, {
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
    let decrementButtonProps = (0, $89b39774f3b79dbb$exports.mergeProps)(decButtonProps, {
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
let $5f05c1b9a9183f1f$var$numberInput = null;
function $5f05c1b9a9183f1f$var$useNativeValidation(state, validationBehavior, commitBehavior, inputRef, min, max, step, value) {
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        let input = inputRef.current;
        if (commitBehavior !== 'validate' || state.realtimeValidation.isInvalid || !input || input.disabled) return;
        // Create a native number input and use it to implement validation of min/max/step.
        // This lets us get the native validation message provided by the browser instead of needing our own translations.
        if (!$5f05c1b9a9183f1f$var$numberInput && typeof document !== 'undefined') {
            $5f05c1b9a9183f1f$var$numberInput = document.createElement('input');
            $5f05c1b9a9183f1f$var$numberInput.type = 'number';
        }
        if (!$5f05c1b9a9183f1f$var$numberInput) // For TypeScript.
        return;
        $5f05c1b9a9183f1f$var$numberInput.min = min != null && !isNaN(min) ? String(min) : '';
        $5f05c1b9a9183f1f$var$numberInput.max = max != null && !isNaN(max) ? String(max) : '';
        $5f05c1b9a9183f1f$var$numberInput.step = step != null && !isNaN(step) ? String(step) : '';
        $5f05c1b9a9183f1f$var$numberInput.value = value != null && !isNaN(value) ? String(value) : '';
        // Merge validity with the visible text input (for other validations like required).
        let valid = input.validity.valid && $5f05c1b9a9183f1f$var$numberInput.validity.valid;
        let validationMessage = input.validationMessage || $5f05c1b9a9183f1f$var$numberInput.validationMessage;
        let validity = {
            isInvalid: !valid,
            validationErrors: validationMessage ? [
                validationMessage
            ] : [],
            validationDetails: {
                badInput: input.validity.badInput,
                customError: input.validity.customError,
                patternMismatch: input.validity.patternMismatch,
                rangeOverflow: $5f05c1b9a9183f1f$var$numberInput.validity.rangeOverflow,
                rangeUnderflow: $5f05c1b9a9183f1f$var$numberInput.validity.rangeUnderflow,
                stepMismatch: $5f05c1b9a9183f1f$var$numberInput.validity.stepMismatch,
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
        if (validationBehavior === 'native' && !$5f05c1b9a9183f1f$var$numberInput.validity.valid) input.setCustomValidity($5f05c1b9a9183f1f$var$numberInput.validationMessage);
    });
}


//# sourceMappingURL=useNumberField.cjs.map
