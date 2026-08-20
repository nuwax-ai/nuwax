var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $ec895d26f03379ea$exports = require("../label/useLabel.cjs");
var $976551622437d5fc$exports = require("../i18n/useNumberFormatter.cjs");
var $V9ZWo$reactstatelyprivateutilsnumber = require("react-stately/private/utils/number");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useProgressBar", function () { return $35e36a915fcc465d$export$ed5abd763a836edc; });
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




function $35e36a915fcc465d$export$ed5abd763a836edc(props) {
    let { value: value = 0, minValue: minValue = 0, maxValue: maxValue = 100, valueLabel: valueLabel, isIndeterminate: isIndeterminate, formatOptions: formatOptions = {
        style: 'percent'
    } } = props;
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $ec895d26f03379ea$exports.useLabel)({
        ...props,
        // Progress bar is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span'
    });
    value = (0, $V9ZWo$reactstatelyprivateutilsnumber.clamp)(value, minValue, maxValue);
    let percentage = (value - minValue) / (maxValue - minValue);
    let formatter = (0, $976551622437d5fc$exports.useNumberFormatter)(formatOptions);
    if (!isIndeterminate && !valueLabel) {
        let valueToFormat = formatOptions.style === 'percent' ? percentage : value;
        valueLabel = formatter.format(valueToFormat);
    }
    return {
        progressBarProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
            ...fieldProps,
            'aria-valuenow': isIndeterminate ? undefined : value,
            'aria-valuemin': minValue,
            'aria-valuemax': maxValue,
            'aria-valuetext': isIndeterminate ? undefined : valueLabel,
            role: 'progressbar'
        }),
        labelProps: labelProps
    };
}


//# sourceMappingURL=useProgressBar.cjs.map
