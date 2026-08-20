var $359c8238bb510d61$exports = require("./useListState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $9VeX0$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSingleSelectListState", function () { return $d6892fb1cfcee731$export$e7f05e985daf4b5f; });
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


function $d6892fb1cfcee731$export$e7f05e985daf4b5f(props) {
    let [selectedKey, setSelectedKey] = (0, $14cedf286405cc4b$exports.useControlledState)(props.selectedKey, props.defaultSelectedKey ?? null, props.onSelectionChange);
    let selectedKeys = (0, $9VeX0$react.useMemo)(()=>selectedKey != null ? [
            selectedKey
        ] : [], [
        selectedKey
    ]);
    let { collection: collection, disabledKeys: disabledKeys, selectionManager: selectionManager } = (0, $359c8238bb510d61$exports.useListState)({
        ...props,
        selectionMode: 'single',
        disallowEmptySelection: true,
        allowDuplicateSelectionEvents: true,
        selectedKeys: selectedKeys,
        onSelectionChange: (keys)=>{
            // impossible, but TS doesn't know that
            if (keys === 'all') return;
            let key = keys.values().next().value ?? null;
            // Always fire onSelectionChange, even if the key is the same
            // as the current key (useControlledState does not).
            if (key === selectedKey && props.onSelectionChange) props.onSelectionChange(key);
            setSelectedKey(key);
        }
    });
    let selectedItem = selectedKey != null ? collection.getItem(selectedKey) : null;
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager,
        selectedKey: selectedKey,
        setSelectedKey: setSelectedKey,
        selectedItem: selectedItem
    };
}


//# sourceMappingURL=useSingleSelectListState.cjs.map
