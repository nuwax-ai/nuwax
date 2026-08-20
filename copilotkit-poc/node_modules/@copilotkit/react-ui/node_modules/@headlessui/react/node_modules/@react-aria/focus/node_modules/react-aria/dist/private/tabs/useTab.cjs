var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $fe3ef331ec3a03dd$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTab", function () { return $82c0395d14c4f99d$export$fdf4756d5b8ef90a; });
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





function $82c0395d14c4f99d$export$fdf4756d5b8ef90a(props, state, ref) {
    let { key: key, isDisabled: propsDisabled, shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager, selectedKey: selectedKey } = state;
    let isSelected = key === selectedKey;
    let isDisabled = propsDisabled || state.isDisabled || state.selectionManager.isDisabled(key);
    let item = state.collection.getItem(key);
    let { itemProps: itemProps, isPressed: isPressed } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
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
    let tabId = (0, $fe3ef331ec3a03dd$exports.generateId)(state, key, 'tab');
    let tabPanelId = (0, $fe3ef331ec3a03dd$exports.generateId)(state, key, 'tabpanel');
    let { tabIndex: tabIndex } = itemProps;
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(item?.props, {
        labelable: true
    });
    delete domProps.id;
    let linkProps = (0, $75bd88aab025820b$exports.useLinkProps)(item?.props);
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)({
        ...item?.props,
        isDisabled: isDisabled
    }, ref);
    return {
        tabProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, focusableProps, linkProps, itemProps, {
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


//# sourceMappingURL=useTab.cjs.map
