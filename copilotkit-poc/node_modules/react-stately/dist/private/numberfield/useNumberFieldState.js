import {clamp as $9b3cb10e52b1a6e3$export$7d15b64cf5a3a4c4, snapValueToStep as $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463} from "../utils/number.js";
import {useFormValidationState as $d085204f885ad67a$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {NumberFormatter as $ldq6T$NumberFormatter, NumberParser as $ldq6T$NumberParser} from "@internationalized/number";
import {useCallback as $ldq6T$useCallback, useState as $ldq6T$useState, useMemo as $ldq6T$useMemo} from "react";

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




function $350d668ac1240cb8$export$7f629e9dc1ecf37c(props) {
    let { minValue: minValue, maxValue: maxValue, step: step, formatOptions: formatOptions, value: value, defaultValue: defaultValue = NaN, onChange: onChange, locale: locale, isDisabled: isDisabled, isReadOnly: isReadOnly, commitBehavior: commitBehavior = 'snap' } = props;
    if (value === null) value = NaN;
    let snapValue = (0, $ldq6T$useCallback)((value)=>{
        return step === undefined || isNaN(step) ? (0, $9b3cb10e52b1a6e3$export$7d15b64cf5a3a4c4)(value, minValue, maxValue) : (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(value, minValue, maxValue, step);
    }, [
        step,
        minValue,
        maxValue
    ]);
    if (value !== undefined && !isNaN(value) && commitBehavior === 'snap') value = snapValue(value);
    if (!isNaN(defaultValue) && commitBehavior === 'snap') defaultValue = snapValue(defaultValue);
    let [numberValue, setNumberValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(value, isNaN(defaultValue) ? NaN : defaultValue, onChange);
    let [initialValue] = (0, $ldq6T$useState)(numberValue);
    let [inputValue, setInputValue] = (0, $ldq6T$useState)(()=>isNaN(numberValue) ? '' : new (0, $ldq6T$NumberFormatter)(locale, formatOptions).format(numberValue));
    let numberParser = (0, $ldq6T$useMemo)(()=>new (0, $ldq6T$NumberParser)(locale, formatOptions), [
        locale,
        formatOptions
    ]);
    let numberingSystem = (0, $ldq6T$useMemo)(()=>numberParser.getNumberingSystem(inputValue), [
        numberParser,
        inputValue
    ]);
    let formatter = (0, $ldq6T$useMemo)(()=>new (0, $ldq6T$NumberFormatter)(locale, {
            ...formatOptions,
            numberingSystem: numberingSystem
        }), [
        locale,
        formatOptions,
        numberingSystem
    ]);
    let intlOptions = (0, $ldq6T$useMemo)(()=>formatter.resolvedOptions(), [
        formatter
    ]);
    let format = (0, $ldq6T$useCallback)((value)=>isNaN(value) || value === null ? '' : formatter.format(value), [
        formatter
    ]);
    let validation = (0, $d085204f885ad67a$export$fc1a364ae1f3ff10)({
        ...props,
        value: numberValue
    });
    let clampStep = step !== undefined && !isNaN(step) ? step : 1;
    if (intlOptions.style === 'percent' && (step === undefined || isNaN(step))) clampStep = 0.01;
    // Update the input value when the number value or format options change. This is done
    // in a useEffect so that the controlled behavior is correct and we only update the
    // textfield after prop changes.
    let [prevValue, setPrevValue] = (0, $ldq6T$useState)(numberValue);
    let [prevLocale, setPrevLocale] = (0, $ldq6T$useState)(locale);
    let [prevFormatOptions, setPrevFormatOptions] = (0, $ldq6T$useState)(formatOptions);
    if (!Object.is(numberValue, prevValue) || locale !== prevLocale || !$350d668ac1240cb8$var$isEqualFormatOptions(formatOptions, prevFormatOptions)) {
        setInputValue(format(numberValue));
        setPrevValue(numberValue);
        setPrevLocale(locale);
        setPrevFormatOptions(formatOptions);
    }
    let parsedValue = (0, $ldq6T$useMemo)(()=>numberParser.parse(inputValue), [
        numberParser,
        inputValue
    ]);
    let commit = (overrideValue)=>{
        let newInputValue = overrideValue === undefined ? inputValue : overrideValue;
        let newParsedValue = parsedValue;
        if (overrideValue !== undefined) newParsedValue = numberParser.parse(newInputValue);
        // Set to empty state if input value is empty
        if (!newInputValue.length) {
            setNumberValue(NaN);
            setInputValue(value === undefined ? '' : format(numberValue));
            return;
        }
        // if it failed to parse, then reset input to formatted version of current number
        if (isNaN(newParsedValue)) {
            setInputValue(format(numberValue));
            return;
        }
        // Clamp to min and max, round to the nearest step, and round to specified number of digits
        let clampedValue = commitBehavior === 'snap' ? snapValue(newParsedValue) : newParsedValue;
        clampedValue = numberParser.parse(format(clampedValue));
        let shouldValidate = clampedValue !== numberValue;
        setNumberValue(clampedValue);
        // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
        setInputValue(format(value === undefined ? clampedValue : numberValue));
        if (shouldValidate) validation.commitValidation();
    };
    let safeNextStep = (operation, minMax = 0)=>{
        let prev = parsedValue;
        if (isNaN(prev)) {
            // if the input is empty, start from the min/max value when incrementing/decrementing,
            // or zero if there is no min/max value defined.
            let newValue = isNaN(minMax) ? 0 : minMax;
            return (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(newValue, minValue, maxValue, clampStep);
        } else {
            // otherwise, first snap the current value to the nearest step. if it moves in the direction
            // we're going, use that value, otherwise add the step and snap that value.
            let newValue = (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(prev, minValue, maxValue, clampStep);
            if (operation === '+' && newValue > prev || operation === '-' && newValue < prev) return newValue;
            return (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)($350d668ac1240cb8$var$handleDecimalOperation(operation, prev, clampStep), minValue, maxValue, clampStep);
        }
    };
    let increment = ()=>{
        let newValue = safeNextStep('+', minValue);
        // if we've arrived at the same value that was previously in the state, the
        // input value should be updated to match
        // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
        // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
        if (newValue === numberValue) setInputValue(format(newValue));
        setNumberValue(newValue);
        validation.commitValidation();
    };
    let decrement = ()=>{
        let newValue = safeNextStep('-', maxValue);
        if (newValue === numberValue) setInputValue(format(newValue));
        setNumberValue(newValue);
        validation.commitValidation();
    };
    let incrementToMax = ()=>{
        if (maxValue != null) {
            setNumberValue((0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(maxValue, minValue, maxValue, clampStep));
            validation.commitValidation();
        }
    };
    let decrementToMin = ()=>{
        if (minValue != null) {
            setNumberValue(minValue);
            validation.commitValidation();
        }
    };
    let canIncrement = (0, $ldq6T$useMemo)(()=>!isDisabled && !isReadOnly && (isNaN(parsedValue) || maxValue === undefined || isNaN(maxValue) || (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(parsedValue, minValue, maxValue, clampStep) > parsedValue || $350d668ac1240cb8$var$handleDecimalOperation('+', parsedValue, clampStep) <= maxValue), [
        isDisabled,
        isReadOnly,
        minValue,
        maxValue,
        clampStep,
        parsedValue
    ]);
    let canDecrement = (0, $ldq6T$useMemo)(()=>!isDisabled && !isReadOnly && (isNaN(parsedValue) || minValue === undefined || isNaN(minValue) || (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(parsedValue, minValue, maxValue, clampStep) < parsedValue || $350d668ac1240cb8$var$handleDecimalOperation('-', parsedValue, clampStep) >= minValue), [
        isDisabled,
        isReadOnly,
        minValue,
        maxValue,
        clampStep,
        parsedValue
    ]);
    let validate = (value)=>numberParser.isValidPartialNumber(value, minValue, maxValue);
    return {
        ...validation,
        validate: validate,
        increment: increment,
        incrementToMax: incrementToMax,
        decrement: decrement,
        decrementToMin: decrementToMin,
        canIncrement: canIncrement,
        canDecrement: canDecrement,
        minValue: minValue,
        maxValue: maxValue,
        numberValue: parsedValue,
        defaultNumberValue: isNaN(defaultValue) ? initialValue : defaultValue,
        setNumberValue: setNumberValue,
        setInputValue: setInputValue,
        inputValue: inputValue,
        commit: commit
    };
}
// Shallow equality is sufficient here because all values in Intl.NumberFormatOptions are primitives.
function $350d668ac1240cb8$var$isEqualFormatOptions(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
}
function $350d668ac1240cb8$var$handleDecimalOperation(operator, value1, value2) {
    let result = operator === '+' ? value1 + value2 : value1 - value2;
    // Check if we have decimals
    if (value1 % 1 !== 0 || value2 % 1 !== 0) {
        const value1Decimal = value1.toString().split('.');
        const value2Decimal = value2.toString().split('.');
        const value1DecimalLength = value1Decimal[1] && value1Decimal[1].length || 0;
        const value2DecimalLength = value2Decimal[1] && value2Decimal[1].length || 0;
        const multiplier = Math.pow(10, Math.max(value1DecimalLength, value2DecimalLength));
        // Transform the decimals to integers based on the precision
        value1 = Math.round(value1 * multiplier);
        value2 = Math.round(value2 * multiplier);
        // Perform the operation on integers values to make sure we don't get a fancy decimal value
        result = operator === '+' ? value1 + value2 : value1 - value2;
        // Transform the integer result back to decimal
        result /= multiplier;
    }
    return result;
}


export {$350d668ac1240cb8$export$7f629e9dc1ecf37c as useNumberFieldState};
//# sourceMappingURL=useNumberFieldState.js.map
