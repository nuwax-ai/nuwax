var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $fa2x9$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToggleGroupState", function () { return $e19e604fd086e3e7$export$8deac67f4addf270; });
/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $e19e604fd086e3e7$export$8deac67f4addf270(props) {
    let { selectionMode: selectionMode = 'single', disallowEmptySelection: disallowEmptySelection, isDisabled: isDisabled = false } = props;
    let [selectedKeys, setSelectedKeys] = (0, $14cedf286405cc4b$exports.useControlledState)((0, $fa2x9$react.useMemo)(()=>props.selectedKeys ? new Set(props.selectedKeys) : undefined, [
        props.selectedKeys
    ]), (0, $fa2x9$react.useMemo)(()=>props.defaultSelectedKeys ? new Set(props.defaultSelectedKeys) : new Set(), [
        props.defaultSelectedKeys
    ]), props.onSelectionChange);
    return {
        selectionMode: selectionMode,
        isDisabled: isDisabled,
        selectedKeys: selectedKeys,
        setSelectedKeys: setSelectedKeys,
        toggleKey (key) {
            let keys;
            if (selectionMode === 'multiple') {
                keys = new Set(selectedKeys);
                if (keys.has(key) && (!disallowEmptySelection || keys.size > 1)) keys.delete(key);
                else keys.add(key);
            } else keys = new Set(selectedKeys.has(key) && !disallowEmptySelection ? [] : [
                key
            ]);
            setSelectedKeys(keys);
        },
        setSelected (key, isSelected) {
            if (isSelected !== selectedKeys.has(key)) this.toggleKey(key);
        }
    };
}


//# sourceMappingURL=useToggleGroupState.cjs.map
