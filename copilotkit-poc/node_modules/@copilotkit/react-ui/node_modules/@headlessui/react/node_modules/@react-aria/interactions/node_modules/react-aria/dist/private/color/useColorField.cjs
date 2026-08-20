var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7619b0bd43420560$exports = require("../textfield/useFormattedTextField.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $c162bca8afbf554a$exports = require("../interactions/useScrollWheel.cjs");
var $fcf004be7e8533a5$exports = require("../spinbutton/useSpinButton.cjs");
var $iXcTC$react = require("react");
var $iXcTC$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorField", function () { return $00801e87d3dfcae5$export$77e32ca575a28fdf; });
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








function $00801e87d3dfcae5$export$77e32ca575a28fdf(props, state, ref) {
    let { isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, isWheelDisabled: isWheelDisabled, validationBehavior: validationBehavior = 'aria' } = props;
    let { colorValue: colorValue, inputValue: inputValue, increment: increment, decrement: decrement, incrementToMax: incrementToMax, decrementToMin: decrementToMin, commit: commit } = state;
    let inputId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let { spinButtonProps: spinButtonProps } = (0, $fcf004be7e8533a5$exports.useSpinButton)({
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isRequired: isRequired,
        maxValue: 0xffffff,
        minValue: 0,
        onIncrement: increment,
        onIncrementToMax: incrementToMax,
        onDecrement: decrement,
        onDecrementToMin: decrementToMin,
        value: colorValue ? colorValue.toHexInt() : undefined,
        textValue: colorValue ? colorValue.toString('hex') : undefined
    });
    let [focusWithin, setFocusWithin] = (0, $iXcTC$react.useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $iXcTC$react.useCallback)((e)=>{
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
    }, ref);
    let onChange = (value)=>{
        if (state.validate(value)) state.setInputValue(value);
    };
    let { inputProps: inputProps, ...otherProps } = (0, $7619b0bd43420560$exports.useFormattedTextField)({
        ...props,
        id: inputId,
        value: inputValue,
        // Intentionally invalid value that will be ignored by onChange during form reset
        // This is handled separately below.
        defaultValue: '!',
        validate: undefined,
        [(0, $iXcTC$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: state,
        type: 'text',
        autoComplete: 'off',
        onChange: onChange
    }, state, ref);
    (0, $bbab3903416f8d01$exports.useFormReset)(ref, state.defaultColorValue, state.setColorValue);
    inputProps = (0, $89b39774f3b79dbb$exports.mergeProps)(inputProps, spinButtonProps, focusWithinProps, {
        role: 'textbox',
        'aria-valuemax': null,
        'aria-valuemin': null,
        'aria-valuenow': null,
        'aria-valuetext': null,
        autoCorrect: 'off',
        spellCheck: 'false',
        onBlur: commit
    });
    if (validationBehavior === 'native') inputProps['aria-required'] = undefined;
    return {
        inputProps: inputProps,
        ...otherProps
    };
}


//# sourceMappingURL=useColorField.cjs.map
