import {normalizeColor as $9be7d47340a9a2a9$export$4cde5df63f53f473, parseColor as $9be7d47340a9a2a9$export$6e865ea70d7724f} from "./Color.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $brID8$useState, useMemo as $brID8$useMemo, useRef as $brID8$useRef} from "react";

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


const $f535989a1003ed3e$var$DEFAULT_COLOR = (0, $9be7d47340a9a2a9$export$6e865ea70d7724f)('hsl(0, 100%, 50%)');
function $f535989a1003ed3e$var$roundToStep(value, step) {
    return Math.round(value / step) * step;
}
function $f535989a1003ed3e$var$mod(n, m) {
    return (n % m + m) % m;
}
function $f535989a1003ed3e$var$roundDown(v) {
    let r = Math.floor(v);
    if (r === v) return v - 1;
    else return r;
}
function $f535989a1003ed3e$var$degToRad(deg) {
    return deg * Math.PI / 180;
}
function $f535989a1003ed3e$var$radToDeg(rad) {
    return rad * 180 / Math.PI;
}
// 0deg = 3 o'clock. increases clockwise
function $f535989a1003ed3e$var$angleToCartesian(angle, radius) {
    let rad = $f535989a1003ed3e$var$degToRad(360 - angle + 90);
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    return {
        x: x,
        y: y
    };
}
function $f535989a1003ed3e$var$cartesianToAngle(x, y, radius) {
    let deg = $f535989a1003ed3e$var$radToDeg(Math.atan2(y / radius, x / radius));
    return (deg + 360) % 360;
}
function $f535989a1003ed3e$export$f4301076d9336137(props) {
    let { value: propsValue, defaultValue: defaultValue, onChange: onChange, onChangeEnd: onChangeEnd } = props;
    if (!propsValue && !defaultValue) defaultValue = $f535989a1003ed3e$var$DEFAULT_COLOR;
    if (propsValue) propsValue = (0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(propsValue);
    if (defaultValue) defaultValue = (0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(defaultValue);
    // safe to cast value and defaultValue to Color, one of them will always be defined because if neither are, we assign a default
    let [stateValue, setValueState] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(propsValue, defaultValue, onChange);
    let [initialValue] = (0, $brID8$useState)(stateValue);
    let value = (0, $brID8$useMemo)(()=>{
        let colorSpace = stateValue.getColorSpace();
        return colorSpace === 'hsl' || colorSpace === 'hsb' ? stateValue : stateValue.toFormat('hsl');
    }, [
        stateValue
    ]);
    let valueRef = (0, $brID8$useRef)(value);
    let setValue = (value)=>{
        valueRef.current = value;
        setValueState(value);
    };
    let channelRange = value.getChannelRange('hue');
    let { minValue: minValueX, maxValue: maxValueX, step: step, pageSize: pageStep } = channelRange;
    let [isDragging, setDragging] = (0, $brID8$useState)(false);
    let isDraggingRef = (0, $brID8$useRef)(false);
    let hue = value.getChannelValue('hue');
    function setHue(v) {
        if (v > 360) // Make sure you can always get back to 0.
        v = 0;
        v = $f535989a1003ed3e$var$roundToStep($f535989a1003ed3e$var$mod(v, 360), step);
        if (hue !== v) {
            let color = value.withChannelValue('hue', v);
            setValue(color);
        }
    }
    return {
        value: value,
        defaultValue: propsValue !== undefined ? initialValue : defaultValue,
        step: step,
        pageStep: pageStep,
        setValue (v) {
            let color = (0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(v);
            setValue(color);
        },
        hue: hue,
        setHue: setHue,
        setHueFromPoint (x, y, radius) {
            setHue($f535989a1003ed3e$var$cartesianToAngle(x, y, radius));
        },
        getThumbPosition (radius) {
            return $f535989a1003ed3e$var$angleToCartesian(value.getChannelValue('hue'), radius);
        },
        increment (stepSize = 1) {
            let s = Math.max(stepSize, step);
            let newValue = hue + s;
            if (newValue >= maxValueX) // Make sure you can always get back to 0.
            newValue = minValueX;
            setHue($f535989a1003ed3e$var$roundToStep($f535989a1003ed3e$var$mod(newValue, 360), s));
        },
        decrement (stepSize = 1) {
            let s = Math.max(stepSize, step);
            if (hue === 0) // We can't just subtract step because this might be the case:
            // |(previous step) - 0| < step size
            setHue($f535989a1003ed3e$var$roundDown(360 / s) * s);
            else setHue($f535989a1003ed3e$var$roundToStep($f535989a1003ed3e$var$mod(hue - s, 360), s));
        },
        setDragging (isDragging) {
            let wasDragging = isDraggingRef.current;
            isDraggingRef.current = isDragging;
            if (onChangeEnd && !isDragging && wasDragging) onChangeEnd(valueRef.current);
            setDragging(isDragging);
        },
        isDragging: isDragging,
        getDisplayColor () {
            return value.toFormat('hsl').withChannelValue('saturation', 100).withChannelValue('lightness', 50).withChannelValue('alpha', 1);
        },
        isDisabled: props.isDisabled || false
    };
}


export {$f535989a1003ed3e$export$f4301076d9336137 as useColorWheelState};
//# sourceMappingURL=useColorWheelState.js.map
