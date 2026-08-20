var $d947385dec0a279e$exports = require("../utils/number.cjs");
var $90c404755d945e7c$exports = require("./Color.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $f038u$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorAreaState", function () { return $fb049df1f0fc9dda$export$6df7f0e2cabc7eef; });
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



const $fb049df1f0fc9dda$var$DEFAULT_COLOR = (0, $90c404755d945e7c$exports.parseColor)('#ffffff');
function $fb049df1f0fc9dda$export$6df7f0e2cabc7eef(props) {
    let { value: value, defaultValue: defaultValue, colorSpace: colorSpace, xChannel: xChannel, yChannel: yChannel, onChange: onChange, onChangeEnd: onChangeEnd } = props;
    if (!value && !defaultValue) defaultValue = $fb049df1f0fc9dda$var$DEFAULT_COLOR;
    if (value) value = (0, $90c404755d945e7c$exports.normalizeColor)(value);
    if (defaultValue) defaultValue = (0, $90c404755d945e7c$exports.normalizeColor)(defaultValue);
    // safe to cast value and defaultValue to Color, one of them will always be defined because if neither are, we assign a default
    let [colorValue, setColorState] = (0, $14cedf286405cc4b$exports.useControlledState)(value, defaultValue, onChange);
    let [initialValue] = (0, $f038u$react.useState)(colorValue);
    let color = (0, $f038u$react.useMemo)(()=>colorSpace && colorValue ? colorValue.toFormat(colorSpace) : colorValue, [
        colorValue,
        colorSpace
    ]);
    let valueRef = (0, $f038u$react.useRef)(color);
    let setColor = (color)=>{
        valueRef.current = color;
        setColorState(color);
    };
    let channels = (0, $f038u$react.useMemo)(()=>color.getColorSpaceAxes({
            xChannel: xChannel,
            yChannel: yChannel
        }), [
        color,
        xChannel,
        yChannel
    ]);
    let xChannelRange = color.getChannelRange(channels.xChannel);
    let yChannelRange = color.getChannelRange(channels.yChannel);
    let { minValue: minValueX, maxValue: maxValueX, step: stepX, pageSize: pageSizeX } = xChannelRange;
    let { minValue: minValueY, maxValue: maxValueY, step: stepY, pageSize: pageSizeY } = yChannelRange;
    let [isDragging, setDragging] = (0, $f038u$react.useState)(false);
    let isDraggingRef = (0, $f038u$react.useRef)(false);
    let xValue = color.getChannelValue(channels.xChannel);
    let yValue = color.getChannelValue(channels.yChannel);
    let setXValue = (v)=>{
        if (v === xValue) return;
        let newColor = color.withChannelValue(channels.xChannel, v);
        setColor(newColor);
    };
    let setYValue = (v)=>{
        if (v === yValue) return;
        let newColor = color.withChannelValue(channels.yChannel, v);
        setColor(newColor);
    };
    return {
        channels: channels,
        xChannelStep: stepX,
        yChannelStep: stepY,
        xChannelPageStep: pageSizeX,
        yChannelPageStep: pageSizeY,
        value: color,
        defaultValue: value !== undefined ? initialValue : defaultValue,
        setValue (value) {
            setColor((0, $90c404755d945e7c$exports.normalizeColor)(value));
        },
        xValue: xValue,
        setXValue: setXValue,
        yValue: yValue,
        setYValue: setYValue,
        setColorFromPoint (x, y) {
            let newXValue = minValueX + (0, $d947385dec0a279e$exports.clamp)(x, 0, 1) * (maxValueX - minValueX);
            let newYValue = minValueY + (1 - (0, $d947385dec0a279e$exports.clamp)(y, 0, 1)) * (maxValueY - minValueY);
            let newColor;
            if (newXValue !== xValue) {
                // Round new value to multiple of step, clamp value between min and max
                newXValue = (0, $d947385dec0a279e$exports.snapValueToStep)(newXValue, minValueX, maxValueX, stepX);
                newColor = color.withChannelValue(channels.xChannel, newXValue);
            }
            if (newYValue !== yValue) {
                // Round new value to multiple of step, clamp value between min and max
                newYValue = (0, $d947385dec0a279e$exports.snapValueToStep)(newYValue, minValueY, maxValueY, stepY);
                newColor = (newColor || color).withChannelValue(channels.yChannel, newYValue);
            }
            if (newColor) setColor(newColor);
        },
        getThumbPosition () {
            let x = (xValue - minValueX) / (maxValueX - minValueX);
            let y = 1 - (yValue - minValueY) / (maxValueY - minValueY);
            return {
                x: x,
                y: y
            };
        },
        incrementX (stepSize = 1) {
            setXValue(xValue + stepSize > maxValueX ? maxValueX : (0, $d947385dec0a279e$exports.snapValueToStep)(xValue + stepSize, minValueX, maxValueX, stepX));
        },
        incrementY (stepSize = 1) {
            setYValue(yValue + stepSize > maxValueY ? maxValueY : (0, $d947385dec0a279e$exports.snapValueToStep)(yValue + stepSize, minValueY, maxValueY, stepY));
        },
        decrementX (stepSize = 1) {
            setXValue((0, $d947385dec0a279e$exports.snapValueToStep)(xValue - stepSize, minValueX, maxValueX, stepX));
        },
        decrementY (stepSize = 1) {
            setYValue((0, $d947385dec0a279e$exports.snapValueToStep)(yValue - stepSize, minValueY, maxValueY, stepY));
        },
        setDragging (isDragging) {
            let wasDragging = isDraggingRef.current;
            isDraggingRef.current = isDragging;
            if (onChangeEnd && !isDragging && wasDragging) onChangeEnd(valueRef.current);
            setDragging(isDragging);
        },
        isDragging: isDragging,
        getDisplayColor () {
            return color.withChannelValue('alpha', 1);
        }
    };
}


//# sourceMappingURL=useColorAreaState.cjs.map
