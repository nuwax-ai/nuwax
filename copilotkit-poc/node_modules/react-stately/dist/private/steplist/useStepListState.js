import {useSingleSelectListState as $3273f0ec0a144ce7$export$e7f05e985daf4b5f} from "../list/useSingleSelectListState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMemo as $8vmZI$useMemo, useCallback as $8vmZI$useCallback, useEffect as $8vmZI$useEffect} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


function $3f9692e5d60c0cd6$export$a993ed2a771330b(props) {
    let state = (0, $3273f0ec0a144ce7$export$e7f05e985daf4b5f)({
        ...props,
        onSelectionChange: props.onSelectionChange ? (key)=>{
            var _props_onSelectionChange;
            if (key != null) (_props_onSelectionChange = props.onSelectionChange) === null || _props_onSelectionChange === void 0 ? void 0 : _props_onSelectionChange.call(props, key);
        } : undefined
    });
    var _props_defaultLastCompletedStep;
    let [lastCompletedStep, setLastCompletedStep] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.lastCompletedStep, (_props_defaultLastCompletedStep = props.defaultLastCompletedStep) !== null && _props_defaultLastCompletedStep !== void 0 ? _props_defaultLastCompletedStep : null, props.onLastCompletedStepChange);
    const { setSelectedKey: realSetSelectedKey, selectedKey: selectedKey, collection: collection } = state;
    const { indexMap: indexMap, keysLinkedList: keysLinkedList } = (0, $8vmZI$useMemo)(()=>$3f9692e5d60c0cd6$var$buildKeysMaps(collection), [
        collection
    ]);
    const selectedIdx = selectedKey != null ? indexMap.get(selectedKey) : 0;
    const isCompleted = (0, $8vmZI$useCallback)((step)=>{
        if (step === undefined) return false;
        return step !== null && lastCompletedStep !== null && indexMap.has(step) && indexMap.has(lastCompletedStep) && indexMap.get(step) <= indexMap.get(lastCompletedStep);
    }, [
        indexMap,
        lastCompletedStep
    ]);
    const findDefaultSelectedKey = (0, $8vmZI$useCallback)((collection, disabledKeys)=>{
        let selectedKey = null;
        if (collection && collection.size > 0) {
            selectedKey = collection.getFirstKey();
            // loop over keys until we find one that isn't completed or disabled and select that
            while(selectedKey !== collection.getLastKey() && selectedKey && (disabledKeys.has(selectedKey) || isCompleted(selectedKey)))selectedKey = collection.getKeyAfter(selectedKey);
        }
        return selectedKey;
    }, [
        isCompleted
    ]);
    (0, $8vmZI$useEffect)(()=>{
        // Ensure a step is always selected (in case no selected key was specified or if selected item was deleted from collection)
        let selectedKey = state.selectedKey;
        if (state.selectionManager.isEmpty || selectedKey == null || !state.collection.getItem(selectedKey)) {
            selectedKey = findDefaultSelectedKey(state.collection, state.disabledKeys);
            if (selectedKey !== null) state.selectionManager.replaceSelection(selectedKey);
        }
        if (state.selectionManager.focusedKey == null) state.selectionManager.setFocusedKey(selectedKey);
        var _ref;
        let lcs = (_ref = lastCompletedStep !== null ? indexMap.get(lastCompletedStep) : -1) !== null && _ref !== void 0 ? _ref : -1;
        if (selectedIdx !== undefined && selectedIdx > 0 && selectedIdx > lcs + 1 && selectedKey !== null && keysLinkedList.has(selectedKey)) setLastCompletedStep(keysLinkedList.get(selectedKey));
    });
    function isSelectable(step) {
        if (props.isDisabled || state.disabledKeys.has(step) || props.isReadOnly) return false;
        if (isCompleted(step)) return true;
        const prevStep = keysLinkedList.get(step);
        return isCompleted(prevStep) || step === state.collection.getFirstKey();
    }
    function setSelectedKey(key) {
        const prevKey = keysLinkedList.get(key);
        if (prevKey && !isCompleted(prevKey)) setLastCompletedStep(prevKey);
        realSetSelectedKey(key);
    }
    return {
        ...state,
        setSelectedKey: setSelectedKey,
        setLastCompletedStep: setLastCompletedStep,
        isCompleted: isCompleted,
        isSelectable: isSelectable
    };
}
function $3f9692e5d60c0cd6$var$buildKeysMaps(coll) {
    const indexMap = new Map();
    const keysLinkedList = new Map();
    let i = 0;
    let prev = undefined;
    for (const item of coll){
        indexMap.set(item.key, i);
        keysLinkedList.set(item.key, prev === null || prev === void 0 ? void 0 : prev.key);
        prev = item;
        i++;
    }
    return {
        indexMap: indexMap,
        keysLinkedList: keysLinkedList
    };
}


export {$3f9692e5d60c0cd6$export$a993ed2a771330b as useStepListState};
//# sourceMappingURL=useStepListState.js.map
