var $90c404755d945e7c$exports = require("./Color.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $l3HqF$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorWheelState", function () { return $5f9af47457516ab1$export$f4301076d9336137; });
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


const $5f9af47457516ab1$var$DEFAULT_COLOR = (0, $90c404755d945e7c$exports.parseColor)('hsl(0, 100%, 50%)');
function $5f9af47457516ab1$var$roundToStep(value, step) {
    return Math.round(value / step) * step;
}
function $5f9af47457516ab1$var$mod(n, m) {
    return (n % m + m) % m;
}
function $5f9af47457516ab1$var$roundDown(v) {
    let r = Math.floor(v);
    if (r === v) return v - 1;
    else return r;
}
function $5f9af47457516ab1$var$degToRad(deg) {
    return deg * Math.PI / 180;
}
function $5f9af47457516ab1$var$radToDeg(rad) {
    return rad * 180 / Math.PI;
}
// 0deg = 3 o'clock. increases clockwise
function $5f9af47457516ab1$var$angleToCartesian(angle, radius) {
    let rad = $5f9af47457516ab1$var$degToRad(360 - angle + 90);
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    return {
        x: x,
        y: y
    };
}
function $5f9af47457516ab1$var$cartesianToAngle(x, y, radius) {
    let deg = $5f9af47457516ab1$var$radToDeg(Math.atan2(y / radius, x / radius));
    return (deg + 360) % 360;
}
function $5f9af47457516ab1$export$f4301076d9336137(props) {
    let { value: propsValue, defaultValue: defaultValue, onChange: onChange, onChangeEnd: onChangeEnd } = props;
    if (!propsValue && !defaultValue) defaultValue = $5f9af47457516ab1$var$DEFAULT_COLOR;
    if (propsValue) propsValue = (0, $90c404755d945e7c$exports.normalizeColor)(propsValue);
    if (defaultValue) defaultValue = (0, $90c404755d945e7c$exports.normalizeColor)(defaultValue);
    // safe to cast value and defaultValue to Color, one of them will always be defined because if neither are, we assign a default
    let [stateValue, setValueState] = (0, $14cedf286405cc4b$exports.useControlledState)(propsValue, defaultValue, onChange);
    let [initialValue] = (0, $l3HqF$react.useState)(stateValue);
    let value = (0, $l3HqF$react.useMemo)(()=>{
        let colorSpace = stateValue.getColorSpace();
        return colorSpace === 'hsl' || colorSpace === 'hsb' ? stateValue : stateValue.toFormat('hsl');
    }, [
        stateValue
    ]);
    let valueRef = (0, $l3HqF$react.useRef)(value);
    let setValue = (value)=>{
        valueRef.current = value;
        setValueState(value);
    };
    let channelRange = value.getChannelRange('hue');
    let { minValue: minValueX, maxValue: maxValueX, step: step, pageSize: pageStep } = channelRange;
    let [isDragging, setDragging] = (0, $l3HqF$react.useState)(false);
    let isDraggingRef = (0, $l3HqF$react.useRef)(false);
    let hue = value.getChannelValue('hue');
    function setHue(v) {
        if (v > 360) // Make sure you can always get back to 0.
        v = 0;
        v = $5f9af47457516ab1$var$roundToStep($5f9af47457516ab1$var$mod(v, 360), step);
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
            let color = (0, $90c404755d945e7c$exports.normalizeColor)(v);
            setValue(color);
        },
        hue: hue,
        setHue: setHue,
        setHueFromPoint (x, y, radius) {
            setHue($5f9af47457516ab1$var$cartesianToAngle(x, y, radius));
        },
        getThumbPosition (radius) {
            return $5f9af47457516ab1$var$angleToCartesian(value.getChannelValue('hue'), radius);
        },
        increment (stepSize = 1) {
            let s = Math.max(stepSize, step);
            let newValue = hue + s;
            if (newValue >= maxValueX) // Make sure you can always get back to 0.
            newValue = minValueX;
            setHue($5f9af47457516ab1$var$roundToStep($5f9af47457516ab1$var$mod(newValue, 360), s));
        },
        decrement (stepSize = 1) {
            let s = Math.max(stepSize, step);
            if (hue === 0) // We can't just subtract step because this might be the case:
            // |(previous step) - 0| < step size
            setHue($5f9af47457516ab1$var$roundDown(360 / s) * s);
            else setHue($5f9af47457516ab1$var$roundToStep($5f9af47457516ab1$var$mod(hue - s, 360), s));
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


//# sourceMappingURL=useColorWheelState.cjs.map
