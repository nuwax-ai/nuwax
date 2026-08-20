import {SelectionManager as $60fcbaf037242b1f$export$6c8a5aaad13c9852} from "../selection/SelectionManager.js";
import {TreeCollection as $caf3335d47da202b$export$863faf230ee2118a} from "./TreeCollection.js";
import {useCollection as $70601b00a8062b25$export$6cd28814d92fa9c9} from "../collections/useCollection.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMultipleSelectionState as $8696e7d7c3c9007a$export$253fe78d46329472} from "../selection/useMultipleSelectionState.js";
import {useMemo as $28Z7a$useMemo, useCallback as $28Z7a$useCallback, useEffect as $28Z7a$useEffect} from "react";

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





function $aebfb5dfb6504297$export$728d6ba534403756(props) {
    let { onExpandedChange: onExpandedChange } = props;
    let [expandedKeys, setExpandedKeys] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), onExpandedChange);
    let selectionState = (0, $8696e7d7c3c9007a$export$253fe78d46329472)(props);
    let disabledKeys = (0, $28Z7a$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let tree = (0, $70601b00a8062b25$export$6cd28814d92fa9c9)(props, (0, $28Z7a$useCallback)((nodes)=>new (0, $caf3335d47da202b$export$863faf230ee2118a)(nodes, {
            expandedKeys: expandedKeys
        }), [
        expandedKeys
    ]), null);
    // Reset focused key if that item is deleted from the collection.
    (0, $28Z7a$useEffect)(()=>{
        if (selectionState.focusedKey != null && !tree.getItem(selectionState.focusedKey)) selectionState.setFocusedKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        tree,
        selectionState.focusedKey
    ]);
    let onToggle = (key)=>{
        setExpandedKeys($aebfb5dfb6504297$var$toggleKey(expandedKeys, key));
    };
    return {
        collection: tree,
        expandedKeys: expandedKeys,
        disabledKeys: disabledKeys,
        toggleKey: onToggle,
        setExpandedKeys: setExpandedKeys,
        selectionManager: new (0, $60fcbaf037242b1f$export$6c8a5aaad13c9852)(tree, selectionState)
    };
}
function $aebfb5dfb6504297$var$toggleKey(set, key) {
    let res = new Set(set);
    if (res.has(key)) res.delete(key);
    else res.add(key);
    return res;
}


export {$aebfb5dfb6504297$export$728d6ba534403756 as useTreeState};
//# sourceMappingURL=useTreeState.js.map
