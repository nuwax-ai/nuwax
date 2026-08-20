var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $543a9cb5084fed6a$exports = require("./intlStrings.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $joMo0$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToast", function () { return $141a1a9b65c82207$export$a407b657d3044108; });
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





function $141a1a9b65c82207$export$a407b657d3044108(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { key: key, timer: timer, timeout: timeout } = props.toast;
    (0, $joMo0$react.useEffect)(()=>{
        if (timer == null || timeout == null) return;
        timer.reset(timeout);
        return ()=>{
            timer.pause();
        };
    }, [
        timer,
        timeout
    ]);
    let titleId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let descriptionId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($543a9cb5084fed6a$exports))), '@react-aria/toast');
    // This is required for NVDA announcements, without it NVDA will NOT announce the toast when it appears.
    // Originally was tied to animationStart/End via https://github.com/adobe/react-spectrum/pull/6223/commits/e22e319df64958e822ab7cd9685e96818cae9ba5
    // but toasts don't always have animations.
    let [isVisible, setIsVisible] = (0, $joMo0$react.useState)(false);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        setIsVisible(true);
    }, []);
    let toastProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    return {
        toastProps: {
            ...toastProps,
            role: 'alertdialog',
            'aria-modal': 'false',
            'aria-labelledby': props['aria-labelledby'] || titleId,
            'aria-describedby': props['aria-describedby'] || descriptionId,
            tabIndex: 0
        },
        contentProps: {
            role: 'alert',
            'aria-atomic': 'true',
            'aria-hidden': isVisible ? undefined : 'true'
        },
        titleProps: {
            id: titleId
        },
        descriptionProps: {
            id: descriptionId
        },
        closeButtonProps: {
            'aria-label': stringFormatter.format('close'),
            onPress: ()=>state.close(key)
        }
    };
}


//# sourceMappingURL=useToast.cjs.map
