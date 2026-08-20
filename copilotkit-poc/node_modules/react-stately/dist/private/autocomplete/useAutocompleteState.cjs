var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $da7wn$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useAutocompleteState", function () { return $0653e227284d9f81$export$ce1595f6e1a63433; });
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

function $0653e227284d9f81$export$ce1595f6e1a63433(props) {
    let { onInputChange: propsOnInputChange, inputValue: propsInputValue, defaultInputValue: propsDefaultInputValue = '' } = props;
    let onInputChange = (value)=>{
        if (propsOnInputChange) propsOnInputChange(value);
    };
    let [focusedNodeId, setFocusedNodeId] = (0, $da7wn$react.useState)(null);
    let [inputValue, setInputValue] = (0, $14cedf286405cc4b$exports.useControlledState)(propsInputValue, propsDefaultInputValue, onInputChange);
    return {
        inputValue: inputValue,
        setInputValue: setInputValue,
        focusedNodeId: focusedNodeId,
        setFocusedNodeId: setFocusedNodeId
    };
}


//# sourceMappingURL=useAutocompleteState.cjs.map
