import {useFormValidationState as $d085204f885ad67a$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.js";
import {useListState as $9148925efdde78ec$export$2f645645f7bca764} from "../list/useListState.js";
import {useOverlayTriggerState as $3b152ed05cfdb7e2$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $gkNT7$useState, useMemo as $gkNT7$useMemo} from "react";

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




function $1b2568040b4efc20$export$5159ec8b34d4ec12(props) {
    let { selectionMode: selectionMode = 'single', shouldCloseOnSelect: shouldCloseOnSelect = selectionMode === 'single' } = props;
    let triggerState = (0, $3b152ed05cfdb7e2$export$61c6a8c84e605fb6)(props);
    let [focusStrategy, setFocusStrategy] = (0, $gkNT7$useState)(null);
    let defaultValue = (0, $gkNT7$useMemo)(()=>{
        var _props_defaultSelectedKey;
        return props.defaultValue !== undefined ? props.defaultValue : selectionMode === 'single' ? (_props_defaultSelectedKey = props.defaultSelectedKey) !== null && _props_defaultSelectedKey !== void 0 ? _props_defaultSelectedKey : null : [];
    }, [
        props.defaultValue,
        props.defaultSelectedKey,
        selectionMode
    ]);
    let value = (0, $gkNT7$useMemo)(()=>{
        return props.value !== undefined ? props.value : selectionMode === 'single' ? props.selectedKey : undefined;
    }, [
        props.value,
        props.selectedKey,
        selectionMode
    ]);
    let [controlledValue, setControlledValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(value, defaultValue, props.onChange);
    // Only display the first selected item if in single selection mode but the value is an array.
    let displayValue = selectionMode === 'single' && Array.isArray(controlledValue) ? controlledValue[0] : controlledValue;
    let setValue = (value)=>{
        if (selectionMode === 'single') {
            var _props_onSelectionChange;
            var _value_;
            let key = Array.isArray(value) ? (_value_ = value[0]) !== null && _value_ !== void 0 ? _value_ : null : value;
            setControlledValue(key);
            if (key !== displayValue) (_props_onSelectionChange = props.onSelectionChange) === null || _props_onSelectionChange === void 0 ? void 0 : _props_onSelectionChange.call(props, key);
        } else {
            let keys = [];
            if (Array.isArray(value)) keys = value;
            else if (value != null) keys = [
                value
            ];
            setControlledValue(keys);
        }
    };
    let listState = (0, $9148925efdde78ec$export$2f645645f7bca764)({
        ...props,
        selectionMode: selectionMode,
        disallowEmptySelection: selectionMode === 'single',
        allowDuplicateSelectionEvents: true,
        selectedKeys: (0, $gkNT7$useMemo)(()=>$1b2568040b4efc20$var$convertValue(displayValue), [
            displayValue
        ]),
        onSelectionChange: (keys)=>{
            // impossible, but TS doesn't know that
            if (keys === 'all') return;
            if (selectionMode === 'single') {
                var _keys_values_next_value;
                let key = (_keys_values_next_value = keys.values().next().value) !== null && _keys_values_next_value !== void 0 ? _keys_values_next_value : null;
                setValue(key);
            } else setValue([
                ...keys
            ]);
            if (shouldCloseOnSelect) triggerState.close();
            validationState.commitValidation();
        }
    });
    let selectedKey = listState.selectionManager.firstSelectedKey;
    let selectedItems = (0, $gkNT7$useMemo)(()=>{
        return [
            ...listState.selectionManager.selectedKeys
        ].map((key)=>listState.collection.getItem(key)).filter((item)=>item != null);
    }, [
        listState.selectionManager.selectedKeys,
        listState.collection
    ]);
    let validationState = (0, $d085204f885ad67a$export$fc1a364ae1f3ff10)({
        ...props,
        value: Array.isArray(displayValue) && displayValue.length === 0 ? null : displayValue
    });
    let [isFocused, setFocused] = (0, $gkNT7$useState)(false);
    let [initialValue] = (0, $gkNT7$useState)(displayValue);
    var _selectedItems_, _props_defaultSelectedKey;
    return {
        ...validationState,
        ...listState,
        ...triggerState,
        value: displayValue,
        defaultValue: defaultValue !== null && defaultValue !== void 0 ? defaultValue : initialValue,
        setValue: setValue,
        selectedKey: selectedKey,
        setSelectedKey: setValue,
        selectedItem: (_selectedItems_ = selectedItems[0]) !== null && _selectedItems_ !== void 0 ? _selectedItems_ : null,
        selectedItems: selectedItems,
        defaultSelectedKey: (_props_defaultSelectedKey = props.defaultSelectedKey) !== null && _props_defaultSelectedKey !== void 0 ? _props_defaultSelectedKey : props.selectionMode === 'single' ? initialValue : null,
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
function $1b2568040b4efc20$var$convertValue(value) {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return Array.isArray(value) ? value : [
        value
    ];
}


export {$1b2568040b4efc20$export$5159ec8b34d4ec12 as useSelectState};
//# sourceMappingURL=useSelectState.js.map
