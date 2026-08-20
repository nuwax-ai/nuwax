import {useFormValidationState as $d085204f885ad67a$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMemo as $8029D$useMemo, useState as $8029D$useState} from "react";

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


let $14031cfad4eebf54$var$instance = Math.round(Math.random() * 10000000000);
let $14031cfad4eebf54$var$i = 0;
function $14031cfad4eebf54$export$bca9d026f8e704eb(props) {
    // Preserved here for backward compatibility. React Aria now generates the name instead of stately.
    let name = (0, $8029D$useMemo)(()=>props.name || `radio-group-${$14031cfad4eebf54$var$instance}-${++$14031cfad4eebf54$var$i}`, [
        props.name
    ]);
    var _props_defaultValue;
    let [selectedValue, setSelected] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.value, (_props_defaultValue = props.defaultValue) !== null && _props_defaultValue !== void 0 ? _props_defaultValue : null, props.onChange);
    let [initialValue] = (0, $8029D$useState)(selectedValue);
    let [lastFocusedValue, setLastFocusedValue] = (0, $8029D$useState)(null);
    let validation = (0, $d085204f885ad67a$export$fc1a364ae1f3ff10)({
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
    var _props_defaultValue1;
    return {
        ...validation,
        name: name,
        selectedValue: selectedValue,
        defaultSelectedValue: props.value !== undefined ? initialValue : (_props_defaultValue1 = props.defaultValue) !== null && _props_defaultValue1 !== void 0 ? _props_defaultValue1 : null,
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


export {$14031cfad4eebf54$export$bca9d026f8e704eb as useRadioGroupState};
//# sourceMappingURL=useRadioGroupState.js.map
