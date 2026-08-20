import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useEffect as $gKb6F$useEffect} from "react";

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


const $2a7735b0c5c920e3$var$BUTTON_ROLES = {
    none: undefined,
    single: 'radio',
    multiple: 'checkbox'
};
function $2a7735b0c5c920e3$export$9597202bd3099a29(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let selectionMode = state.selectionManager.selectionMode;
    let buttonProps = {
        role: $2a7735b0c5c920e3$var$BUTTON_ROLES[selectionMode]
    };
    if (selectionMode !== 'none') {
        let isSelected = state.selectionManager.isSelected(props.key);
        buttonProps['aria-checked'] = isSelected;
    }
    let isFocused = props.key === state.selectionManager.focusedKey;
    let onRemovedWithFocus = (0, $85567ef950781b7d$export$7f54fc3180508a52)(()=>{
        if (isFocused) state.selectionManager.setFocusedKey(null);
    });
    // If the focused item is removed from the DOM, reset the focused key to null.
    (0, $gKb6F$useEffect)(()=>{
        return ()=>{
            onRemovedWithFocus();
        };
    }, []);
    return {
        buttonProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(buttonProps, {
            tabIndex: isFocused || state.selectionManager.focusedKey == null ? 0 : -1,
            onFocus () {
                state.selectionManager.setFocusedKey(props.key);
            },
            onPress () {
                state.selectionManager.select(props.key);
            }
        })
    };
}


export {$2a7735b0c5c920e3$export$9597202bd3099a29 as useActionGroupItem};
//# sourceMappingURL=useActionGroupItem.js.map
