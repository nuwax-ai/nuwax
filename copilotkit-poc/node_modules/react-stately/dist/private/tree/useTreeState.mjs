import {SelectionManager as $4a07ac835f260f78$export$6c8a5aaad13c9852} from "../selection/SelectionManager.mjs";
import {TreeCollection as $df1fcc684d3b021a$export$863faf230ee2118a} from "./TreeCollection.mjs";
import {useCollection as $d03379b88399b8c5$export$6cd28814d92fa9c9} from "../collections/useCollection.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useMultipleSelectionState as $60f19cefd567a3e4$export$253fe78d46329472} from "../selection/useMultipleSelectionState.mjs";
import {useMemo as $aXIpm$useMemo, useCallback as $aXIpm$useCallback, useEffect as $aXIpm$useEffect} from "react";

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





function $6b915bde6cd300dd$export$728d6ba534403756(props) {
    let { onExpandedChange: onExpandedChange } = props;
    let [expandedKeys, setExpandedKeys] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), onExpandedChange);
    let selectionState = (0, $60f19cefd567a3e4$export$253fe78d46329472)(props);
    let disabledKeys = (0, $aXIpm$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let tree = (0, $d03379b88399b8c5$export$6cd28814d92fa9c9)(props, (0, $aXIpm$useCallback)((nodes)=>new (0, $df1fcc684d3b021a$export$863faf230ee2118a)(nodes, {
            expandedKeys: expandedKeys
        }), [
        expandedKeys
    ]), null);
    // Reset focused key if that item is deleted from the collection.
    (0, $aXIpm$useEffect)(()=>{
        if (selectionState.focusedKey != null && !tree.getItem(selectionState.focusedKey)) selectionState.setFocusedKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        tree,
        selectionState.focusedKey
    ]);
    let onToggle = (key)=>{
        setExpandedKeys($6b915bde6cd300dd$var$toggleKey(expandedKeys, key));
    };
    return {
        collection: tree,
        expandedKeys: expandedKeys,
        disabledKeys: disabledKeys,
        toggleKey: onToggle,
        setExpandedKeys: setExpandedKeys,
        selectionManager: new (0, $4a07ac835f260f78$export$6c8a5aaad13c9852)(tree, selectionState)
    };
}
function $6b915bde6cd300dd$var$toggleKey(set, key) {
    let res = new Set(set);
    if (res.has(key)) res.delete(key);
    else res.add(key);
    return res;
}


export {$6b915bde6cd300dd$export$728d6ba534403756 as useTreeState};
//# sourceMappingURL=useTreeState.mjs.map
