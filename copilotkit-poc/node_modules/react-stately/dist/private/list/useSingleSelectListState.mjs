import {useListState as $b14b6f590b50af39$export$2f645645f7bca764} from "./useListState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useMemo as $jhfZc$useMemo} from "react";

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


function $0fdb127d377ffd84$export$e7f05e985daf4b5f(props) {
    let [selectedKey, setSelectedKey] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.selectedKey, props.defaultSelectedKey ?? null, props.onSelectionChange);
    let selectedKeys = (0, $jhfZc$useMemo)(()=>selectedKey != null ? [
            selectedKey
        ] : [], [
        selectedKey
    ]);
    let { collection: collection, disabledKeys: disabledKeys, selectionManager: selectionManager } = (0, $b14b6f590b50af39$export$2f645645f7bca764)({
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


export {$0fdb127d377ffd84$export$e7f05e985daf4b5f as useSingleSelectListState};
//# sourceMappingURL=useSingleSelectListState.mjs.map
