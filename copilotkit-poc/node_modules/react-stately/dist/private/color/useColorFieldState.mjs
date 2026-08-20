import {useFormValidationState as $fd2148440a13ec26$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.mjs";
import {parseColor as $890783418b00a858$export$6e865ea70d7724f} from "./Color.mjs";
import {useColor as $7d5d4eb4667f32af$export$5aadd9c0606af5c2} from "./useColor.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $999Vs$useState, useMemo as $999Vs$useMemo} from "react";

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




const $83c2160a93ad557c$var$MIN_COLOR = (0, $890783418b00a858$export$6e865ea70d7724f)('#000000');
const $83c2160a93ad557c$var$MAX_COLOR = (0, $890783418b00a858$export$6e865ea70d7724f)('#FFFFFF');
const $83c2160a93ad557c$var$MIN_COLOR_INT = $83c2160a93ad557c$var$MIN_COLOR.toHexInt();
const $83c2160a93ad557c$var$MAX_COLOR_INT = $83c2160a93ad557c$var$MAX_COLOR.toHexInt();
function $83c2160a93ad557c$export$d52a01683abdfcd6(props) {
    let { value: value, defaultValue: defaultValue, onChange: onChange } = props;
    let { step: step } = $83c2160a93ad557c$var$MIN_COLOR.getChannelRange('red');
    let initialDefaultValue = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(defaultValue);
    let [colorValue, setColorValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)((0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(value), initialDefaultValue, onChange);
    let [initialValue] = (0, $999Vs$useState)(colorValue);
    let [inputValue, setInputValue] = (0, $999Vs$useState)(()=>(value || defaultValue) && colorValue ? colorValue.toString('hex') : '');
    let validation = (0, $fd2148440a13ec26$export$fc1a364ae1f3ff10)({
        ...props,
        value: colorValue
    });
    let safelySetColorValue = (newColor)=>{
        if (!colorValue || !newColor) {
            setColorValue(newColor);
            return;
        }
        if (newColor.toHexInt() !== colorValue.toHexInt()) {
            setColorValue(newColor);
            return;
        }
    };
    let [prevValue, setPrevValue] = (0, $999Vs$useState)(colorValue);
    if (prevValue !== colorValue) {
        setInputValue(colorValue ? colorValue.toString('hex') : '');
        setPrevValue(colorValue);
    }
    let parsedValue = (0, $999Vs$useMemo)(()=>{
        let color;
        try {
            color = (0, $890783418b00a858$export$6e865ea70d7724f)(inputValue.startsWith('#') ? inputValue : `#${inputValue}`);
        } catch  {
            color = null;
        }
        return color;
    }, [
        inputValue
    ]);
    let commit = ()=>{
        // Set to empty state if input value is empty
        if (!inputValue.length) {
            safelySetColorValue(null);
            if (value === undefined || colorValue === null) setInputValue('');
            else setInputValue(colorValue.toString('hex'));
            return;
        }
        // if it failed to parse, then reset input to formatted version of current number
        if (parsedValue == null) {
            setInputValue(colorValue ? colorValue.toString('hex') : '');
            return;
        }
        safelySetColorValue(parsedValue);
        // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
        let newColorValue = '';
        if (colorValue) newColorValue = colorValue.toString('hex');
        setInputValue(newColorValue);
        validation.commitValidation();
    };
    let increment = ()=>{
        let newValue = $83c2160a93ad557c$var$addColorValue(parsedValue, step);
        // if we've arrived at the same value that was previously in the state, the
        // input value should be updated to match
        // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
        // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
        if (newValue === colorValue) setInputValue(newValue.toString('hex'));
        safelySetColorValue(newValue);
        validation.commitValidation();
    };
    let decrement = ()=>{
        let newValue = $83c2160a93ad557c$var$addColorValue(parsedValue, -step);
        // if we've arrived at the same value that was previously in the state, the
        // input value should be updated to match
        // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
        // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
        if (newValue === colorValue) setInputValue(newValue.toString('hex'));
        safelySetColorValue(newValue);
        validation.commitValidation();
    };
    let incrementToMax = ()=>safelySetColorValue($83c2160a93ad557c$var$MAX_COLOR);
    let decrementToMin = ()=>safelySetColorValue($83c2160a93ad557c$var$MIN_COLOR);
    let validate = (value)=>value === '' || !!value.match(/^#?[0-9a-f]{0,6}$/i)?.[0];
    return {
        ...validation,
        validate: validate,
        colorValue: colorValue,
        defaultColorValue: initialDefaultValue ?? initialValue,
        setColorValue: setColorValue,
        inputValue: inputValue,
        setInputValue: setInputValue,
        commit: commit,
        increment: increment,
        incrementToMax: incrementToMax,
        decrement: decrement,
        decrementToMin: decrementToMin
    };
}
function $83c2160a93ad557c$var$addColorValue(color, step) {
    let newColor = color ? color : $83c2160a93ad557c$var$MIN_COLOR;
    let colorInt = newColor.toHexInt();
    let clampInt = Math.min(Math.max(colorInt + step, $83c2160a93ad557c$var$MIN_COLOR_INT), $83c2160a93ad557c$var$MAX_COLOR_INT);
    if (clampInt !== colorInt) {
        let newColorString = `#${clampInt.toString(16).padStart(6, '0').toUpperCase()}`;
        newColor = (0, $890783418b00a858$export$6e865ea70d7724f)(newColorString);
    }
    return newColor;
}


export {$83c2160a93ad557c$export$d52a01683abdfcd6 as useColorFieldState};
//# sourceMappingURL=useColorFieldState.mjs.map
