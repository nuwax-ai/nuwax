import {createFocusManager as $903814aeb7d53b38$export$c5251b9e124bf29} from "../focus/FocusScope.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useState as $dhpmw$useState} from "react";

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





const $e5974f34cf218762$var$BUTTON_GROUP_ROLES = {
    none: 'toolbar',
    single: 'radiogroup',
    multiple: 'toolbar'
};
function $e5974f34cf218762$export$f4bf8d43c16de704(props, state, ref) {
    let { isDisabled: isDisabled, orientation: orientation = 'horizontal' } = props;
    let [isInToolbar, setInToolbar] = (0, $dhpmw$useState)(false);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        var _ref_current_parentElement;
        setInToolbar(!!(ref.current && ((_ref_current_parentElement = ref.current.parentElement) === null || _ref_current_parentElement === void 0 ? void 0 : _ref_current_parentElement.closest('[role="toolbar"]'))));
    }, [
        ref
    ]);
    let allKeys = [
        ...state.collection.getKeys()
    ];
    if (!allKeys.some((key)=>!state.disabledKeys.has(key))) isDisabled = true;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let focusManager = (0, $903814aeb7d53b38$export$c5251b9e124bf29)(ref);
    let flipDirection = direction === 'rtl' && orientation === 'horizontal';
    let onKeyDown = (e)=>{
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        switch(e.key){
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'ArrowRight' && flipDirection) focusManager.focusPrevious({
                    wrap: true
                });
                else focusManager.focusNext({
                    wrap: true
                });
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'ArrowLeft' && flipDirection) focusManager.focusNext({
                    wrap: true
                });
                else focusManager.focusPrevious({
                    wrap: true
                });
                break;
        }
    };
    let role = $e5974f34cf218762$var$BUTTON_GROUP_ROLES[state.selectionManager.selectionMode];
    if (isInToolbar && role === 'toolbar') role = 'group';
    return {
        actionGroupProps: {
            ...(0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
                labelable: true
            }),
            role: role,
            'aria-orientation': role === 'toolbar' ? orientation : undefined,
            'aria-disabled': isDisabled,
            onKeyDown: onKeyDown
        }
    };
}


export {$e5974f34cf218762$export$f4bf8d43c16de704 as useActionGroup};
//# sourceMappingURL=useActionGroup.js.map
