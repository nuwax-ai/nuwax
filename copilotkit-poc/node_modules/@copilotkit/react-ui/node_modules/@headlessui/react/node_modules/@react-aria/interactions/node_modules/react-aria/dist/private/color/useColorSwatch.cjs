var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $5238d354a367c7e7$exports = require("./intlStrings.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $dKFpA$react = require("react");
var $dKFpA$reactstatelyColor = require("react-stately/Color");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorSwatch", function () { return $d2bf7b49920c8c58$export$9060ae606178d849; });
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






function $d2bf7b49920c8c58$export$9060ae606178d849(props) {
    let { color: value, colorName: colorName } = props;
    let nonNullValue = value || '#fff0';
    let color = (0, $dKFpA$react.useMemo)(()=>typeof nonNullValue === 'string' ? (0, $dKFpA$reactstatelyColor.parseColor)(nonNullValue) : nonNullValue, [
        nonNullValue
    ]);
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let DOMProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($5238d354a367c7e7$exports))), '@react-aria/color');
    let id = (0, $7ac82d1fee77eb8a$exports.useId)(props.id);
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


//# sourceMappingURL=useColorSwatch.cjs.map
