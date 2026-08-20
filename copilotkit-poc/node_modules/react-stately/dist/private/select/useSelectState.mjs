import {useFormValidationState as $fd2148440a13ec26$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.mjs";
import {useListState as $b14b6f590b50af39$export$2f645645f7bca764} from "../list/useListState.mjs";
import {useOverlayTriggerState as $f11fb0bcf1b2687a$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $5t5rb$useState, useMemo as $5t5rb$useMemo} from "react";

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




function $29256f53a2edafe9$export$5159ec8b34d4ec12(props) {
    let { selectionMode: selectionMode = 'single', shouldCloseOnSelect: shouldCloseOnSelect = selectionMode === 'single' } = props;
    let triggerState = (0, $f11fb0bcf1b2687a$export$61c6a8c84e605fb6)(props);
    let [focusStrategy, setFocusStrategy] = (0, $5t5rb$useState)(null);
    let defaultValue = (0, $5t5rb$useMemo)(()=>{
        return props.defaultValue !== undefined ? props.defaultValue : selectionMode === 'single' ? props.defaultSelectedKey ?? null : [];
    }, [
        props.defaultValue,
        props.defaultSelectedKey,
        selectionMode
    ]);
    let value = (0, $5t5rb$useMemo)(()=>{
        return props.value !== undefined ? props.value : selectionMode === 'single' ? props.selectedKey : undefined;
    }, [
        props.value,
        props.selectedKey,
        selectionMode
    ]);
    let [controlledValue, setControlledValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(value, defaultValue, props.onChange);
    // Only display the first selected item if in single selection mode but the value is an array.
    let displayValue = selectionMode === 'single' && Array.isArray(controlledValue) ? controlledValue[0] : controlledValue;
    let setValue = (value)=>{
        if (selectionMode === 'single') {
            let key = Array.isArray(value) ? value[0] ?? null : value;
            setControlledValue(key);
            if (key !== displayValue) props.onSelectionChange?.(key);
        } else {
            let keys = [];
            if (Array.isArray(value)) keys = value;
            else if (value != null) keys = [
                value
            ];
            setControlledValue(keys);
        }
    };
    let listState = (0, $b14b6f590b50af39$export$2f645645f7bca764)({
        ...props,
        selectionMode: selectionMode,
        disallowEmptySelection: selectionMode === 'single',
        allowDuplicateSelectionEvents: true,
        selectedKeys: (0, $5t5rb$useMemo)(()=>$29256f53a2edafe9$var$convertValue(displayValue), [
            displayValue
        ]),
        onSelectionChange: (keys)=>{
            // impossible, but TS doesn't know that
            if (keys === 'all') return;
            if (selectionMode === 'single') {
                let key = keys.values().next().value ?? null;
                setValue(key);
            } else setValue([
                ...keys
            ]);
            if (shouldCloseOnSelect) triggerState.close();
            validationState.commitValidation();
        }
    });
    let selectedKey = listState.selectionManager.firstSelectedKey;
    let selectedItems = (0, $5t5rb$useMemo)(()=>{
        return [
            ...listState.selectionManager.selectedKeys
        ].map((key)=>listState.collection.getItem(key)).filter((item)=>item != null);
    }, [
        listState.selectionManager.selectedKeys,
        listState.collection
    ]);
    let validationState = (0, $fd2148440a13ec26$export$fc1a364ae1f3ff10)({
        ...props,
        value: Array.isArray(displayValue) && displayValue.length === 0 ? null : displayValue
    });
    let [isFocused, setFocused] = (0, $5t5rb$useState)(false);
    let [initialValue] = (0, $5t5rb$useState)(displayValue);
    return {
        ...validationState,
        ...listState,
        ...triggerState,
        value: displayValue,
        defaultValue: defaultValue ?? initialValue,
        setValue: setValue,
        selectedKey: selectedKey,
        setSelectedKey: setValue,
        selectedItem: selectedItems[0] ?? null,
        selectedItems: selectedItems,
        defaultSelectedKey: props.defaultSelectedKey ?? (props.selectionMode === 'single' ? initialValue : null),
        focusStrategy: focusStrategy,
        open (focusStrategy = null) {
            // Don't open if the collection is empty.
            if (listState.collection.size !== 0 || props.allowsEmptyCollection) {
                setFocusStrategy(focusStrategy);
                triggerState.open();
            }
        },
        toggle (focusStrategy = null) {
            if (listState.collection.size !== 0 || props.allowsEmptyCollection) {
                setFocusStrategy(focusStrategy);
                triggerState.toggle();
            }
        },
        isFocused: isFocused,
        setFocused: setFocused
    };
}
function $29256f53a2edafe9$var$convertValue(value) {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return Array.isArray(value) ? value : [
        value
    ];
}


export {$29256f53a2edafe9$export$5159ec8b34d4ec12 as useSelectState};
//# sourceMappingURL=useSelectState.mjs.map
