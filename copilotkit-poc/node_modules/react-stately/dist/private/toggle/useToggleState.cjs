var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $fQAsr$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToggleState", function () { return $3c667fe312d12707$export$8042c6c013fd5226; });
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

function $3c667fe312d12707$export$8042c6c013fd5226(props = {}) {
    let { isReadOnly: isReadOnly } = props;
    // have to provide an empty function so useControlledState doesn't throw a fit
    // can't use useControlledState's prop calling because we need the event object from the change
    let [isSelected, setSelected] = (0, $14cedf286405cc4b$exports.useControlledState)(props.isSelected, props.defaultSelected || false, props.onChange);
    let [initialValue] = (0, $fQAsr$react.useState)(isSelected);
    function updateSelected(value) {
        if (!isReadOnly) setSelected(value);
    }
    function toggleState() {
        if (!isReadOnly) setSelected(!isSelected);
    }
    return {
        isSelected: isSelected,
        defaultSelected: props.defaultSelected ?? initialValue,
        setSelected: updateSelected,
        toggle: toggleState
    };
}


//# sourceMappingURL=useToggleState.cjs.map
