import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import $lR4Ol$intlStringsjs from "./intlStrings.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useMemo as $lR4Ol$useMemo} from "react";
import {parseColor as $lR4Ol$parseColor} from "react-stately/Color";


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






function $f97f82eaa80694cc$export$9060ae606178d849(props) {
    let { color: value, colorName: colorName } = props;
    let nonNullValue = value || '#fff0';
    let color = (0, $lR4Ol$useMemo)(()=>typeof nonNullValue === 'string' ? (0, $lR4Ol$parseColor)(nonNullValue) : nonNullValue, [
        nonNullValue
    ]);
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let DOMProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($lR4Ol$intlStringsjs))), '@react-aria/color');
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)(props.id);
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


export {$f97f82eaa80694cc$export$9060ae606178d849 as useColorSwatch};
//# sourceMappingURL=useColorSwatch.js.map
