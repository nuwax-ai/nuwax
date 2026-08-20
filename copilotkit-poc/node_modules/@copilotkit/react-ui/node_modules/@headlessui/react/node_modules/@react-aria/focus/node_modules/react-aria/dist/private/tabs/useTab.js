import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {generateId as $83ae27ae4c16dc56$export$567fc7097e064344} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useLinkProps as $044d3c97ce5d6621$export$7e924b3091a3bd18} from "../utils/openLink.js";
import {useSelectableItem as $0d8cf6a15fe85601$export$ecf600387e221c37} from "../selection/useSelectableItem.js";

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





function $6bfdd25ce62aa2f7$export$fdf4756d5b8ef90a(props, state, ref) {
    let { key: key, isDisabled: propsDisabled, shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager, selectedKey: selectedKey } = state;
    let isSelected = key === selectedKey;
    let isDisabled = propsDisabled || state.isDisabled || state.selectionManager.isDisabled(key);
    let item = state.collection.getItem(key);
    let { itemProps: itemProps, isPressed: isPressed } = (0, $0d8cf6a15fe85601$export$ecf600387e221c37)({
        selectionManager: manager,
        key: key,
        ref: ref,
        isDisabled: isDisabled,
        // Link tabs should behave like native anchors (navigate on press up)
        // This avoids reopening beforeunload dialogs when browsers replay
        // queued pointer enter/leave events after cancellation.
        shouldSelectOnPressUp: shouldSelectOnPressUp !== null && shouldSelectOnPressUp !== void 0 ? shouldSelectOnPressUp : (item === null || item === void 0 ? void 0 : item.props.href) != null,
        linkBehavior: 'selection'
    });
    let tabId = (0, $83ae27ae4c16dc56$export$567fc7097e064344)(state, key, 'tab');
    let tabPanelId = (0, $83ae27ae4c16dc56$export$567fc7097e064344)(state, key, 'tabpanel');
    let { tabIndex: tabIndex } = itemProps;
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(item === null || item === void 0 ? void 0 : item.props, {
        labelable: true
    });
    delete domProps.id;
    let linkProps = (0, $044d3c97ce5d6621$export$7e924b3091a3bd18)(item === null || item === void 0 ? void 0 : item.props);
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)({
        ...item === null || item === void 0 ? void 0 : item.props,
        isDisabled: isDisabled
    }, ref);
    return {
        tabProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, focusableProps, linkProps, itemProps, {
            id: tabId,
            'aria-selected': isSelected,
            'aria-disabled': isDisabled || undefined,
            'aria-controls': isSelected ? tabPanelId : undefined,
            tabIndex: isDisabled ? undefined : tabIndex,
            role: 'tab'
        }),
        isSelected: isSelected,
        isDisabled: isDisabled,
        isPressed: isPressed
    };
}


export {$6bfdd25ce62aa2f7$export$fdf4756d5b8ef90a as useTab};
//# sourceMappingURL=useTab.js.map
