var $7e841a1975525fba$exports = require("./useButton.cjs");
var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToggleButton", function () { return $d0578e027a5bee31$export$51e84d46ca0bc451; });
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


function $d0578e027a5bee31$export$51e84d46ca0bc451(props, state, ref) {
    const { isSelected: isSelected } = state;
    const { isPressed: isPressed, buttonProps: buttonProps } = (0, $7e841a1975525fba$exports.useButton)({
        ...props,
        onPress: (0, $2f95486cfdaa743c$exports.chain)(state.toggle, props.onPress)
    }, ref);
    return {
        isPressed: isPressed,
        isSelected: isSelected,
        isDisabled: props.isDisabled || false,
        buttonProps: (0, $89b39774f3b79dbb$exports.mergeProps)(buttonProps, {
            'aria-pressed': isSelected
        })
    };
}


//# sourceMappingURL=useToggleButton.cjs.map
