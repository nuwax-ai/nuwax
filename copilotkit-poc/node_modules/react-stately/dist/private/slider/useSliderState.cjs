var $d947385dec0a279e$exports = require("../utils/number.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $h6QKk$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSliderState", function () { return $f9570b296a78cc5e$export$e5fda3247f5d67f9; });
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


const $f9570b296a78cc5e$var$DEFAULT_MIN_VALUE = 0;
const $f9570b296a78cc5e$var$DEFAULT_MAX_VALUE = 100;
const $f9570b296a78cc5e$var$DEFAULT_STEP_VALUE = 1;
function $f9570b296a78cc5e$export$e5fda3247f5d67f9(props) {
    const { isDisabled: isDisabled = false, minValue: minValue = $f9570b296a78cc5e$var$DEFAULT_MIN_VALUE, maxValue: maxValue = $f9570b296a78cc5e$var$DEFAULT_MAX_VALUE, numberFormatter: formatter, step: step = $f9570b296a78cc5e$var$DEFAULT_STEP_VALUE, orientation: orientation = 'horizontal' } = props;
    // Page step should be at least equal to step and always a multiple of the step.
    let pageSize = (0, $h6QKk$react.useMemo)(()=>{
        let calcPageSize = (maxValue - minValue) / 10;
        calcPageSize = (0, $d947385dec0a279e$exports.snapValueToStep)(calcPageSize, 0, calcPageSize + step, step);
        return Math.max(calcPageSize, step);
    }, [
        step,
        maxValue,
        minValue
    ]);
    let restrictValues = (0, $h6QKk$react.useCallback)((values)=>values?.map((val, idx)=>{
            let min = idx === 0 ? minValue : values[idx - 1];
            let max = idx === values.length - 1 ? maxValue : values[idx + 1];
            return (0, $d947385dec0a279e$exports.snapValueToStep)(val, min, max, step);
        }), [
        minValue,
        maxValue,
        step
    ]);
    let value = (0, $h6QKk$react.useMemo)(()=>restrictValues($f9570b296a78cc5e$var$convertValue(props.value)), [
        props.value,
        restrictValues
    ]);
    let defaultValue = (0, $h6QKk$react.useMemo)(()=>restrictValues($f9570b296a78cc5e$var$convertValue(props.defaultValue) ?? [
            minValue
        ]), [
        props.defaultValue,
        minValue,
        restrictValues
    ]);
    let onChange = $f9570b296a78cc5e$var$createOnChange(props.value, props.defaultValue, props.onChange);
    let onChangeEnd = $f9570b296a78cc5e$var$createOnChange(props.value, props.defaultValue, props.onChangeEnd);
    const [values, setValuesState] = (0, $14cedf286405cc4b$exports.useControlledState)(value, defaultValue, onChange);
    let [initialValues] = (0, $h6QKk$react.useState)(values);
    const [isDraggings, setDraggingsState] = (0, $h6QKk$react.useState)(new Array(values.length).fill(false));
    const isEditablesRef = (0, $h6QKk$react.useRef)(new Array(values.length).fill(true));
    const [focusedIndex, setFocusedIndex] = (0, $h6QKk$react.useState)(undefined);
    const valuesRef = (0, $h6QKk$react.useRef)(values);
    const isDraggingsRef = (0, $h6QKk$react.useRef)(isDraggings);
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
        value = (0, $d947385dec0a279e$exports.snapValueToStep)(value, thisMin, thisMax, step);
        let newValues = $f9570b296a78cc5e$var$replaceIndex(valuesRef.current, index, value);
        setValues(newValues);
    }
    function updateDragging(index, dragging) {
        if (isDisabled || !isThumbEditable(index)) return;
        if (dragging) valuesRef.current = values;
        const wasDragging = isDraggingsRef.current[index];
        isDraggingsRef.current = $f9570b296a78cc5e$var$replaceIndex(isDraggingsRef.current, index, dragging);
        setDraggings(isDraggingsRef.current);
        // Call onChangeEnd if no handles are dragging.
        if (onChangeEnd && wasDragging && !isDraggingsRef.current.some(Boolean)) onChangeEnd(valuesRef.current);
    }
    let listFormatRef = (0, $h6QKk$react.useRef)(null);
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
        return (0, $d947385dec0a279e$exports.clamp)(getRoundedValue(val), minValue, maxValue);
    }
    function incrementThumb(index, stepSize = 1) {
        let s = Math.max(stepSize, step);
        updateValue(index, (0, $d947385dec0a279e$exports.snapValueToStep)(values[index] + s, minValue, maxValue, step));
    }
    function decrementThumb(index, stepSize = 1) {
        let s = Math.max(stepSize, step);
        updateValue(index, (0, $d947385dec0a279e$exports.snapValueToStep)(values[index] - s, minValue, maxValue, step));
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
function $f9570b296a78cc5e$var$replaceIndex(array, index, value) {
    if (array[index] === value) return array;
    return [
        ...array.slice(0, index),
        value,
        ...array.slice(index + 1)
    ];
}
function $f9570b296a78cc5e$var$convertValue(value) {
    if (value == null) return undefined;
    return Array.isArray(value) ? value : [
        value
    ];
}
function $f9570b296a78cc5e$var$createOnChange(value, defaultValue, onChange) {
    return (newValue)=>{
        if (typeof value === 'number' || typeof defaultValue === 'number') onChange?.(newValue[0]);
        else onChange?.(newValue);
    };
}


//# sourceMappingURL=useSliderState.cjs.map
