var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $88d878ce22ac7f67$exports = require("./intlStrings.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $c4703f4a6fffa1e7$exports = require("../utils/useUpdateEffect.cjs");
var $bOW8t$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridSelectionAnnouncement", function () { return $35a82e8f7ac1674d$export$137e594ef3218a10; });
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




function $35a82e8f7ac1674d$export$137e594ef3218a10(props, state) {
    let { getRowText: getRowText = (key)=>state.collection.getTextValue?.(key) ?? state.collection.getItem(key)?.textValue } = props;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($88d878ce22ac7f67$exports))), '@react-aria/grid');
    // Many screen readers do not announce when items in a grid are selected/deselected.
    // We do this using an ARIA live region.
    let selection = state.selectionManager.rawSelection;
    let lastSelection = (0, $bOW8t$react.useRef)(selection);
    let announceSelectionChange = (0, $bOW8t$react.useCallback)(()=>{
        if (!state.selectionManager.isFocused || selection === lastSelection.current) {
            lastSelection.current = selection;
            return;
        }
        let addedKeys = $35a82e8f7ac1674d$var$diffSelection(selection, lastSelection.current);
        let removedKeys = $35a82e8f7ac1674d$var$diffSelection(lastSelection.current, selection);
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
        if (messages.length > 0) (0, $74b2c5b1e7ea9589$exports.announce)(messages.join(' '));
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
    (0, $c4703f4a6fffa1e7$exports.useUpdateEffect)(()=>{
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
function $35a82e8f7ac1674d$var$diffSelection(a, b) {
    let res = new Set();
    if (a === 'all' || b === 'all') return res;
    for (let key of a.keys())if (!b.has(key)) res.add(key);
    return res;
}


//# sourceMappingURL=useGridSelectionAnnouncement.cjs.map
