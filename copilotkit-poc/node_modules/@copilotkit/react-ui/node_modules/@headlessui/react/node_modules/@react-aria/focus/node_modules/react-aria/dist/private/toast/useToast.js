import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import $5KXfQ$intlStringsjs from "./intlStrings.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37, useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useEffect as $5KXfQ$useEffect, useState as $5KXfQ$useState} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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





function $e57877dc26ba1039$export$a407b657d3044108(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { key: key, timer: timer, timeout: timeout } = props.toast;
    (0, $5KXfQ$useEffect)(()=>{
        if (timer == null || timeout == null) return;
        timer.reset(timeout);
        return ()=>{
            timer.pause();
        };
    }, [
        timer,
        timeout
    ]);
    let titleId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let descriptionId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($5KXfQ$intlStringsjs))), '@react-aria/toast');
    // This is required for NVDA announcements, without it NVDA will NOT announce the toast when it appears.
    // Originally was tied to animationStart/End via https://github.com/adobe/react-spectrum/pull/6223/commits/e22e319df64958e822ab7cd9685e96818cae9ba5
    // but toasts don't always have animations.
    let [isVisible, setIsVisible] = (0, $5KXfQ$useState)(false);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        setIsVisible(true);
    }, []);
    let toastProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
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


export {$e57877dc26ba1039$export$a407b657d3044108 as useToast};
//# sourceMappingURL=useToast.js.map
