import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {handleLinkClick as $044d3c97ce5d6621$export$13aea1a3cb5e3f1f, useLinkProps as $044d3c97ce5d6621$export$7e924b3091a3bd18, useRouter as $044d3c97ce5d6621$export$9a302a45f65d0572} from "../utils/openLink.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";

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




function $876fbb820fe51375$export$dcf14c9974fe2767(props, ref) {
    let { elementType: elementType = 'a', onPress: onPress, onPressStart: onPressStart, onPressEnd: onPressEnd, onClick: onClick, isDisabled: isDisabled, ...otherProps } = props;
    let linkProps = {};
    if (elementType !== 'a') linkProps = {
        role: 'link',
        tabIndex: !isDisabled ? 0 : undefined
    };
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)(props, ref);
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        onPress: onPress,
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onClick: onClick,
        isDisabled: isDisabled,
        ref: ref
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(otherProps, {
        labelable: true
    });
    let interactionHandlers = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, pressProps);
    let router = (0, $044d3c97ce5d6621$export$9a302a45f65d0572)();
    let routerLinkProps = (0, $044d3c97ce5d6621$export$7e924b3091a3bd18)(props);
    return {
        isPressed: isPressed,
        linkProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, routerLinkProps, {
            ...interactionHandlers,
            ...linkProps,
            'aria-disabled': isDisabled || undefined,
            'aria-current': props['aria-current'],
            onClick: (e)=>{
                var _pressProps_onClick;
                (_pressProps_onClick = pressProps.onClick) === null || _pressProps_onClick === void 0 ? void 0 : _pressProps_onClick.call(pressProps, e);
                (0, $044d3c97ce5d6621$export$13aea1a3cb5e3f1f)(e, router, props.href, props.routerOptions);
            }
        })
    };
}


export {$876fbb820fe51375$export$dcf14c9974fe2767 as useLink};
//# sourceMappingURL=useLink.js.map
