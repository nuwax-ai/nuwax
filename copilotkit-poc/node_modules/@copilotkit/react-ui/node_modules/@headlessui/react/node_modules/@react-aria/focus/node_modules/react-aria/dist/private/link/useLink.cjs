var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLink", function () { return $f980d8bdfaf87492$export$dcf14c9974fe2767; });
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




function $f980d8bdfaf87492$export$dcf14c9974fe2767(props, ref) {
    let { elementType: elementType = 'a', onPress: onPress, onPressStart: onPressStart, onPressEnd: onPressEnd, onClick: onClick, isDisabled: isDisabled, ...otherProps } = props;
    let linkProps = {};
    if (elementType !== 'a') linkProps = {
        role: 'link',
        tabIndex: !isDisabled ? 0 : undefined
    };
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)(props, ref);
    let { pressProps: pressProps, isPressed: isPressed } = (0, $1d003dcb6308cd89$exports.usePress)({
        onPress: onPress,
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onClick: onClick,
        isDisabled: isDisabled,
        ref: ref
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(otherProps, {
        labelable: true
    });
    let interactionHandlers = (0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, pressProps);
    let router = (0, $75bd88aab025820b$exports.useRouter)();
    let routerLinkProps = (0, $75bd88aab025820b$exports.useLinkProps)(props);
    return {
        isPressed: isPressed,
        linkProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, routerLinkProps, {
            ...interactionHandlers,
            ...linkProps,
            'aria-disabled': isDisabled || undefined,
            'aria-current': props['aria-current'],
            onClick: (e)=>{
                pressProps.onClick?.(e);
                (0, $75bd88aab025820b$exports.handleLinkClick)(e, router, props.href, props.routerOptions);
            }
        })
    };
}


//# sourceMappingURL=useLink.cjs.map
