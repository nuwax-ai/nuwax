var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $dj5Yx$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useActionGroup", function () { return $89f42f05fc2fa6f0$export$f4bf8d43c16de704; });
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





const $89f42f05fc2fa6f0$var$BUTTON_GROUP_ROLES = {
    none: 'toolbar',
    single: 'radiogroup',
    multiple: 'toolbar'
};
function $89f42f05fc2fa6f0$export$f4bf8d43c16de704(props, state, ref) {
    let { isDisabled: isDisabled, orientation: orientation = 'horizontal' } = props;
    let [isInToolbar, setInToolbar] = (0, $dj5Yx$react.useState)(false);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        setInToolbar(!!(ref.current && ref.current.parentElement?.closest('[role="toolbar"]')));
    }, [
        ref
    ]);
    let allKeys = [
        ...state.collection.getKeys()
    ];
    if (!allKeys.some((key)=>!state.disabledKeys.has(key))) isDisabled = true;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let focusManager = (0, $9fb4ac1cc58342cc$exports.createFocusManager)(ref);
    let flipDirection = direction === 'rtl' && orientation === 'horizontal';
    let onKeyDown = (e)=>{
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) return;
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
    let role = $89f42f05fc2fa6f0$var$BUTTON_GROUP_ROLES[state.selectionManager.selectionMode];
    if (isInToolbar && role === 'toolbar') role = 'group';
    return {
        actionGroupProps: {
            ...(0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
                labelable: true
            }),
            role: role,
            'aria-orientation': role === 'toolbar' ? orientation : undefined,
            'aria-disabled': isDisabled,
            onKeyDown: onKeyDown
        }
    };
}


//# sourceMappingURL=useActionGroup.cjs.map
