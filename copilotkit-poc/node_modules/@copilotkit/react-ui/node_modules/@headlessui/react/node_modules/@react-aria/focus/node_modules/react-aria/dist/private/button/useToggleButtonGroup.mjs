import {useToggleButton as $b54a524c670b905d$export$51e84d46ca0bc451} from "./useToggleButton.mjs";
import {useToolbar as $afa781ff67c1cd08$export$fa142eb1681c520} from "../toolbar/useToolbar.mjs";

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

function $162557ba4d6f08dd$export$dd5580ae642f110f(props, state, ref) {
    let { isDisabled: isDisabled } = props;
    let { toolbarProps: toolbarProps } = (0, $afa781ff67c1cd08$export$fa142eb1681c520)(props, ref);
    return {
        groupProps: {
            ...toolbarProps,
            role: state.selectionMode === 'single' ? 'radiogroup' : toolbarProps.role,
            'aria-disabled': isDisabled
        }
    };
}
function $162557ba4d6f08dd$export$bc53712daae3d6e6(props, state, ref) {
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
    let { isPressed: isPressed, isSelected: isSelected, isDisabled: isDisabled, buttonProps: buttonProps } = (0, $b54a524c670b905d$export$51e84d46ca0bc451)({
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


export {$162557ba4d6f08dd$export$dd5580ae642f110f as useToggleButtonGroup, $162557ba4d6f08dd$export$bc53712daae3d6e6 as useToggleButtonGroupItem};
//# sourceMappingURL=useToggleButtonGroup.mjs.map
