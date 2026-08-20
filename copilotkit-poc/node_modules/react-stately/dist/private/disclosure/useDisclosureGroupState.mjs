import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useMemo as $ilT6J$useMemo, useEffect as $ilT6J$useEffect} from "react";

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

function $29a18fa139197b5c$export$f36461af0ef4707d(props) {
    let { allowsMultipleExpanded: allowsMultipleExpanded = false, isDisabled: isDisabled = false } = props;
    let [expandedKeys, setExpandedKeys] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)((0, $ilT6J$useMemo)(()=>props.expandedKeys ? new Set(props.expandedKeys) : undefined, [
        props.expandedKeys
    ]), (0, $ilT6J$useMemo)(()=>props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), [
        props.defaultExpandedKeys
    ]), props.onExpandedChange);
    (0, $ilT6J$useEffect)(()=>{
        // Ensure only one item is expanded if allowsMultipleExpanded is false.
        if (!allowsMultipleExpanded && expandedKeys.size > 1) {
            let firstKey = expandedKeys.values().next().value;
            if (firstKey != null) setExpandedKeys(new Set([
                firstKey
            ]));
        }
    });
    return {
        allowsMultipleExpanded: allowsMultipleExpanded,
        isDisabled: isDisabled,
        expandedKeys: expandedKeys,
        setExpandedKeys: setExpandedKeys,
        toggleKey (key) {
            let keys;
            if (allowsMultipleExpanded) {
                keys = new Set(expandedKeys);
                if (keys.has(key)) keys.delete(key);
                else keys.add(key);
            } else keys = new Set(expandedKeys.has(key) ? [] : [
                key
            ]);
            setExpandedKeys(keys);
        }
    };
}


export {$29a18fa139197b5c$export$f36461af0ef4707d as useDisclosureGroupState};
//# sourceMappingURL=useDisclosureGroupState.mjs.map
