import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {menuData as $5c01de64eca9d4dd$export$6f49b4016bfc8d56} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useSelectableList as $1bd41fe243048d1b$export$b95089534ab7c1fd} from "../selection/useSelectableList.js";

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



function $ae091ddb623d9900$export$38eaa17faae8f579(props, state, ref) {
    let { shouldFocusWrap: shouldFocusWrap = true, onKeyDown: onKeyDown, onKeyUp: onKeyUp, ...otherProps } = props;
    if (!props['aria-label'] && !props['aria-labelledby'] && process.env.NODE_ENV !== 'production') console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let { listProps: listProps } = (0, $1bd41fe243048d1b$export$b95089534ab7c1fd)({
        ...otherProps,
        ref: ref,
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        shouldFocusWrap: shouldFocusWrap,
        linkBehavior: 'override'
    });
    (0, $5c01de64eca9d4dd$export$6f49b4016bfc8d56).set(state, {
        onClose: props.onClose,
        onAction: props.onAction,
        shouldUseVirtualFocus: props.shouldUseVirtualFocus
    });
    return {
        menuProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
            onKeyDown: onKeyDown,
            onKeyUp: onKeyUp
        }, {
            role: 'menu',
            ...listProps,
            onKeyDown: (e)=>{
                var _listProps_onKeyDown;
                // don't clear the menu selected keys if the user is presses escape since escape closes the menu
                if (e.key !== 'Escape' || props.shouldUseVirtualFocus) (_listProps_onKeyDown = listProps.onKeyDown) === null || _listProps_onKeyDown === void 0 ? void 0 : _listProps_onKeyDown.call(listProps, e);
            }
        })
    };
}


export {$ae091ddb623d9900$export$38eaa17faae8f579 as useMenu};
//# sourceMappingURL=useMenu.js.map
