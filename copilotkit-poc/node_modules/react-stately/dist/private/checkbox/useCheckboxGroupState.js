import {mergeValidation as $d085204f885ad67a$export$75ee7c75d68f5b0e, useFormValidationState as $d085204f885ad67a$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $1EkSU$useState, useRef as $1EkSU$useRef} from "react";

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


function $65c2b7d22e9bebb9$export$daff6da51032a415(props = {}) {
    let [selectedValues, setValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.value, props.defaultValue || [], props.onChange);
    let [initialValues] = (0, $1EkSU$useState)(selectedValues);
    let isRequired = !!props.isRequired && selectedValues.length === 0;
    let invalidValues = (0, $1EkSU$useRef)(new Map());
    let validation = (0, $d085204f885ad67a$export$fc1a364ae1f3ff10)({
        ...props,
        value: selectedValues
    });
    let isInvalid = validation.displayValidation.isInvalid;
    var _props_defaultValue, _props_validationState;
    const state = {
        ...validation,
        value: selectedValues,
        defaultValue: (_props_defaultValue = props.defaultValue) !== null && _props_defaultValue !== void 0 ? _props_defaultValue : initialValues,
        setValue (value) {
            if (props.isReadOnly || props.isDisabled) return;
            setValue(value);
        },
        isDisabled: props.isDisabled || false,
        isReadOnly: props.isReadOnly || false,
        isSelected (value) {
            return selectedValues.includes(value);
        },
        addValue (value) {
            if (props.isReadOnly || props.isDisabled) return;
            setValue((selectedValues)=>{
                if (!selectedValues.includes(value)) return selectedValues.concat(value);
                return selectedValues;
            });
        },
        removeValue (value) {
            if (props.isReadOnly || props.isDisabled) return;
            if (selectedValues.includes(value)) setValue(selectedValues.filter((existingValue)=>existingValue !== value));
        },
        toggleValue (value) {
            if (props.isReadOnly || props.isDisabled) return;
            if (selectedValues.includes(value)) setValue(selectedValues.filter((existingValue)=>existingValue !== value));
            else setValue(selectedValues.concat(value));
        },
        setInvalid (value, v) {
            let s = new Map(invalidValues.current);
            if (v.isInvalid) s.set(value, v);
            else s.delete(value);
            invalidValues.current = s;
            validation.updateValidation((0, $d085204f885ad67a$export$75ee7c75d68f5b0e)(...s.values()));
        },
        validationState: (_props_validationState = props.validationState) !== null && _props_validationState !== void 0 ? _props_validationState : isInvalid ? 'invalid' : null,
        isInvalid: isInvalid,
        isRequired: isRequired
    };
    return state;
}


export {$65c2b7d22e9bebb9$export$daff6da51032a415 as useCheckboxGroupState};
//# sourceMappingURL=useCheckboxGroupState.js.map
