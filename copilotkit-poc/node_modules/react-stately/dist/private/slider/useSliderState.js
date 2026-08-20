import {clamp as $9b3cb10e52b1a6e3$export$7d15b64cf5a3a4c4, snapValueToStep as $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463} from "../utils/number.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMemo as $7Bs6O$useMemo, useCallback as $7Bs6O$useCallback, useState as $7Bs6O$useState, useRef as $7Bs6O$useRef} from "react";

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


const $194316de6a67a627$var$DEFAULT_MIN_VALUE = 0;
const $194316de6a67a627$var$DEFAULT_MAX_VALUE = 100;
const $194316de6a67a627$var$DEFAULT_STEP_VALUE = 1;
function $194316de6a67a627$export$e5fda3247f5d67f9(props) {
    const { isDisabled: isDisabled = false, minValue: minValue = $194316de6a67a627$var$DEFAULT_MIN_VALUE, maxValue: maxValue = $194316de6a67a627$var$DEFAULT_MAX_VALUE, numberFormatter: formatter, step: step = $194316de6a67a627$var$DEFAULT_STEP_VALUE, orientation: orientation = 'horizontal' } = props;
    // Page step should be at least equal to step and always a multiple of the step.
    let pageSize = (0, $7Bs6O$useMemo)(()=>{
        let calcPageSize = (maxValue - minValue) / 10;
        calcPageSize = (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(calcPageSize, 0, calcPageSize + step, step);
        return Math.max(calcPageSize, step);
    }, [
        step,
        maxValue,
        minValue
    ]);
    let restrictValues = (0, $7Bs6O$useCallback)((values)=>values === null || values === void 0 ? void 0 : values.map((val, idx)=>{
            let min = idx === 0 ? minValue : values[idx - 1];
            let max = idx === values.length - 1 ? maxValue : values[idx + 1];
            return (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(val, min, max, step);
        }), [
        minValue,
        maxValue,
        step
    ]);
    let value = (0, $7Bs6O$useMemo)(()=>restrictValues($194316de6a67a627$var$convertValue(props.value)), [
        props.value,
        restrictValues
    ]);
    let defaultValue = (0, $7Bs6O$useMemo)(()=>{
        var _convertValue;
        return restrictValues((_convertValue = $194316de6a67a627$var$convertValue(props.defaultValue)) !== null && _convertValue !== void 0 ? _convertValue : [
            minValue
        ]);
    }, [
        props.defaultValue,
        minValue,
        restrictValues
    ]);
    let onChange = $194316de6a67a627$var$createOnChange(props.value, props.defaultValue, props.onChange);
    let onChangeEnd = $194316de6a67a627$var$createOnChange(props.value, props.defaultValue, props.onChangeEnd);
    const [values, setValuesState] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(value, defaultValue, onChange);
    let [initialValues] = (0, $7Bs6O$useState)(values);
    const [isDraggings, setDraggingsState] = (0, $7Bs6O$useState)(new Array(values.length).fill(false));
    const isEditablesRef = (0, $7Bs6O$useRef)(new Array(values.length).fill(true));
    const [focusedIndex, setFocusedIndex] = (0, $7Bs6O$useState)(undefined);
    const valuesRef = (0, $7Bs6O$useRef)(values);
    const isDraggingsRef = (0, $7Bs6O$useRef)(isDraggings);
    let setValues = (values)=>{
        valuesRef.current = values;
        setValuesState(values);
    };
    let setDraggings = (draggings)=>{
        isDraggingsRef.current = draggings;
        setDraggingsState(draggings);
    };
    function getValuePercent(value) {
        return (value - minValue) / (maxValue - minValue);
    }
    function getThumbMinValue(index) {
        return index === 0 ? minValue : values[index - 1];
    }
    function getThumbMaxValue(index) {
        return index === values.length - 1 ? maxValue : values[index + 1];
    }
    function isThumbEditable(index) {
        return isEditablesRef.current[index];
    }
    function setThumbEditable(index, editable) {
        isEditablesRef.current[index] = editable;
    }
    function updateValue(index, value) {
        if (isDisabled || !isThumbEditable(index)) return;
        const thisMin = getThumbMinValue(index);
        const thisMax = getThumbMaxValue(index);
        // Round value to multiple of step, clamp value between min and max
        value = (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(value, thisMin, thisMax, step);
        let newValues = $194316de6a67a627$var$replaceIndex(valuesRef.current, index, value);
        setValues(newValues);
    }
    function updateDragging(index, dragging) {
        if (isDisabled || !isThumbEditable(index)) return;
        if (dragging) valuesRef.current = values;
        const wasDragging = isDraggingsRef.current[index];
        isDraggingsRef.current = $194316de6a67a627$var$replaceIndex(isDraggingsRef.current, index, dragging);
        setDraggings(isDraggingsRef.current);
        // Call onChangeEnd if no handles are dragging.
        if (onChangeEnd && wasDragging && !isDraggingsRef.current.some(Boolean)) onChangeEnd(valuesRef.current);
    }
    let listFormatRef = (0, $7Bs6O$useRef)(null);
    function getFormattedValue(valueParam = values) {
        if (typeof valueParam === 'number') valueParam = [
            valueParam
        ];
        switch(valueParam.length){
            case 0:
                return '';
            case 1:
                return formatter.format(valueParam[0]);
            case 2:
                return formatter.formatRange(valueParam[0], valueParam[1]);
            default:
                {
                    let formatted = valueParam.map((value)=>formatter.format(value));
                    let listFormat = listFormatRef.current;
                    if (!listFormat || listFormat.resolvedOptions().locale !== formatter.resolvedOptions().locale) listFormat = listFormatRef.current = new Intl.ListFormat(formatter.resolvedOptions().locale, {
                        type: 'unit'
                    });
                    return listFormat.format(formatted);
                }
        }
    }
    function setThumbPercent(index, percent) {
        updateValue(index, getPercentValue(percent));
    }
    function getRoundedValue(value) {
        return Math.round((value - minValue) / step) * step + minValue;
    }
    function getPercentValue(percent) {
        const val = percent * (maxValue - minValue) + minValue;
        return (0, $9b3cb10e52b1a6e3$export$7d15b64cf5a3a4c4)(getRoundedValue(val), minValue, maxValue);
    }
    function incrementThumb(index, stepSize = 1) {
        let s = Math.max(stepSize, step);
        updateValue(index, (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(values[index] + s, minValue, maxValue, step));
    }
    function decrementThumb(index, stepSize = 1) {
        let s = Math.max(stepSize, step);
        updateValue(index, (0, $9b3cb10e52b1a6e3$export$cb6e0bb50bc19463)(values[index] - s, minValue, maxValue, step));
    }
    return {
        values: values,
        defaultValues: props.defaultValue !== undefined ? defaultValue : initialValues,
        getThumbValue: (index)=>values[index],
        setThumbValue: updateValue,
        setThumbPercent: setThumbPercent,
        isThumbDragging: (index)=>isDraggings[index],
        setThumbDragging: updateDragging,
        focusedThumb: focusedIndex,
        setFocusedThumb: setFocusedIndex,
        getThumbPercent: (index)=>getValuePercent(values[index]),
        getValuePercent: getValuePercent,
        getThumbValueLabel: (index)=>getFormattedValue(values[index]),
        getFormattedValue: getFormattedValue,
        getThumbMinValue: getThumbMinValue,
        getThumbMaxValue: getThumbMaxValue,
        getPercentValue: getPercentValue,
        isThumbEditable: isThumbEditable,
        setThumbEditable: setThumbEditable,
        incrementThumb: incrementThumb,
        decrementThumb: decrementThumb,
        step: step,
        pageSize: pageSize,
        orientation: orientation,
        isDisabled: isDisabled
    };
}
function $194316de6a67a627$var$replaceIndex(array, index, value) {
    if (array[index] === value) return array;
    return [
        ...array.slice(0, index),
        value,
        ...array.slice(index + 1)
    ];
}
function $194316de6a67a627$var$convertValue(value) {
    if (value == null) return undefined;
    return Array.isArray(value) ? value : [
        value
    ];
}
function $194316de6a67a627$var$createOnChange(value, defaultValue, onChange) {
    return (newValue)=>{
        if (typeof value === 'number' || typeof defaultValue === 'number') onChange === null || onChange === void 0 ? void 0 : onChange(newValue[0]);
        else onChange === null || onChange === void 0 ? void 0 : onChange(newValue);
    };
}


export {$194316de6a67a627$export$e5fda3247f5d67f9 as useSliderState};
//# sourceMappingURL=useSliderState.js.map
