var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $359c8238bb510d61$exports = require("../list/useListState.cjs");
var $a359060d53fd4d72$exports = require("../overlays/useOverlayTriggerState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $kK5eD$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSelectState", function () { return $22b86546550c7d33$export$5159ec8b34d4ec12; });
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




function $22b86546550c7d33$export$5159ec8b34d4ec12(props) {
    let { selectionMode: selectionMode = 'single', shouldCloseOnSelect: shouldCloseOnSelect = selectionMode === 'single' } = props;
    let triggerState = (0, $a359060d53fd4d72$exports.useOverlayTriggerState)(props);
    let [focusStrategy, setFocusStrategy] = (0, $kK5eD$react.useState)(null);
    let defaultValue = (0, $kK5eD$react.useMemo)(()=>{
        return props.defaultValue !== undefined ? props.defaultValue : selectionMode === 'single' ? props.defaultSelectedKey ?? null : [];
    }, [
        props.defaultValue,
        props.defaultSelectedKey,
        selectionMode
    ]);
    let value = (0, $kK5eD$react.useMemo)(()=>{
        return props.value !== undefined ? props.value : selectionMode === 'single' ? props.selectedKey : undefined;
    }, [
        props.value,
        props.selectedKey,
        selectionMode
    ]);
    let [controlledValue, setControlledValue] = (0, $14cedf286405cc4b$exports.useControlledState)(value, defaultValue, props.onChange);
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
    let listState = (0, $359c8238bb510d61$exports.useListState)({
        ...props,
        selectionMode: selectionMode,
        disallowEmptySelection: selectionMode === 'single',
        allowDuplicateSelectionEvents: true,
        selectedKeys: (0, $kK5eD$react.useMemo)(()=>$22b86546550c7d33$var$convertValue(displayValue), [
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
    let selectedItems = (0, $kK5eD$react.useMemo)(()=>{
        return [
            ...listState.selectionManager.selectedKeys
        ].map((key)=>listState.collection.getItem(key)).filter((item)=>item != null);
    }, [
        listState.selectionManager.selectedKeys,
        listState.collection
    ]);
    let validationState = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
        ...props,
        value: Array.isArray(displayValue) && displayValue.length === 0 ? null : displayValue
    });
    let [isFocused, setFocused] = (0, $kK5eD$react.useState)(false);
    let [initialValue] = (0, $kK5eD$react.useState)(displayValue);
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
function $22b86546550c7d33$var$convertValue(value) {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return Array.isArray(value) ? value : [
        value
    ];
}


//# sourceMappingURL=useSelectState.cjs.map
