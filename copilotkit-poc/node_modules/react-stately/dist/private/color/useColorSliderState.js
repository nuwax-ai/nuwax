import {normalizeColor as $9be7d47340a9a2a9$export$4cde5df63f53f473, parseColor as $9be7d47340a9a2a9$export$6e865ea70d7724f} from "./Color.js";
import {useSliderState as $194316de6a67a627$export$e5fda3247f5d67f9} from "../slider/useSliderState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMemo as $j36eq$useMemo, useState as $j36eq$useState} from "react";

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



function $a7195b2e78c1d0c1$export$57bc203e1c9c6d44(props) {
    let { channel: channel, colorSpace: colorSpace, value: value, defaultValue: defaultValue, onChange: onChange, locale: locale, ...otherProps } = props;
    if (value == null && defaultValue == null) throw new Error('useColorSliderState requires a value or defaultValue');
    if (value) value = (0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(value);
    if (defaultValue) defaultValue = (0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(defaultValue);
    // safe to cast value and defaultValue to Color, one of them will always be defined because if neither are, we throw an error
    let [colorValue, setColor] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(value, defaultValue, onChange);
    let color = (0, $j36eq$useMemo)(()=>colorSpace && colorValue ? colorValue.toFormat(colorSpace) : colorValue, [
        colorValue,
        colorSpace
    ]);
    let [initialValue] = (0, $j36eq$useState)(colorValue);
    let defaultColorValue = defaultValue !== null && defaultValue !== void 0 ? defaultValue : initialValue;
    let defaultColor = (0, $j36eq$useMemo)(()=>colorSpace && defaultColorValue ? defaultColorValue.toFormat(colorSpace) : defaultColorValue, [
        defaultColorValue,
        colorSpace
    ]);
    let numberFormatter = (0, $j36eq$useMemo)(()=>new Intl.NumberFormat(), []);
    let sliderState = (0, $194316de6a67a627$export$e5fda3247f5d67f9)({
        ...color.getChannelRange(channel),
        ...otherProps,
        numberFormatter: numberFormatter,
        value: color.getChannelValue(channel),
        defaultValue: defaultColor.getChannelValue(channel),
        onChange (v) {
            setColor(color.withChannelValue(channel, v));
        },
        onChangeEnd (v) {
            // onChange will have already been called with the right value, this is just to trigger onChangeEnd
            if (props.onChangeEnd) props.onChangeEnd(color.withChannelValue(channel, v));
        }
    });
    let { step: step, pageSize: pageSize } = color.getChannelRange(channel);
    return {
        ...sliderState,
        value: color,
        setValue (value) {
            setColor((0, $9be7d47340a9a2a9$export$4cde5df63f53f473)(value));
        },
        getDisplayColor () {
            switch(channel){
                case 'hue':
                    return (0, $9be7d47340a9a2a9$export$6e865ea70d7724f)(`hsl(${color.getChannelValue('hue')}, 100%, 50%)`);
                case 'lightness':
                case 'brightness':
                case 'saturation':
                case 'red':
                case 'green':
                case 'blue':
                    return color.withChannelValue('alpha', 1);
                case 'alpha':
                    return color;
                default:
                    throw new Error('Unknown color channel: ' + channel);
            }
        },
        getThumbValueLabel () {
            return color.formatChannelValue(channel, locale);
        },
        getFormattedValue () {
            return color.formatChannelValue(channel, locale);
        },
        step: step,
        pageSize: pageSize,
        isDragging: sliderState.isThumbDragging(0)
    };
}


export {$a7195b2e78c1d0c1$export$57bc203e1c9c6d44 as useColorSliderState};
//# sourceMappingURL=useColorSliderState.js.map
