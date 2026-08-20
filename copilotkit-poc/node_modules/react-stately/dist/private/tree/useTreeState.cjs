var $b9a23b9997e48a30$exports = require("../selection/SelectionManager.cjs");
var $ca022a17c496fef5$exports = require("./TreeCollection.cjs");
var $346711202f17eab5$exports = require("../collections/useCollection.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $0af3d14a0ed99bae$exports = require("../selection/useMultipleSelectionState.cjs");
var $2Ueiu$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTreeState", function () { return $5a1075fada808309$export$728d6ba534403756; });
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





function $5a1075fada808309$export$728d6ba534403756(props) {
    let { onExpandedChange: onExpandedChange } = props;
    let [expandedKeys, setExpandedKeys] = (0, $14cedf286405cc4b$exports.useControlledState)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), onExpandedChange);
    let selectionState = (0, $0af3d14a0ed99bae$exports.useMultipleSelectionState)(props);
    let disabledKeys = (0, $2Ueiu$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let tree = (0, $346711202f17eab5$exports.useCollection)(props, (0, $2Ueiu$react.useCallback)((nodes)=>new (0, $ca022a17c496fef5$exports.TreeCollection)(nodes, {
            expandedKeys: expandedKeys
        }), [
        expandedKeys
    ]), null);
    // Reset focused key if that item is deleted from the collection.
    (0, $2Ueiu$react.useEffect)(()=>{
        if (selectionState.focusedKey != null && !tree.getItem(selectionState.focusedKey)) selectionState.setFocusedKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        tree,
        selectionState.focusedKey
    ]);
    let onToggle = (key)=>{
        setExpandedKeys($5a1075fada808309$var$toggleKey(expandedKeys, key));
    };
    return {
        collection: tree,
        expandedKeys: expandedKeys,
        disabledKeys: disabledKeys,
        toggleKey: onToggle,
        setExpandedKeys: setExpandedKeys,
        selectionManager: new (0, $b9a23b9997e48a30$exports.SelectionManager)(tree, selectionState)
    };
}
function $5a1075fada808309$var$toggleKey(set, key) {
    let res = new Set(set);
    if (res.has(key)) res.delete(key);
    else res.add(key);
    return res;
}


//# sourceMappingURL=useTreeState.cjs.map
