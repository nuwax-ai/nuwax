var $d0578e027a5bee31$exports = require("./useToggleButton.cjs");
var $4be8e70c23134915$exports = require("../toolbar/useToolbar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToggleButtonGroup", function () { return $0e7820611588913f$export$dd5580ae642f110f; });
$parcel$export(module.exports, "useToggleButtonGroupItem", function () { return $0e7820611588913f$export$bc53712daae3d6e6; });
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

function $0e7820611588913f$export$dd5580ae642f110f(props, state, ref) {
    let { isDisabled: isDisabled } = props;
    let { toolbarProps: toolbarProps } = (0, $4be8e70c23134915$exports.useToolbar)(props, ref);
    return {
        groupProps: {
            ...toolbarProps,
            role: state.selectionMode === 'single' ? 'radiogroup' : toolbarProps.role,
            'aria-disabled': isDisabled
        }
    };
}
function $0e7820611588913f$export$bc53712daae3d6e6(props, state, ref) {
    let toggleState = {
        isSelected: state.selectedKeys.has(props.id),
        defaultSelected: false,
        setSelected (isSelected) {
            state.setSelected(props.id, isSelected);
        },
        toggle () {
            state.toggleKey(props.id);
        }
    };
    let { isPressed: isPressed, isSelected: isSelected, isDisabled: isDisabled, buttonProps: buttonProps } = (0, $d0578e027a5bee31$exports.useToggleButton)({
        ...props,
        id: undefined,
        isDisabled: props.isDisabled || state.isDisabled
    }, toggleState, ref);
    if (state.selectionMode === 'single') {
        buttonProps.role = 'radio';
        buttonProps['aria-checked'] = toggleState.isSelected;
        delete buttonProps['aria-pressed'];
    }
    return {
        isPressed: isPressed,
        isSelected: isSelected,
        isDisabled: isDisabled,
        buttonProps: buttonProps
    };
}


//# sourceMappingURL=useToggleButtonGroup.cjs.map
