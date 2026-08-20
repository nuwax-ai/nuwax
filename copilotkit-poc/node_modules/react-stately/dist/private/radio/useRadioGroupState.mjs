import {useFormValidationState as $fd2148440a13ec26$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useMemo as $6Hs9a$useMemo, useState as $6Hs9a$useState} from "react";

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


let $384704861d32dbed$var$instance = Math.round(Math.random() * 10000000000);
let $384704861d32dbed$var$i = 0;
function $384704861d32dbed$export$bca9d026f8e704eb(props) {
    // Preserved here for backward compatibility. React Aria now generates the name instead of stately.
    let name = (0, $6Hs9a$useMemo)(()=>props.name || `radio-group-${$384704861d32dbed$var$instance}-${++$384704861d32dbed$var$i}`, [
        props.name
    ]);
    let [selectedValue, setSelected] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.value, props.defaultValue ?? null, props.onChange);
    let [initialValue] = (0, $6Hs9a$useState)(selectedValue);
    let [lastFocusedValue, setLastFocusedValue] = (0, $6Hs9a$useState)(null);
    let validation = (0, $fd2148440a13ec26$export$fc1a364ae1f3ff10)({
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


export {$384704861d32dbed$export$bca9d026f8e704eb as useRadioGroupState};
//# sourceMappingURL=useRadioGroupState.mjs.map
