var $erBUj$react = require("react");
var $erBUj$reactstatelyColor = require("react-stately/Color");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorAreaGradient", function () { return $2783252b9fee866f$export$dd62420467d245ca; });
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

const $2783252b9fee866f$var$hue = (color)=>[
        0,
        60,
        120,
        180,
        240,
        300,
        360
    ].map((hue)=>color.withChannelValue('hue', hue).toString('css')).join(', ');
const $2783252b9fee866f$var$saturation = (color)=>`${color.withChannelValue('saturation', 0)}, transparent`;
const $2783252b9fee866f$var$hslChannels = {
    hue: $2783252b9fee866f$var$hue,
    saturation: $2783252b9fee866f$var$saturation,
    lightness: ()=>'black, transparent, white'
};
const $2783252b9fee866f$var$hsbChannels = {
    hue: $2783252b9fee866f$var$hue,
    saturation: $2783252b9fee866f$var$saturation,
    brightness: ()=>'black, transparent'
};
function $2783252b9fee866f$export$dd62420467d245ca({ direction: direction, state: state, zChannel: zChannel, xChannel: xChannel, yChannel: yChannel }) {
    let returnVal = (0, $erBUj$react.useMemo)(()=>{
        let end = direction === 'rtl' ? 'left' : 'right';
        let colorAreaStyles = {};
        let zValue = state.value.getChannelValue(zChannel);
        switch(state.value.getColorSpace()){
            case 'rgb':
                {
                    let rgb = (0, $erBUj$reactstatelyColor.parseColor)('rgb(0, 0, 0)');
                    colorAreaStyles = {
                        background: [
                            // The screen blend mode multiplies the inverse of each channel, e.g. 1 - (1 - a) * (1 - b).
                            // Create a layer for each channel, with the other channels as 0. After blending, this should
                            // result in the gradients being combined channel by channel.
                            `linear-gradient(to ${end}, ${rgb.withChannelValue(xChannel, 0)}, ${rgb.withChannelValue(xChannel, 255)})`,
                            `linear-gradient(to top, ${rgb.withChannelValue(yChannel, 0)}, ${rgb.withChannelValue(yChannel, 255)})`,
                            rgb.withChannelValue(zChannel, zValue)
                        ].join(','),
                        backgroundBlendMode: 'screen'
                    };
                    break;
                }
            case 'hsl':
                {
                    let channels = state.value.getColorChannels();
                    let value = (0, $erBUj$reactstatelyColor.parseColor)('hsl(0, 100%, 50%)').withChannelValue(zChannel, zValue);
                    let bg = channels.filter((c)=>c !== zChannel).map((c)=>`linear-gradient(to ${c === xChannel ? end : 'top'}, ${$2783252b9fee866f$var$hslChannels[c](value)})`).reverse();
                    if (zChannel === 'hue') bg.push(value.toString('css'));
                    colorAreaStyles = {
                        background: bg.join(', ')
                    };
                    break;
                }
            case 'hsb':
                {
                    let channels = state.value.getColorChannels();
                    let value = (0, $erBUj$reactstatelyColor.parseColor)('hsb(0, 100%, 100%)').withChannelValue(zChannel, zValue);
                    let bg = channels.filter((c)=>c !== zChannel).map((c)=>`linear-gradient(to ${c === xChannel ? end : 'top'}, ${$2783252b9fee866f$var$hsbChannels[c](value)})`).reverse();
                    if (zChannel === 'hue') bg.push(value.toString('css'));
                    colorAreaStyles = {
                        background: bg.join(', ')
                    };
                    break;
                }
        }
        let { x: x, y: y } = state.getThumbPosition();
        if (direction === 'rtl') x = 1 - x;
        let forcedColorAdjustNoneStyle = {
            forcedColorAdjust: 'none'
        };
        return {
            colorAreaStyleProps: {
                style: {
                    position: 'relative',
                    touchAction: 'none',
                    ...forcedColorAdjustNoneStyle,
                    ...colorAreaStyles
                }
            },
            thumbStyleProps: {
                style: {
                    position: 'absolute',
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                    ...forcedColorAdjustNoneStyle
                }
            }
        };
    }, [
        direction,
        state,
        zChannel,
        xChannel,
        yChannel
    ]);
    return returnVal;
}


//# sourceMappingURL=useColorAreaGradient.cjs.map
