var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $6ddbbc622e966e2c$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $6c3cc4646da74e51$exports = require("../selection/useSelectableList.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useMenu", function () { return $5659ff48f21de877$export$38eaa17faae8f579; });
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



function $5659ff48f21de877$export$38eaa17faae8f579(props, state, ref) {
    let { shouldFocusWrap: shouldFocusWrap = true, onKeyDown: onKeyDown, onKeyUp: onKeyUp, ...otherProps } = props;
    if (!props['aria-label'] && !props['aria-labelledby'] && process.env.NODE_ENV !== 'production') console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let { listProps: listProps } = (0, $6c3cc4646da74e51$exports.useSelectableList)({
        ...otherProps,
        ref: ref,
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        shouldFocusWrap: shouldFocusWrap,
        linkBehavior: 'override'
    });
    (0, $6ddbbc622e966e2c$exports.menuData).set(state, {
        onClose: props.onClose,
        onAction: props.onAction,
        shouldUseVirtualFocus: props.shouldUseVirtualFocus
    });
    return {
        menuProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
            onKeyDown: onKeyDown,
            onKeyUp: onKeyUp
        }, {
            role: 'menu',
            ...listProps,
            onKeyDown: (e)=>{
                // don't clear the menu selected keys if the user is presses escape since escape closes the menu
                if (e.key !== 'Escape' || props.shouldUseVirtualFocus) listProps.onKeyDown?.(e);
            }
        })
    };
}


//# sourceMappingURL=useMenu.cjs.map
