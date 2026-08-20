import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {generateId as $a251981b23baaa12$export$567fc7097e064344} from "./utils.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useLinkProps as $caaf0dd3060ed57c$export$7e924b3091a3bd18} from "../utils/openLink.mjs";
import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";

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





function $1b6fa05bad3d7740$export$fdf4756d5b8ef90a(props, state, ref) {
    let { key: key, isDisabled: propsDisabled, shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager, selectedKey: selectedKey } = state;
    let isSelected = key === selectedKey;
    let isDisabled = propsDisabled || state.isDisabled || state.selectionManager.isDisabled(key);
    let item = state.collection.getItem(key);
    let { itemProps: itemProps, isPressed: isPressed } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        selectionManager: manager,
        key: key,
        ref: ref,
        isDisabled: isDisabled,
        // Link tabs should behave like native anchors (navigate on press up)
        // This avoids reopening beforeunload dialogs when browsers replay
        // queued pointer enter/leave events after cancellation.
        shouldSelectOnPressUp: shouldSelectOnPressUp ?? item?.props.href != null,
        linkBehavior: 'selection'
    });
    let tabId = (0, $a251981b23baaa12$export$567fc7097e064344)(state, key, 'tab');
    let tabPanelId = (0, $a251981b23baaa12$export$567fc7097e064344)(state, key, 'tabpanel');
    let { tabIndex: tabIndex } = itemProps;
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(item?.props, {
        labelable: true
    });
    delete domProps.id;
    let linkProps = (0, $caaf0dd3060ed57c$export$7e924b3091a3bd18)(item?.props);
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)({
        ...item?.props,
        isDisabled: isDisabled
    }, ref);
    return {
        tabProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, focusableProps, linkProps, itemProps, {
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


export {$1b6fa05bad3d7740$export$fdf4756d5b8ef90a as useTab};
//# sourceMappingURL=useTab.mjs.map
