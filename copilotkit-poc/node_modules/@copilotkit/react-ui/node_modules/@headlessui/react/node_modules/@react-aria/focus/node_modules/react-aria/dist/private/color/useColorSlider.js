import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSlider as $da0bbb7d9303a211$export$56b2c08e277f365} from "../slider/useSlider.js";
import {useSliderThumb as $299655936625c2f6$export$8d15029008292ae} from "../slider/useSliderThumb.js";
import {useVisuallyHidden as $6947385881e3ae0e$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.js";

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




function $89c570c29f2408b1$export$106b7a4e66508f66(props, state) {
    let { trackRef: trackRef, inputRef: inputRef, orientation: orientation, channel: channel, 'aria-label': ariaLabel, name: name, form: form } = props;
    let { locale: locale, direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    // Provide a default aria-label if there is no other label provided.
    if (!props.label && !ariaLabel && !props['aria-labelledby']) ariaLabel = state.value.getChannelName(channel, locale);
    let { groupProps: groupProps, trackProps: trackProps, labelProps: labelProps, outputProps: outputProps } = (0, $da0bbb7d9303a211$export$56b2c08e277f365)(// @ts-ignore - ignore unused incompatible props
    {
        ...props,
        'aria-label': ariaLabel
    }, state, trackRef);
    let { inputProps: inputProps, thumbProps: thumbProps } = (0, $299655936625c2f6$export$8d15029008292ae)({
        index: 0,
        orientation: orientation,
        isDisabled: props.isDisabled,
        name: name,
        form: form,
        trackRef: trackRef,
        inputRef: inputRef
    }, state);
    let value = state.getDisplayColor();
    let generateBackground = ()=>{
        let to;
        if (orientation === 'vertical') to = 'top';
        else if (direction === 'ltr') to = 'right';
        else to = 'left';
        switch(channel){
            case 'hue':
                {
                    let stops = [
                        0,
                        60,
                        120,
                        180,
                        240,
                        300,
                        360
                    ].map((hue)=>value.withChannelValue('hue', hue).toString('css')).join(', ');
                    return `linear-gradient(to ${to}, ${stops})`;
                }
            case 'lightness':
                {
                    // We have to add an extra color stop in the middle so that the hue shows up at all.
                    // Otherwise it will always just be black to white.
                    let min = state.getThumbMinValue(0);
                    let max = state.getThumbMaxValue(0);
                    let start = value.withChannelValue(channel, min).toString('css');
                    let middle = value.withChannelValue(channel, (max - min) / 2).toString('css');
                    let end = value.withChannelValue(channel, max).toString('css');
                    return `linear-gradient(to ${to}, ${start}, ${middle}, ${end})`;
                }
            case 'saturation':
            case 'brightness':
            case 'red':
            case 'green':
            case 'blue':
            case 'alpha':
                {
                    let start = value.withChannelValue(channel, state.getThumbMinValue(0)).toString('css');
                    let end = value.withChannelValue(channel, state.getThumbMaxValue(0)).toString('css');
                    return `linear-gradient(to ${to}, ${start}, ${end})`;
                }
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    };
    let forcedColorAdjustNoneStyle = {
        forcedColorAdjust: 'none'
    };
    if (channel === 'hue') inputProps['aria-valuetext'] += `, ${value.getHueName(locale)}`;
    else if (channel !== 'alpha') inputProps['aria-valuetext'] += `, ${value.getColorName(locale)}`;
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $6947385881e3ae0e$export$a966af930f325cab)({
        style: {
            opacity: '0.0001',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        }
    });
    return {
        trackProps: {
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(groupProps, trackProps),
            style: {
                ...trackProps.style,
                ...forcedColorAdjustNoneStyle,
                background: generateBackground()
            }
        },
        inputProps: {
            ...inputProps,
            style: {
                ...inputProps.style,
                ...visuallyHiddenProps.style
            }
        },
        thumbProps: {
            ...thumbProps,
            style: {
                ...thumbProps.style,
                ...forcedColorAdjustNoneStyle
            }
        },
        labelProps: labelProps,
        outputProps: outputProps
    };
}


export {$89c570c29f2408b1$export$106b7a4e66508f66 as useColorSlider};
//# sourceMappingURL=useColorSlider.js.map
