var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $3kLXS$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useRadioGroupState", function () { return $b9c251c9b17ebe47$export$bca9d026f8e704eb; });
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


let $b9c251c9b17ebe47$var$instance = Math.round(Math.random() * 10000000000);
let $b9c251c9b17ebe47$var$i = 0;
function $b9c251c9b17ebe47$export$bca9d026f8e704eb(props) {
    // Preserved here for backward compatibility. React Aria now generates the name instead of stately.
    let name = (0, $3kLXS$react.useMemo)(()=>props.name || `radio-group-${$b9c251c9b17ebe47$var$instance}-${++$b9c251c9b17ebe47$var$i}`, [
        props.name
    ]);
    let [selectedValue, setSelected] = (0, $14cedf286405cc4b$exports.useControlledState)(props.value, props.defaultValue ?? null, props.onChange);
    let [initialValue] = (0, $3kLXS$react.useState)(selectedValue);
    let [lastFocusedValue, setLastFocusedValue] = (0, $3kLXS$react.useState)(null);
    let validation = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
        ...props,
        value: selectedValue
    });
    let setSelectedValue = (value)=>{
        if (!props.isReadOnly && !props.isDisabled) {
            setSelected(value);
            validation.commitValidation();
        }
    };
    let isInvalid = validation.displayValidation.isInvalid;
    return {
        ...validation,
        name: name,
        selectedValue: selectedValue,
        defaultSelectedValue: props.value !== undefined ? initialValue : props.defaultValue ?? null,
        setSelectedValue: setSelectedValue,
        lastFocusedValue: lastFocusedValue,
        setLastFocusedValue: setLastFocusedValue,
        isDisabled: props.isDisabled || false,
        isReadOnly: props.isReadOnly || false,
        isRequired: props.isRequired || false,
        validationState: props.validationState || (isInvalid ? 'invalid' : null),
        isInvalid: isInvalid
    };
}


//# sourceMappingURL=useRadioGroupState.cjs.map
