var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $90c404755d945e7c$exports = require("./Color.cjs");
var $4e0e76ad3205925c$exports = require("./useColor.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $bzJBx$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorFieldState", function () { return $2968dd6b3018eccd$export$d52a01683abdfcd6; });
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




const $2968dd6b3018eccd$var$MIN_COLOR = (0, $90c404755d945e7c$exports.parseColor)('#000000');
const $2968dd6b3018eccd$var$MAX_COLOR = (0, $90c404755d945e7c$exports.parseColor)('#FFFFFF');
const $2968dd6b3018eccd$var$MIN_COLOR_INT = $2968dd6b3018eccd$var$MIN_COLOR.toHexInt();
const $2968dd6b3018eccd$var$MAX_COLOR_INT = $2968dd6b3018eccd$var$MAX_COLOR.toHexInt();
function $2968dd6b3018eccd$export$d52a01683abdfcd6(props) {
    let { value: value, defaultValue: defaultValue, onChange: onChange } = props;
    let { step: step } = $2968dd6b3018eccd$var$MIN_COLOR.getChannelRange('red');
    let initialDefaultValue = (0, $4e0e76ad3205925c$exports.useColor)(defaultValue);
    let [colorValue, setColorValue] = (0, $14cedf286405cc4b$exports.useControlledState)((0, $4e0e76ad3205925c$exports.useColor)(value), initialDefaultValue, onChange);
    let [initialValue] = (0, $bzJBx$react.useState)(colorValue);
    let [inputValue, setInputValue] = (0, $bzJBx$react.useState)(()=>(value || defaultValue) && colorValue ? colorValue.toString('hex') : '');
    let validation = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
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
    let [prevValue, setPrevValue] = (0, $bzJBx$react.useState)(colorValue);
    if (prevValue !== colorValue) {
        setInputValue(colorValue ? colorValue.toString('hex') : '');
        setPrevValue(colorValue);
    }
    let parsedValue = (0, $bzJBx$react.useMemo)(()=>{
        let color;
        try {
            color = (0, $90c404755d945e7c$exports.parseColor)(inputValue.startsWith('#') ? inputValue : `#${inputValue}`);
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
        let newValue = $2968dd6b3018eccd$var$addColorValue(parsedValue, step);
        // if we've arrived at the same value that was previously in the state, the
        // input value should be updated to match
        // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
        // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
        if (newValue === colorValue) setInputValue(newValue.toString('hex'));
        safelySetColorValue(newValue);
        validation.commitValidation();
    };
    let decrement = ()=>{
        let newValue = $2968dd6b3018eccd$var$addColorValue(parsedValue, -step);
        // if we've arrived at the same value that was previously in the state, the
        // input value should be updated to match
        // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
        // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
        if (newValue === colorValue) setInputValue(newValue.toString('hex'));
        safelySetColorValue(newValue);
        validation.commitValidation();
    };
    let incrementToMax = ()=>safelySetColorValue($2968dd6b3018eccd$var$MAX_COLOR);
    let decrementToMin = ()=>safelySetColorValue($2968dd6b3018eccd$var$MIN_COLOR);
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
function $2968dd6b3018eccd$var$addColorValue(color, step) {
    let newColor = color ? color : $2968dd6b3018eccd$var$MIN_COLOR;
    let colorInt = newColor.toHexInt();
    let clampInt = Math.min(Math.max(colorInt + step, $2968dd6b3018eccd$var$MIN_COLOR_INT), $2968dd6b3018eccd$var$MAX_COLOR_INT);
    if (clampInt !== colorInt) {
        let newColorString = `#${clampInt.toString(16).padStart(6, '0').toUpperCase()}`;
        newColor = (0, $90c404755d945e7c$exports.parseColor)(newColorString);
    }
    return newColor;
}


//# sourceMappingURL=useColorFieldState.cjs.map
