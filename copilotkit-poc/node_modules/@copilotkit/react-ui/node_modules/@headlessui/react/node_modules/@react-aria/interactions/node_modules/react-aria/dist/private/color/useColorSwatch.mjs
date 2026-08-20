import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $4Q4jn$intlStringsmjs from "./intlStrings.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMemo as $4Q4jn$useMemo} from "react";
import {parseColor as $4Q4jn$parseColor} from "react-stately/Color";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 






function $e5a5f96be620862b$export$9060ae606178d849(props) {
    let { color: value, colorName: colorName } = props;
    let nonNullValue = value || '#fff0';
    let color = (0, $4Q4jn$useMemo)(()=>typeof nonNullValue === 'string' ? (0, $4Q4jn$parseColor)(nonNullValue) : nonNullValue, [
        nonNullValue
    ]);
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let DOMProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4Q4jn$intlStringsmjs))), '@react-aria/color');
    let id = (0, $390e54f620492c70$export$f680877a34711e37)(props.id);
    if (!colorName) colorName = color.getChannelValue('alpha') === 0 ? stringFormatter.format('transparent') : color.getColorName(locale);
    return {
        colorSwatchProps: {
            ...DOMProps,
            role: 'img',
            'aria-roledescription': stringFormatter.format('colorSwatch'),
            'aria-label': [
                colorName,
                props['aria-label'] || ''
            ].filter(Boolean).join(', '),
            'aria-labelledby': props['aria-labelledby'] ? `${id} ${props['aria-labelledby']}` : undefined,
            id: id,
            style: {
                backgroundColor: color.toString('css'),
                // @ts-ignore
                forcedColorAdjust: 'none'
            }
        },
        color: color || null
    };
}


export {$e5a5f96be620862b$export$9060ae606178d849 as useColorSwatch};
//# sourceMappingURL=useColorSwatch.mjs.map
