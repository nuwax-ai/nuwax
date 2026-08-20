import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {handleLinkClick as $caaf0dd3060ed57c$export$13aea1a3cb5e3f1f, useLinkProps as $caaf0dd3060ed57c$export$7e924b3091a3bd18, useRouter as $caaf0dd3060ed57c$export$9a302a45f65d0572} from "../utils/openLink.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";

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




function $40d752843fab8930$export$dcf14c9974fe2767(props, ref) {
    let { elementType: elementType = 'a', onPress: onPress, onPressStart: onPressStart, onPressEnd: onPressEnd, onClick: onClick, isDisabled: isDisabled, ...otherProps } = props;
    let linkProps = {};
    if (elementType !== 'a') linkProps = {
        role: 'link',
        tabIndex: !isDisabled ? 0 : undefined
    };
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)(props, ref);
    let { pressProps: pressProps, isPressed: isPressed } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
        onPress: onPress,
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onClick: onClick,
        isDisabled: isDisabled,
        ref: ref
    });
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(otherProps, {
        labelable: true
    });
    let interactionHandlers = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, pressProps);
    let router = (0, $caaf0dd3060ed57c$export$9a302a45f65d0572)();
    let routerLinkProps = (0, $caaf0dd3060ed57c$export$7e924b3091a3bd18)(props);
    return {
        isPressed: isPressed,
        linkProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, routerLinkProps, {
            ...interactionHandlers,
            ...linkProps,
            'aria-disabled': isDisabled || undefined,
            'aria-current': props['aria-current'],
            onClick: (e)=>{
                pressProps.onClick?.(e);
                (0, $caaf0dd3060ed57c$export$13aea1a3cb5e3f1f)(e, router, props.href, props.routerOptions);
            }
        })
    };
}


export {$40d752843fab8930$export$dcf14c9974fe2767 as useLink};
//# sourceMappingURL=useLink.mjs.map
