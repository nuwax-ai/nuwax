var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $1RTX6$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useActionGroupItem", function () { return $b5841a34efde64c6$export$9597202bd3099a29; });
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


const $b5841a34efde64c6$var$BUTTON_ROLES = {
    none: undefined,
    single: 'radio',
    multiple: 'checkbox'
};
function $b5841a34efde64c6$export$9597202bd3099a29(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let selectionMode = state.selectionManager.selectionMode;
    let buttonProps = {
        role: $b5841a34efde64c6$var$BUTTON_ROLES[selectionMode]
    };
    if (selectionMode !== 'none') {
        let isSelected = state.selectionManager.isSelected(props.key);
        buttonProps['aria-checked'] = isSelected;
    }
    let isFocused = props.key === state.selectionManager.focusedKey;
    let onRemovedWithFocus = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>{
        if (isFocused) state.selectionManager.setFocusedKey(null);
    });
    // If the focused item is removed from the DOM, reset the focused key to null.
    (0, $1RTX6$react.useEffect)(()=>{
        return ()=>{
            onRemovedWithFocus();
        };
    }, []);
    return {
        buttonProps: (0, $89b39774f3b79dbb$exports.mergeProps)(buttonProps, {
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


//# sourceMappingURL=useActionGroupItem.cjs.map
