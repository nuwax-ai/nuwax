var $d6892fb1cfcee731$exports = require("../list/useSingleSelectListState.cjs");
var $6li0t$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTabListState", function () { return $af181d2b1181b774$export$4ba071daf4e486; });
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

function $af181d2b1181b774$export$4ba071daf4e486(props) {
    let state = (0, $d6892fb1cfcee731$exports.useSingleSelectListState)({
        ...props,
        onSelectionChange: props.onSelectionChange ? (key)=>{
            if (key != null) props.onSelectionChange?.(key);
        } : undefined,
        suppressTextValueWarning: true,
        defaultSelectedKey: props.defaultSelectedKey ?? $af181d2b1181b774$var$findDefaultSelectedKey(props.collection, props.disabledKeys ? new Set(props.disabledKeys) : new Set()) ?? undefined
    });
    let { selectionManager: selectionManager, collection: collection, selectedKey: currentSelectedKey } = state;
    let lastSelectedKey = (0, $6li0t$react.useRef)(currentSelectedKey);
    (0, $6li0t$react.useEffect)(()=>{
        // Ensure a tab is always selected (in case no selected key was specified or if selected item was deleted from collection)
        let selectedKey = currentSelectedKey;
        if (props.selectedKey == null && (selectionManager.isEmpty || selectedKey == null || !collection.getItem(selectedKey))) {
            selectedKey = $af181d2b1181b774$var$findDefaultSelectedKey(collection, state.disabledKeys);
            if (selectedKey != null) // directly set selection because replace/toggle selection won't consider disabled keys
            selectionManager.setSelectedKeys([
                selectedKey
            ]);
        }
        // If the tablist doesn't have focus and the selected key changes or if there isn't a focused key yet, change focused key to the selected key if it exists.
        if (selectedKey != null && selectionManager.focusedKey == null || !selectionManager.isFocused && selectedKey !== lastSelectedKey.current) selectionManager.setFocusedKey(selectedKey);
        lastSelectedKey.current = selectedKey;
    });
    return {
        ...state,
        isDisabled: props.isDisabled || false
    };
}
function $af181d2b1181b774$var$findDefaultSelectedKey(collection, disabledKeys) {
    let selectedKey = null;
    if (collection) {
        selectedKey = collection.getFirstKey();
        // loop over tabs until we find one that isn't disabled and select that
        while(selectedKey != null && (disabledKeys.has(selectedKey) || collection.getItem(selectedKey)?.props?.isDisabled) && selectedKey !== collection.getLastKey())selectedKey = collection.getKeyAfter(selectedKey);
        // if this check is true, then every item is disabled, it makes more sense to default to the first key than the last
        if (selectedKey != null && (disabledKeys.has(selectedKey) || collection.getItem(selectedKey)?.props?.isDisabled) && selectedKey === collection.getLastKey()) selectedKey = collection.getFirstKey();
    }
    return selectedKey;
}


//# sourceMappingURL=useTabListState.cjs.map
