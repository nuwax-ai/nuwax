import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $7KPIo$useState} from "react";

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

function $9df93bc59c6dea5f$export$ce1595f6e1a63433(props) {
    let { onInputChange: propsOnInputChange, inputValue: propsInputValue, defaultInputValue: propsDefaultInputValue = '' } = props;
    let onInputChange = (value)=>{
        if (propsOnInputChange) propsOnInputChange(value);
    };
    let [focusedNodeId, setFocusedNodeId] = (0, $7KPIo$useState)(null);
    let [inputValue, setInputValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(propsInputValue, propsDefaultInputValue, onInputChange);
    return {
        inputValue: inputValue,
        setInputValue: setInputValue,
        focusedNodeId: focusedNodeId,
        setFocusedNodeId: setFocusedNodeId
    };
}


export {$9df93bc59c6dea5f$export$ce1595f6e1a63433 as useAutocompleteState};
//# sourceMappingURL=useAutocompleteState.js.map
