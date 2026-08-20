import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useFormattedTextField as $a97100a6dd40f368$export$4f384c9210e583c3} from "../textfield/useFormattedTextField.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useScrollWheel as $387080635b69cb2d$export$2123ff2b87c81ca} from "../interactions/useScrollWheel.js";
import {useSpinButton as $b36f0efc8d77b16f$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.js";
import {useState as $j4wZN$useState, useCallback as $j4wZN$useCallback} from "react";
import {privateValidationStateProp as $j4wZN$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";

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








function $23951a0914b6cb31$export$77e32ca575a28fdf(props, state, ref) {
    let { isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, isWheelDisabled: isWheelDisabled, validationBehavior: validationBehavior = 'aria' } = props;
    let { colorValue: colorValue, inputValue: inputValue, increment: increment, decrement: decrement, incrementToMax: incrementToMax, decrementToMin: decrementToMin, commit: commit } = state;
    let inputId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let { spinButtonProps: spinButtonProps } = (0, $b36f0efc8d77b16f$export$e908e06f4b8e3402)({
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
    let [focusWithin, setFocusWithin] = (0, $j4wZN$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $j4wZN$useCallback)((e)=>{
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
    }, ref);
    let onChange = (value)=>{
        if (state.validate(value)) state.setInputValue(value);
    };
    let { inputProps: inputProps, ...otherProps } = (0, $a97100a6dd40f368$export$4f384c9210e583c3)({
        ...props,
        id: inputId,
        value: inputValue,
        // Intentionally invalid value that will be ignored by onChange during form reset
        // This is handled separately below.
        defaultValue: '!',
        validate: undefined,
        [(0, $j4wZN$privateValidationStateProp)]: state,
        type: 'text',
        autoComplete: 'off',
        onChange: onChange
    }, state, ref);
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(ref, state.defaultColorValue, state.setColorValue);
    inputProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(inputProps, spinButtonProps, focusWithinProps, {
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


export {$23951a0914b6cb31$export$77e32ca575a28fdf as useColorField};
//# sourceMappingURL=useColorField.js.map
