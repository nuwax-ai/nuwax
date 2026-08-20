import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $57MXN$intlStringsmjs from "./intlStrings.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37, useSlotId as $390e54f620492c70$export$b4cc09c592e8fdb8} from "../utils/useId.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useEffect as $57MXN$useEffect, useState as $57MXN$useState} from "react";


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





function $e9b287e97f25ea01$export$a407b657d3044108(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { key: key, timer: timer, timeout: timeout } = props.toast;
    (0, $57MXN$useEffect)(()=>{
        if (timer == null || timeout == null) return;
        timer.reset(timeout);
        return ()=>{
            timer.pause();
        };
    }, [
        timer,
        timeout
    ]);
    let titleId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let descriptionId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)();
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($57MXN$intlStringsmjs))), '@react-aria/toast');
    // This is required for NVDA announcements, without it NVDA will NOT announce the toast when it appears.
    // Originally was tied to animationStart/End via https://github.com/adobe/react-spectrum/pull/6223/commits/e22e319df64958e822ab7cd9685e96818cae9ba5
    // but toasts don't always have animations.
    let [isVisible, setIsVisible] = (0, $57MXN$useState)(false);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        setIsVisible(true);
    }, []);
    let toastProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
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


export {$e9b287e97f25ea01$export$a407b657d3044108 as useToast};
//# sourceMappingURL=useToast.mjs.map
