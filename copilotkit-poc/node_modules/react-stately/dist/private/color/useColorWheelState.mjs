import {normalizeColor as $890783418b00a858$export$4cde5df63f53f473, parseColor as $890783418b00a858$export$6e865ea70d7724f} from "./Color.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $bNyVw$useState, useMemo as $bNyVw$useMemo, useRef as $bNyVw$useRef} from "react";

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


const $40ea08f45638eac2$var$DEFAULT_COLOR = (0, $890783418b00a858$export$6e865ea70d7724f)('hsl(0, 100%, 50%)');
function $40ea08f45638eac2$var$roundToStep(value, step) {
    return Math.round(value / step) * step;
}
function $40ea08f45638eac2$var$mod(n, m) {
    return (n % m + m) % m;
}
function $40ea08f45638eac2$var$roundDown(v) {
    let r = Math.floor(v);
    if (r === v) return v - 1;
    else return r;
}
function $40ea08f45638eac2$var$degToRad(deg) {
    return deg * Math.PI / 180;
}
function $40ea08f45638eac2$var$radToDeg(rad) {
    return rad * 180 / Math.PI;
}
// 0deg = 3 o'clock. increases clockwise
function $40ea08f45638eac2$var$angleToCartesian(angle, radius) {
    let rad = $40ea08f45638eac2$var$degToRad(360 - angle + 90);
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    return {
        x: x,
        y: y
    };
}
function $40ea08f45638eac2$var$cartesianToAngle(x, y, radius) {
    let deg = $40ea08f45638eac2$var$radToDeg(Math.atan2(y / radius, x / radius));
    return (deg + 360) % 360;
}
function $40ea08f45638eac2$export$f4301076d9336137(props) {
    let { value: propsValue, defaultValue: defaultValue, onChange: onChange, onChangeEnd: onChangeEnd } = props;
    if (!propsValue && !defaultValue) defaultValue = $40ea08f45638eac2$var$DEFAULT_COLOR;
    if (propsValue) propsValue = (0, $890783418b00a858$export$4cde5df63f53f473)(propsValue);
    if (defaultValue) defaultValue = (0, $890783418b00a858$export$4cde5df63f53f473)(defaultValue);
    // safe to cast value and defaultValue to Color, one of them will always be defined because if neither are, we assign a default
    let [stateValue, setValueState] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(propsValue, defaultValue, onChange);
    let [initialValue] = (0, $bNyVw$useState)(stateValue);
    let value = (0, $bNyVw$useMemo)(()=>{
        let colorSpace = stateValue.getColorSpace();
        return colorSpace === 'hsl' || colorSpace === 'hsb' ? stateValue : stateValue.toFormat('hsl');
    }, [
        stateValue
    ]);
    let valueRef = (0, $bNyVw$useRef)(value);
    let setValue = (value)=>{
        valueRef.current = value;
        setValueState(value);
    };
    let channelRange = value.getChannelRange('hue');
    let { minValue: minValueX, maxValue: maxValueX, step: step, pageSize: pageStep } = channelRange;
    let [isDragging, setDragging] = (0, $bNyVw$useState)(false);
    let isDraggingRef = (0, $bNyVw$useRef)(false);
    let hue = value.getChannelValue('hue');
    function setHue(v) {
        if (v > 360) // Make sure you can always get back to 0.
        v = 0;
        v = $40ea08f45638eac2$var$roundToStep($40ea08f45638eac2$var$mod(v, 360), step);
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
            let color = (0, $890783418b00a858$export$4cde5df63f53f473)(v);
            setValue(color);
        },
        hue: hue,
        setHue: setHue,
        setHueFromPoint (x, y, radius) {
            setHue($40ea08f45638eac2$var$cartesianToAngle(x, y, radius));
        },
        getThumbPosition (radius) {
            return $40ea08f45638eac2$var$angleToCartesian(value.getChannelValue('hue'), radius);
        },
        increment (stepSize = 1) {
            let s = Math.max(stepSize, step);
            let newValue = hue + s;
            if (newValue >= maxValueX) // Make sure you can always get back to 0.
            newValue = minValueX;
            setHue($40ea08f45638eac2$var$roundToStep($40ea08f45638eac2$var$mod(newValue, 360), s));
        },
        decrement (stepSize = 1) {
            let s = Math.max(stepSize, step);
            if (hue === 0) // We can't just subtract step because this might be the case:
            // |(previous step) - 0| < step size
            setHue($40ea08f45638eac2$var$roundDown(360 / s) * s);
            else setHue($40ea08f45638eac2$var$roundToStep($40ea08f45638eac2$var$mod(hue - s, 360), s));
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


export {$40ea08f45638eac2$export$f4301076d9336137 as useColorWheelState};
//# sourceMappingURL=useColorWheelState.mjs.map
