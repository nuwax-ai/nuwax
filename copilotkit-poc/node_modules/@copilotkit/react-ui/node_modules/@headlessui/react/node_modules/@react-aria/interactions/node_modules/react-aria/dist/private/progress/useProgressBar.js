import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLabel as $6dc0ccf02415c0af$export$8467354a121f1b9f} from "../label/useLabel.js";
import {useNumberFormatter as $1dc719caba1a3f1f$export$b7a616150fdb9f44} from "../i18n/useNumberFormatter.js";
import {clamp as $jEqne$clamp} from "react-stately/private/utils/number";

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




function $b48d94bfbb2289af$export$ed5abd763a836edc(props) {
    let { value: value = 0, minValue: minValue = 0, maxValue: maxValue = 100, valueLabel: valueLabel, isIndeterminate: isIndeterminate, formatOptions: formatOptions = {
        style: 'percent'
    } } = props;
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $6dc0ccf02415c0af$export$8467354a121f1b9f)({
        ...props,
        // Progress bar is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span'
    });
    value = (0, $jEqne$clamp)(value, minValue, maxValue);
    let percentage = (value - minValue) / (maxValue - minValue);
    let formatter = (0, $1dc719caba1a3f1f$export$b7a616150fdb9f44)(formatOptions);
    if (!isIndeterminate && !valueLabel) {
        let valueToFormat = formatOptions.style === 'percent' ? percentage : value;
        valueLabel = formatter.format(valueToFormat);
    }
    return {
        progressBarProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
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


export {$b48d94bfbb2289af$export$ed5abd763a836edc as useProgressBar};
//# sourceMappingURL=useProgressBar.js.map
