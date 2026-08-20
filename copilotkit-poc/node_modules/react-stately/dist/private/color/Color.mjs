import {clamp as $240e9101ba2842f5$export$7d15b64cf5a3a4c4, toFixedNumber as $240e9101ba2842f5$export$b6268554fba451f} from "../utils/number.mjs";
import $fzG9x$intlStringsmjs from "./intlStrings.mjs";
import {LocalizedStringDictionary as $fzG9x$LocalizedStringDictionary, LocalizedStringFormatter as $fzG9x$LocalizedStringFormatter} from "@internationalized/string";
import {NumberFormatter as $fzG9x$NumberFormatter} from "@internationalized/number";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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



let $890783418b00a858$var$dictionary = new (0, $fzG9x$LocalizedStringDictionary)((0, ($parcel$interopDefault($fzG9x$intlStringsmjs))));
function $890783418b00a858$export$6e865ea70d7724f(value) {
    let res = $890783418b00a858$var$RGBColor.parse(value) || $890783418b00a858$var$HSBColor.parse(value) || $890783418b00a858$var$HSLColor.parse(value);
    if (res) return res;
    throw new Error('Invalid color value: ' + value);
}
function $890783418b00a858$export$4cde5df63f53f473(v) {
    if (typeof v === 'string') return $890783418b00a858$export$6e865ea70d7724f(v);
    else return v;
}
function $890783418b00a858$export$1c0c08912582810c(colorSpace) {
    switch(colorSpace){
        case 'rgb':
            return $890783418b00a858$var$RGBColor.colorChannels;
        case 'hsl':
            return $890783418b00a858$var$HSLColor.colorChannels;
        case 'hsb':
            return $890783418b00a858$var$HSBColor.colorChannels;
    }
}
function $890783418b00a858$export$87f5012e10bb20b2(hue) {
    if (hue === 360) return hue;
    return (hue % 360 + 360) % 360;
}
// Lightness threshold between orange and brown.
const $890783418b00a858$var$ORANGE_LIGHTNESS_THRESHOLD = 0.68;
// Lightness threshold between pure yellow and "yellow green".
const $890783418b00a858$var$YELLOW_GREEN_LIGHTNESS_THRESHOLD = 0.85;
// The maximum lightness considered to be "dark".
const $890783418b00a858$var$MAX_DARK_LIGHTNESS = 0.55;
// The chroma threshold between gray and color.
const $890783418b00a858$var$GRAY_THRESHOLD = 0.001;
const $890783418b00a858$var$OKLCH_HUES = [
    [
        0,
        'pink'
    ],
    [
        15,
        'red'
    ],
    [
        48,
        'orange'
    ],
    [
        94,
        'yellow'
    ],
    [
        135,
        'green'
    ],
    [
        175,
        'cyan'
    ],
    [
        264,
        'blue'
    ],
    [
        284,
        'purple'
    ],
    [
        320,
        'magenta'
    ],
    [
        349,
        'pink'
    ]
];
class $890783418b00a858$var$Color {
    toHexInt() {
        return this.toFormat('rgb').toHexInt();
    }
    getChannelValue(channel) {
        if (channel in this) return this[channel];
        throw new Error('Unsupported color channel: ' + channel);
    }
    withChannelValue(channel, value) {
        if (channel in this) {
            let x = this.clone();
            x[channel] = value;
            return x;
        }
        throw new Error('Unsupported color channel: ' + channel);
    }
    getChannelName(channel, locale) {
        let strings = (0, $fzG9x$LocalizedStringDictionary).getGlobalDictionaryForPackage('@react-stately/color') || $890783418b00a858$var$dictionary;
        return strings.getStringForLocale(channel, locale);
    }
    getColorSpaceAxes(xyChannels) {
        let { xChannel: xChannel, yChannel: yChannel } = xyChannels;
        let xCh = xChannel || this.getColorChannels().find((c)=>c !== yChannel);
        let yCh = yChannel || this.getColorChannels().find((c)=>c !== xCh);
        let zCh = this.getColorChannels().find((c)=>c !== xCh && c !== yCh);
        return {
            xChannel: xCh,
            yChannel: yCh,
            zChannel: zCh
        };
    }
    getColorName(locale) {
        // Convert to oklch color space, which has perceptually uniform lightness across all hues.
        let [l, c, h] = $890783418b00a858$var$toOKLCH(this);
        let strings = (0, $fzG9x$LocalizedStringDictionary).getGlobalDictionaryForPackage('@react-stately/color') || $890783418b00a858$var$dictionary;
        if (l > 0.999) return strings.getStringForLocale('white', locale);
        if (l < 0.001) return strings.getStringForLocale('black', locale);
        let hue;
        [hue, l] = this.getOklchHue(l, c, h, locale);
        let lightness = '';
        let chroma = '';
        if (c <= 0.1 && c >= $890783418b00a858$var$GRAY_THRESHOLD) {
            if (l >= 0.7) chroma = 'pale';
            else chroma = 'grayish';
        } else if (c >= 0.15) chroma = 'vibrant';
        if (l < 0.3) lightness = 'very dark';
        else if (l < $890783418b00a858$var$MAX_DARK_LIGHTNESS) lightness = 'dark';
        else if (l < 0.7) ;
        else if (l < 0.85) lightness = 'light';
        else lightness = 'very light';
        if (chroma) chroma = strings.getStringForLocale(chroma, locale);
        if (lightness) lightness = strings.getStringForLocale(lightness, locale);
        let alpha = this.getChannelValue('alpha');
        let formatter = new (0, $fzG9x$LocalizedStringFormatter)(locale, strings);
        if (alpha < 1) {
            let percentTransparent = new (0, $fzG9x$NumberFormatter)(locale, {
                style: 'percent'
            }).format(1 - alpha);
            return formatter.format('transparentColorName', {
                lightness: lightness,
                chroma: chroma,
                hue: hue,
                percentTransparent: percentTransparent
            }).replace(/\s+/g, ' ').trim();
        } else return formatter.format('colorName', {
            lightness: lightness,
            chroma: chroma,
            hue: hue
        }).replace(/\s+/g, ' ').trim();
    }
    getOklchHue(l, c, h, locale) {
        let strings = (0, $fzG9x$LocalizedStringDictionary).getGlobalDictionaryForPackage('@react-stately/color') || $890783418b00a858$var$dictionary;
        if (c < $890783418b00a858$var$GRAY_THRESHOLD) return [
            strings.getStringForLocale('gray', locale),
            l
        ];
        for(let i = 0; i < $890783418b00a858$var$OKLCH_HUES.length; i++){
            let [hue, hueName] = $890783418b00a858$var$OKLCH_HUES[i];
            let [nextHue, nextHueName] = $890783418b00a858$var$OKLCH_HUES[i + 1] || [
                360,
                'pink'
            ];
            if (h >= hue && h < nextHue) {
                // Split orange hue into brown/orange depending on lightness.
                if (hueName === 'orange') {
                    if (l < $890783418b00a858$var$ORANGE_LIGHTNESS_THRESHOLD) hueName = 'brown';
                    else // Adjust lightness.
                    l = l - $890783418b00a858$var$ORANGE_LIGHTNESS_THRESHOLD + $890783418b00a858$var$MAX_DARK_LIGHTNESS;
                }
                // If the hue is at least halfway to the next hue, add the next hue name as well.
                if (h > hue + (nextHue - hue) / 2 && hueName !== nextHueName) hueName = `${hueName} ${nextHueName}`;
                else if (hueName === 'yellow' && l < $890783418b00a858$var$YELLOW_GREEN_LIGHTNESS_THRESHOLD) // Yellow shifts toward green at lower lightnesses.
                hueName = 'yellow green';
                let name = strings.getStringForLocale(hueName, locale).toLocaleLowerCase(locale);
                return [
                    name,
                    l
                ];
            }
        }
        throw new Error('Unexpected hue');
    }
    getHueName(locale) {
        let [l, c, h] = $890783418b00a858$var$toOKLCH(this);
        let [name] = this.getOklchHue(l, c, h, locale);
        return name;
    }
}
class $890783418b00a858$var$RGBColor extends $890783418b00a858$var$Color {
    constructor(red, green, blue, alpha){
        super(), this.red = red, this.green = green, this.blue = blue, this.alpha = alpha;
    }
    static parse(value) {
        let colors = [];
        // matching #rgb, #rgba, #rrggbb, #rrggbbaa
        if (/^#[\da-f]+$/i.test(value) && [
            4,
            5,
            7,
            9
        ].includes(value.length)) {
            const values = (value.length < 6 ? value.replace(/[^#]/gi, '$&$&') : value).slice(1).split('');
            while(values.length > 0)colors.push(parseInt(values.splice(0, 2).join(''), 16));
            colors[3] = colors[3] !== undefined ? colors[3] / 255 : undefined;
        }
        // matching rgb(rrr, ggg, bbb), rgba(rrr, ggg, bbb, 0.a)
        const match = value.match(/^rgba?\((.*)\)$/);
        if (match?.[1]) {
            colors = match[1].split(',').map((value)=>Number(value.trim()));
            colors = colors.map((num, i)=>{
                return (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(num ?? 0, 0, i < 3 ? 255 : 1);
            });
        }
        if (colors[0] === undefined || colors[1] === undefined || colors[2] === undefined) return undefined;
        return colors.length < 3 ? undefined : new $890783418b00a858$var$RGBColor(colors[0], colors[1], colors[2], colors[3] ?? 1);
    }
    toString(format = 'css') {
        switch(format){
            case 'hex':
                return '#' + (this.red.toString(16).padStart(2, '0') + this.green.toString(16).padStart(2, '0') + this.blue.toString(16).padStart(2, '0')).toUpperCase();
            case 'hexa':
                return '#' + (this.red.toString(16).padStart(2, '0') + this.green.toString(16).padStart(2, '0') + this.blue.toString(16).padStart(2, '0') + Math.round(this.alpha * 255).toString(16).padStart(2, '0')).toUpperCase();
            case 'rgb':
                return `rgb(${this.red}, ${this.green}, ${this.blue})`;
            case 'css':
            case 'rgba':
                return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
            default:
                return this.toFormat(format).toString(format);
        }
    }
    toFormat(format) {
        switch(format){
            case 'hex':
            case 'hexa':
            case 'rgb':
            case 'rgba':
                return this;
            case 'hsb':
            case 'hsba':
                return this.toHSB();
            case 'hsl':
            case 'hsla':
                return this.toHSL();
            default:
                throw new Error('Unsupported color conversion: rgb -> ' + format);
        }
    }
    toHexInt() {
        return this.red << 16 | this.green << 8 | this.blue;
    }
    /**
   * Converts an RGB color value to HSB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB.
   *
   * @returns An HSBColor object.
   */ toHSB() {
        const red = this.red / 255;
        const green = this.green / 255;
        const blue = this.blue / 255;
        const min = Math.min(red, green, blue);
        const brightness = Math.max(red, green, blue);
        const chroma = brightness - min;
        const saturation = brightness === 0 ? 0 : chroma / brightness;
        let hue = 0; // achromatic
        if (chroma !== 0) {
            switch(brightness){
                case red:
                    hue = (green - blue) / chroma + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / chroma + 2;
                    break;
                case blue:
                    hue = (red - green) / chroma + 4;
                    break;
            }
            hue /= 6;
        }
        return new $890783418b00a858$var$HSBColor((0, $240e9101ba2842f5$export$b6268554fba451f)(hue * 360, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(saturation * 100, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(brightness * 100, 2), this.alpha);
    }
    /**
   * Converts an RGB color value to HSL.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB.
   *
   * @returns An HSLColor object.
   */ toHSL() {
        const red = this.red / 255;
        const green = this.green / 255;
        const blue = this.blue / 255;
        const min = Math.min(red, green, blue);
        const max = Math.max(red, green, blue);
        const lightness = (max + min) / 2;
        const chroma = max - min;
        let hue;
        let saturation;
        if (chroma === 0) hue = saturation = 0; // achromatic
        else {
            saturation = chroma / (lightness < 0.5 ? max + min : 2 - max - min);
            switch(max){
                case red:
                    hue = (green - blue) / chroma + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / chroma + 2;
                    break;
                case blue:
                default:
                    hue = (red - green) / chroma + 4;
                    break;
            }
            hue /= 6;
        }
        return new $890783418b00a858$var$HSLColor((0, $240e9101ba2842f5$export$b6268554fba451f)(hue * 360, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(saturation * 100, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(lightness * 100, 2), this.alpha);
    }
    clone() {
        return new $890783418b00a858$var$RGBColor(this.red, this.green, this.blue, this.alpha);
    }
    getChannelRange(channel) {
        switch(channel){
            case 'red':
            case 'green':
            case 'blue':
                return {
                    minValue: 0x0,
                    maxValue: 0xff,
                    step: 0x1,
                    pageSize: 0x11
                };
            case 'alpha':
                return {
                    minValue: 0,
                    maxValue: 1,
                    step: 0.01,
                    pageSize: 0.1
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    getChannelFormatOptions(channel) {
        switch(channel){
            case 'red':
            case 'green':
            case 'blue':
                return {
                    style: 'decimal'
                };
            case 'alpha':
                return {
                    style: 'percent'
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    formatChannelValue(channel, locale) {
        let options = this.getChannelFormatOptions(channel);
        let value = this.getChannelValue(channel);
        return new (0, $fzG9x$NumberFormatter)(locale, options).format(value);
    }
    getColorSpace() {
        return 'rgb';
    }
    static{
        this.colorChannels = [
            'red',
            'green',
            'blue'
        ];
    }
    getColorChannels() {
        return $890783418b00a858$var$RGBColor.colorChannels;
    }
}
// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsb(X, X%, X%)
// - hsba(X, X%, X%, X)
const $890783418b00a858$var$HSB_REGEX = /hsb\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsba\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;
class $890783418b00a858$var$HSBColor extends $890783418b00a858$var$Color {
    constructor(hue, saturation, brightness, alpha){
        super(), this.hue = hue, this.saturation = saturation, this.brightness = brightness, this.alpha = alpha;
    }
    static parse(value) {
        let m;
        if (m = value.match($890783418b00a858$var$HSB_REGEX)) {
            const [h, s, b, a] = (m[1] ?? m[2]).split(',').map((n)=>Number(n.trim().replace('%', '')));
            return new $890783418b00a858$var$HSBColor($890783418b00a858$export$87f5012e10bb20b2(h), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(s, 0, 100), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(b, 0, 100), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(a ?? 1, 0, 1));
        }
    }
    toString(format = 'css') {
        switch(format){
            case 'css':
                return this.toHSL().toString('css');
            case 'hex':
                return this.toRGB().toString('hex');
            case 'hexa':
                return this.toRGB().toString('hexa');
            case 'hsb':
                return `hsb(${this.hue}, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.saturation, 2)}%, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.brightness, 2)}%)`;
            case 'hsba':
                return `hsba(${this.hue}, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.saturation, 2)}%, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.brightness, 2)}%, ${this.alpha})`;
            default:
                return this.toFormat(format).toString(format);
        }
    }
    toFormat(format) {
        switch(format){
            case 'hsb':
            case 'hsba':
                return this;
            case 'hsl':
            case 'hsla':
                return this.toHSL();
            case 'rgb':
            case 'rgba':
                return this.toRGB();
            default:
                throw new Error('Unsupported color conversion: hsb -> ' + format);
        }
    }
    /**
   * Converts a HSB color to HSL.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL.
   *
   * @returns An HSLColor object.
   */ toHSL() {
        let saturation = this.saturation / 100;
        let brightness = this.brightness / 100;
        let lightness = brightness * (1 - saturation / 2);
        saturation = lightness === 0 || lightness === 1 ? 0 : (brightness - lightness) / Math.min(lightness, 1 - lightness);
        return new $890783418b00a858$var$HSLColor((0, $240e9101ba2842f5$export$b6268554fba451f)(this.hue, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(saturation * 100, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(lightness * 100, 2), this.alpha);
    }
    /**
   * Converts a HSV color value to RGB. Conversion formula adapted from
   * https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative.
   *
   * @returns An RGBColor object.
   */ toRGB() {
        let hue = this.hue;
        let saturation = this.saturation / 100;
        let brightness = this.brightness / 100;
        let fn = (n, k = (n + hue / 60) % 6)=>brightness - saturation * brightness * Math.max(Math.min(k, 4 - k, 1), 0);
        return new $890783418b00a858$var$RGBColor(Math.round(fn(5) * 255), Math.round(fn(3) * 255), Math.round(fn(1) * 255), this.alpha);
    }
    clone() {
        return new $890783418b00a858$var$HSBColor(this.hue, this.saturation, this.brightness, this.alpha);
    }
    getChannelRange(channel) {
        switch(channel){
            case 'hue':
                return {
                    minValue: 0,
                    maxValue: 360,
                    step: 1,
                    pageSize: 15
                };
            case 'saturation':
            case 'brightness':
                return {
                    minValue: 0,
                    maxValue: 100,
                    step: 1,
                    pageSize: 10
                };
            case 'alpha':
                return {
                    minValue: 0,
                    maxValue: 1,
                    step: 0.01,
                    pageSize: 0.1
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    getChannelFormatOptions(channel) {
        switch(channel){
            case 'hue':
                return {
                    style: 'unit',
                    unit: 'degree',
                    unitDisplay: 'narrow'
                };
            case 'saturation':
            case 'brightness':
            case 'alpha':
                return {
                    style: 'percent'
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    formatChannelValue(channel, locale) {
        let options = this.getChannelFormatOptions(channel);
        let value = this.getChannelValue(channel);
        if (channel === 'saturation' || channel === 'brightness') value /= 100;
        return new (0, $fzG9x$NumberFormatter)(locale, options).format(value);
    }
    getColorSpace() {
        return 'hsb';
    }
    static{
        this.colorChannels = [
            'hue',
            'saturation',
            'brightness'
        ];
    }
    getColorChannels() {
        return $890783418b00a858$var$HSBColor.colorChannels;
    }
}
// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsl(X, X%, X%)
// - hsla(X, X%, X%, X)
const $890783418b00a858$var$HSL_REGEX = /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;
class $890783418b00a858$var$HSLColor extends $890783418b00a858$var$Color {
    constructor(hue, saturation, lightness, alpha){
        super(), this.hue = hue, this.saturation = saturation, this.lightness = lightness, this.alpha = alpha;
    }
    static parse(value) {
        let m;
        if (m = value.match($890783418b00a858$var$HSL_REGEX)) {
            const [h, s, l, a] = (m[1] ?? m[2]).split(',').map((n)=>Number(n.trim().replace('%', '')));
            return new $890783418b00a858$var$HSLColor($890783418b00a858$export$87f5012e10bb20b2(h), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(s, 0, 100), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(l, 0, 100), (0, $240e9101ba2842f5$export$7d15b64cf5a3a4c4)(a ?? 1, 0, 1));
        }
    }
    toString(format = 'css') {
        switch(format){
            case 'hex':
                return this.toRGB().toString('hex');
            case 'hexa':
                return this.toRGB().toString('hexa');
            case 'hsl':
                return `hsl(${this.hue}, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.saturation, 2)}%, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.lightness, 2)}%)`;
            case 'css':
            case 'hsla':
                return `hsla(${this.hue}, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.saturation, 2)}%, ${(0, $240e9101ba2842f5$export$b6268554fba451f)(this.lightness, 2)}%, ${this.alpha})`;
            default:
                return this.toFormat(format).toString(format);
        }
    }
    toFormat(format) {
        switch(format){
            case 'hsl':
            case 'hsla':
                return this;
            case 'hsb':
            case 'hsba':
                return this.toHSB();
            case 'rgb':
            case 'rgba':
                return this.toRGB();
            default:
                throw new Error('Unsupported color conversion: hsl -> ' + format);
        }
    }
    /**
   * Converts a HSL color to HSB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_HSV.
   *
   * @returns An HSBColor object.
   */ toHSB() {
        let saturation = this.saturation / 100;
        let lightness = this.lightness / 100;
        let brightness = lightness + saturation * Math.min(lightness, 1 - lightness);
        saturation = brightness === 0 ? 0 : 2 * (1 - lightness / brightness);
        return new $890783418b00a858$var$HSBColor((0, $240e9101ba2842f5$export$b6268554fba451f)(this.hue, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(saturation * 100, 2), (0, $240e9101ba2842f5$export$b6268554fba451f)(brightness * 100, 2), this.alpha);
    }
    /**
   * Converts a HSL color to RGB. Conversion formula adapted from
   * https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative.
   *
   * @returns An RGBColor object.
   */ toRGB() {
        let hue = this.hue;
        let saturation = this.saturation / 100;
        let lightness = this.lightness / 100;
        let a = saturation * Math.min(lightness, 1 - lightness);
        let fn = (n, k = (n + hue / 30) % 12)=>lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return new $890783418b00a858$var$RGBColor(Math.round(fn(0) * 255), Math.round(fn(8) * 255), Math.round(fn(4) * 255), this.alpha);
    }
    clone() {
        return new $890783418b00a858$var$HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
    }
    getChannelRange(channel) {
        switch(channel){
            case 'hue':
                return {
                    minValue: 0,
                    maxValue: 360,
                    step: 1,
                    pageSize: 15
                };
            case 'saturation':
            case 'lightness':
                return {
                    minValue: 0,
                    maxValue: 100,
                    step: 1,
                    pageSize: 10
                };
            case 'alpha':
                return {
                    minValue: 0,
                    maxValue: 1,
                    step: 0.01,
                    pageSize: 0.1
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    getChannelFormatOptions(channel) {
        switch(channel){
            case 'hue':
                return {
                    style: 'unit',
                    unit: 'degree',
                    unitDisplay: 'narrow'
                };
            case 'saturation':
            case 'lightness':
            case 'alpha':
                return {
                    style: 'percent'
                };
            default:
                throw new Error('Unknown color channel: ' + channel);
        }
    }
    formatChannelValue(channel, locale) {
        let options = this.getChannelFormatOptions(channel);
        let value = this.getChannelValue(channel);
        if (channel === 'saturation' || channel === 'lightness') value /= 100;
        return new (0, $fzG9x$NumberFormatter)(locale, options).format(value);
    }
    getColorSpace() {
        return 'hsl';
    }
    static{
        this.colorChannels = [
            'hue',
            'saturation',
            'lightness'
        ];
    }
    getColorChannels() {
        return $890783418b00a858$var$HSLColor.colorChannels;
    }
}
// https://www.w3.org/TR/css-color-4/#color-conversion-code
function $890783418b00a858$var$toOKLCH(color) {
    let rgb = color.toFormat('rgb');
    let red = rgb.getChannelValue('red') / 255;
    let green = rgb.getChannelValue('green') / 255;
    let blue = rgb.getChannelValue('blue') / 255;
    [red, green, blue] = $890783418b00a858$var$lin_sRGB(red, green, blue);
    let [x, y, z] = $890783418b00a858$var$lin_sRGB_to_XYZ(red, green, blue);
    let [l, a, b] = $890783418b00a858$var$XYZ_to_OKLab(x, y, z);
    return $890783418b00a858$var$OKLab_to_OKLCH(l, a, b);
}
function $890783418b00a858$var$OKLab_to_OKLCH(l, a, b) {
    var hue = Math.atan2(b, a) * 180 / Math.PI;
    return [
        l,
        Math.sqrt(a ** 2 + b ** 2),
        hue >= 0 ? hue : hue + 360 // Hue, in degrees [0 to 360)
    ];
}
function $890783418b00a858$var$lin_sRGB(r, g, b) {
    // convert an array of sRGB values
    // where in-gamut values are in the range [0 - 1]
    // to linear light (un-companded) form.
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // for negative values,  linear portion is extended on reflection of axis,
    // then reflected power function is used.
    return [
        $890783418b00a858$var$lin_sRGB_component(r),
        $890783418b00a858$var$lin_sRGB_component(g),
        $890783418b00a858$var$lin_sRGB_component(b)
    ];
}
function $890783418b00a858$var$lin_sRGB_component(val) {
    let sign = val < 0 ? -1 : 1;
    let abs = Math.abs(val);
    if (abs <= 0.04045) return val / 12.92;
    return sign * Math.pow((abs + 0.055) / 1.055, 2.4);
}
function $890783418b00a858$var$lin_sRGB_to_XYZ(r, g, b) {
    // convert an array of linear-light sRGB values to CIE XYZ
    // using sRGB's own white, D65 (no chromatic adaptation)
    const M = [
        506752 / 1228815,
        87881 / 245763,
        12673 / 70218,
        87098 / 409605,
        175762 / 245763,
        12673 / 175545,
        7918 / 409605,
        87881 / 737289,
        1001167 / 1053270
    ];
    return $890783418b00a858$var$multiplyMatrix(M, r, g, b);
}
function $890783418b00a858$var$XYZ_to_OKLab(x, y, z) {
    // Given XYZ relative to D65, convert to OKLab
    const XYZtoLMS = [
        0.819022437996703,
        0.3619062600528904,
        -0.1288737815209879,
        0.0329836539323885,
        0.9292868615863434,
        0.0361446663506424,
        0.0481771893596242,
        0.2642395317527308,
        0.6335478284694309
    ];
    const LMStoOKLab = [
        0.210454268309314,
        0.7936177747023054,
        -0.0040720430116193,
        1.9779985324311684,
        -2.42859224204858,
        0.450593709617411,
        0.0259040424655478,
        0.7827717124575296,
        -0.8086757549230774
    ];
    let [a, b, c] = $890783418b00a858$var$multiplyMatrix(XYZtoLMS, x, y, z);
    return $890783418b00a858$var$multiplyMatrix(LMStoOKLab, Math.cbrt(a), Math.cbrt(b), Math.cbrt(c));
}
function $890783418b00a858$var$multiplyMatrix(m, x, y, z) {
    let a = m[0] * x + m[1] * y + m[2] * z;
    let b = m[3] * x + m[4] * y + m[5] * z;
    let c = m[6] * x + m[7] * y + m[8] * z;
    return [
        a,
        b,
        c
    ];
}


export {$890783418b00a858$export$6e865ea70d7724f as parseColor, $890783418b00a858$export$4cde5df63f53f473 as normalizeColor, $890783418b00a858$export$1c0c08912582810c as getColorChannels, $890783418b00a858$export$87f5012e10bb20b2 as normalizeHue};
//# sourceMappingURL=Color.mjs.map
