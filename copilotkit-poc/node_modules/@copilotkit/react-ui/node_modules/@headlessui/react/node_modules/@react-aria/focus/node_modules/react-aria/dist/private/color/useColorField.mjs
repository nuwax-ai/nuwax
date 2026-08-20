import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useFormattedTextField as $62888b2ec35be488$export$4f384c9210e583c3} from "../textfield/useFormattedTextField.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useScrollWheel as $14554ba6a2007b17$export$2123ff2b87c81ca} from "../interactions/useScrollWheel.mjs";
import {useSpinButton as $757ec6630f26125c$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.mjs";
import {useState as $bVRGN$useState, useCallback as $bVRGN$useCallback} from "react";
import {privateValidationStateProp as $bVRGN$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";

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








function $3945427e9f7dd37b$export$77e32ca575a28fdf(props, state, ref) {
    let { isDisabled: isDisabled, isReadOnly: isReadOnly, isRequired: isRequired, isWheelDisabled: isWheelDisabled, validationBehavior: validationBehavior = 'aria' } = props;
    let { colorValue: colorValue, inputValue: inputValue, increment: increment, decrement: decrement, incrementToMax: incrementToMax, decrementToMin: decrementToMin, commit: commit } = state;
    let inputId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let { spinButtonProps: spinButtonProps } = (0, $757ec6630f26125c$export$e908e06f4b8e3402)({
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
    let [focusWithin, setFocusWithin] = (0, $bVRGN$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        isDisabled: isDisabled,
        onFocusWithinChange: setFocusWithin
    });
    let onWheel = (0, $bVRGN$useCallback)((e)=>{
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
    }, ref);
    let onChange = (value)=>{
        if (state.validate(value)) state.setInputValue(value);
    };
    let { inputProps: inputProps, ...otherProps } = (0, $62888b2ec35be488$export$4f384c9210e583c3)({
        ...props,
        id: inputId,
        value: inputValue,
        // Intentionally invalid value that will be ignored by onChange during form reset
        // This is handled separately below.
        defaultValue: '!',
        validate: undefined,
        [(0, $bVRGN$privateValidationStateProp)]: state,
        type: 'text',
        autoComplete: 'off',
        onChange: onChange
    }, state, ref);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(ref, state.defaultColorValue, state.setColorValue);
    inputProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(inputProps, spinButtonProps, focusWithinProps, {
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


export {$3945427e9f7dd37b$export$77e32ca575a28fdf as useColorField};
//# sourceMappingURL=useColorField.mjs.map
