import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import $dKyQQ$intlStringsmjs from "./intlStrings.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useUpdateEffect as $3c71b1595a147f24$export$496315a1608d9602} from "../utils/useUpdateEffect.mjs";
import {useRef as $dKyQQ$useRef, useCallback as $dKyQQ$useCallback} from "react";


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




function $2b2556a8276954c1$export$137e594ef3218a10(props, state) {
    let { getRowText: getRowText = (key)=>state.collection.getTextValue?.(key) ?? state.collection.getItem(key)?.textValue } = props;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($dKyQQ$intlStringsmjs))), '@react-aria/grid');
    // Many screen readers do not announce when items in a grid are selected/deselected.
    // We do this using an ARIA live region.
    let selection = state.selectionManager.rawSelection;
    let lastSelection = (0, $dKyQQ$useRef)(selection);
    let announceSelectionChange = (0, $dKyQQ$useCallback)(()=>{
        if (!state.selectionManager.isFocused || selection === lastSelection.current) {
            lastSelection.current = selection;
            return;
        }
        let addedKeys = $2b2556a8276954c1$var$diffSelection(selection, lastSelection.current);
        let removedKeys = $2b2556a8276954c1$var$diffSelection(lastSelection.current, selection);
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
            if (messages.length === 0 || selection === 'all' || selection.size > 1 || lastSelection.current === 'all' || lastSelection.current?.size > 1) messages.push(selection === 'all' ? stringFormatter.format('selectedAll') : stringFormatter.format('selectedCount', {
                count: selection.size
            }));
        }
        if (messages.length > 0) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(messages.join(' '));
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
    (0, $3c71b1595a147f24$export$496315a1608d9602)(()=>{
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
function $2b2556a8276954c1$var$diffSelection(a, b) {
    let res = new Set();
    if (a === 'all' || b === 'all') return res;
    for (let key of a.keys())if (!b.has(key)) res.add(key);
    return res;
}


export {$2b2556a8276954c1$export$137e594ef3218a10 as useGridSelectionAnnouncement};
//# sourceMappingURL=useGridSelectionAnnouncement.mjs.map
