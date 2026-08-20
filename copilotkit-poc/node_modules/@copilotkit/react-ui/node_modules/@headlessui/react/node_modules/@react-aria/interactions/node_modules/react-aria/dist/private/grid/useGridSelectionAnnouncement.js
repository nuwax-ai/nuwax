import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import $4drYP$intlStringsjs from "./intlStrings.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useUpdateEffect as $b444858e8a82ccea$export$496315a1608d9602} from "../utils/useUpdateEffect.js";
import {useRef as $4drYP$useRef, useCallback as $4drYP$useCallback} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $c799300bff6b6e06$export$137e594ef3218a10(props, state) {
    let { getRowText: getRowText = (key)=>{
        var _state_collection_getTextValue, _state_collection, _state_collection_getItem;
        var _state_collection_getTextValue1;
        return (_state_collection_getTextValue1 = (_state_collection_getTextValue = (_state_collection = state.collection).getTextValue) === null || _state_collection_getTextValue === void 0 ? void 0 : _state_collection_getTextValue.call(_state_collection, key)) !== null && _state_collection_getTextValue1 !== void 0 ? _state_collection_getTextValue1 : (_state_collection_getItem = state.collection.getItem(key)) === null || _state_collection_getItem === void 0 ? void 0 : _state_collection_getItem.textValue;
    } } = props;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4drYP$intlStringsjs))), '@react-aria/grid');
    // Many screen readers do not announce when items in a grid are selected/deselected.
    // We do this using an ARIA live region.
    let selection = state.selectionManager.rawSelection;
    let lastSelection = (0, $4drYP$useRef)(selection);
    let announceSelectionChange = (0, $4drYP$useCallback)(()=>{
        var _lastSelection_current;
        if (!state.selectionManager.isFocused || selection === lastSelection.current) {
            lastSelection.current = selection;
            return;
        }
        let addedKeys = $c799300bff6b6e06$var$diffSelection(selection, lastSelection.current);
        let removedKeys = $c799300bff6b6e06$var$diffSelection(lastSelection.current, selection);
        // If adding or removing a single row from the selection, announce the name of that item.
        let isReplace = state.selectionManager.selectionBehavior === 'replace';
        let messages = [];
        if (state.selectionManager.selectedKeys.size === 1 && isReplace) {
            let firstKey = state.selectionManager.selectedKeys.keys().next().value;
            if (firstKey != null && state.collection.getItem(firstKey)) {
                let currentSelectionText = getRowText(firstKey);
                if (currentSelectionText) messages.push(stringFormatter.format('selectedItem', {
                    item: currentSelectionText
                }));
            }
        } else if (addedKeys.size === 1 && removedKeys.size === 0) {
            let firstKey = addedKeys.keys().next().value;
            if (firstKey != null) {
                let addedText = getRowText(firstKey);
                if (addedText) messages.push(stringFormatter.format('selectedItem', {
                    item: addedText
                }));
            }
        } else if (removedKeys.size === 1 && addedKeys.size === 0) {
            let firstKey = removedKeys.keys().next().value;
            if (firstKey != null && state.collection.getItem(firstKey)) {
                let removedText = getRowText(firstKey);
                if (removedText) messages.push(stringFormatter.format('deselectedItem', {
                    item: removedText
                }));
            }
        }
        // Announce how many items are selected, except when selecting the first item.
        if (state.selectionManager.selectionMode === 'multiple') {
            if (messages.length === 0 || selection === 'all' || selection.size > 1 || lastSelection.current === 'all' || ((_lastSelection_current = lastSelection.current) === null || _lastSelection_current === void 0 ? void 0 : _lastSelection_current.size) > 1) messages.push(selection === 'all' ? stringFormatter.format('selectedAll') : stringFormatter.format('selectedCount', {
                count: selection.size
            }));
        }
        if (messages.length > 0) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(messages.join(' '));
        lastSelection.current = selection;
    }, [
        selection,
        state.selectionManager.selectedKeys,
        state.selectionManager.isFocused,
        state.selectionManager.selectionBehavior,
        state.selectionManager.selectionMode,
        state.collection,
        getRowText,
        stringFormatter
    ]);
    // useUpdateEffect will handle using useEffectEvent, no need to stabilize anything on this end
    (0, $b444858e8a82ccea$export$496315a1608d9602)(()=>{
        if (state.selectionManager.isFocused) announceSelectionChange();
        else {
            // Wait a frame in case the collection is about to become focused (e.g. on mouse down).
            let raf = requestAnimationFrame(announceSelectionChange);
            return ()=>cancelAnimationFrame(raf);
        }
    }, [
        selection,
        state.selectionManager.isFocused
    ]);
}
function $c799300bff6b6e06$var$diffSelection(a, b) {
    let res = new Set();
    if (a === 'all' || b === 'all') return res;
    for (let key of a.keys())if (!b.has(key)) res.add(key);
    return res;
}


export {$c799300bff6b6e06$export$137e594ef3218a10 as useGridSelectionAnnouncement};
//# sourceMappingURL=useGridSelectionAnnouncement.js.map
