var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $c731fb93d14b07fc$exports = require("../collections/getChildNodes.cjs");
var $fdd8ee0c4512c304$exports = require("../list/ListCollection.cjs");
var $359c8238bb510d61$exports = require("../list/useListState.cjs");
var $a359060d53fd4d72$exports = require("../overlays/useOverlayTriggerState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $bjszJ$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useComboBoxState", function () { return $d4887b243094b5e1$export$b453a3bfd4a5fa9e; });
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






function $d4887b243094b5e1$export$b453a3bfd4a5fa9e(props) {
    let { defaultFilter: defaultFilter, menuTrigger: menuTrigger = 'input', allowsEmptyCollection: allowsEmptyCollection = false, allowsCustomValue: allowsCustomValue, shouldCloseOnBlur: shouldCloseOnBlur = true, selectionMode: selectionMode = 'single' } = props;
    let [showAllItems, setShowAllItems] = (0, $bjszJ$react.useState)(false);
    let [isFocused, setFocusedState] = (0, $bjszJ$react.useState)(false);
    let [focusStrategy, setFocusStrategy] = (0, $bjszJ$react.useState)(null);
    let defaultValue = (0, $bjszJ$react.useMemo)(()=>{
        return props.defaultValue !== undefined ? props.defaultValue : selectionMode === 'single' ? props.defaultSelectedKey ?? null : [];
    }, [
        props.defaultValue,
        props.defaultSelectedKey,
        selectionMode
    ]);
    let value = (0, $bjszJ$react.useMemo)(()=>{
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
    let { collection: collection, selectionManager: selectionManager, disabledKeys: disabledKeys } = (0, $359c8238bb510d61$exports.useListState)({
        ...props,
        items: props.items ?? props.defaultItems,
        selectionMode: selectionMode,
        disallowEmptySelection: selectionMode === 'single',
        allowDuplicateSelectionEvents: true,
        selectedKeys: (0, $bjszJ$react.useMemo)(()=>$d4887b243094b5e1$var$convertValue(displayValue), [
            displayValue
        ]),
        onSelectionChange: (keys)=>{
            // impossible, but TS doesn't know that
            if (keys === 'all') return;
            if (selectionMode === 'single') {
                let key = keys.values().next().value ?? null;
                if (key === displayValue) {
                    props.onSelectionChange?.(key);
                    // If key is the same, reset the inputValue and close the menu
                    // (scenario: user clicks on already selected option)
                    resetInputValue();
                    closeMenu();
                } else setValue(key);
            } else setValue([
                ...keys
            ]);
        }
    });
    let selectedKey = selectionMode === 'single' ? selectionManager.firstSelectedKey : null;
    let selectedItems = (0, $bjszJ$react.useMemo)(()=>{
        return [
            ...selectionManager.selectedKeys
        ].map((key)=>collection.getItem(key)).filter((item)=>item != null);
    }, [
        selectionManager.selectedKeys,
        collection
    ]);
    let [inputValue, setInputValue] = (0, $14cedf286405cc4b$exports.useControlledState)(props.inputValue, $d4887b243094b5e1$var$getDefaultInputValue(props.defaultInputValue, selectedKey, collection) || '', props.onInputChange);
    let [initialValue] = (0, $bjszJ$react.useState)(displayValue);
    let [initialInputValue] = (0, $bjszJ$react.useState)(inputValue);
    // Preserve original collection so we can show all items on demand
    let originalCollection = collection;
    let filteredCollection = (0, $bjszJ$react.useMemo)(()=>// No default filter if items are controlled.
        props.items != null || !defaultFilter ? collection : $d4887b243094b5e1$var$filterCollection(collection, inputValue, defaultFilter), [
        collection,
        inputValue,
        defaultFilter,
        props.items
    ]);
    let [lastCollection, setLastCollection] = (0, $bjszJ$react.useState)(filteredCollection);
    // Track what action is attempting to open the menu
    let menuOpenTrigger = (0, $bjszJ$react.useRef)('focus');
    let onOpenChange = (open)=>{
        if (props.onOpenChange) props.onOpenChange(open, open ? menuOpenTrigger.current : undefined);
        selectionManager.setFocused(open);
        if (!open) selectionManager.setFocusedKey(null);
    };
    let triggerState = (0, $a359060d53fd4d72$exports.useOverlayTriggerState)({
        ...props,
        onOpenChange: onOpenChange,
        isOpen: undefined,
        defaultOpen: undefined
    });
    let open = (focusStrategy = null, trigger)=>{
        let displayAllItems = trigger === 'manual' || trigger === 'focus' && menuTrigger === 'focus';
        // Prevent open operations from triggering if there is nothing to display
        // Also prevent open operations from triggering if items are uncontrolled but defaultItems is empty, even if displayAllItems is true.
        // This is to prevent comboboxes with empty defaultItems from opening but allow controlled items comboboxes to open even if the inital list is empty (assumption is user will provide swap the empty list with a base list via onOpenChange returning `menuTrigger` manual)
        if (allowsEmptyCollection || filteredCollection.size > 0 || displayAllItems && originalCollection.size > 0 || props.items) {
            if (displayAllItems && !triggerState.isOpen && props.items === undefined) // Show all items if menu is manually opened. Only care about this if items are undefined
            setShowAllItems(true);
            menuOpenTrigger.current = trigger;
            setFocusStrategy(focusStrategy);
            triggerState.open();
        }
    };
    let toggle = (focusStrategy = null, trigger)=>{
        let displayAllItems = trigger === 'manual' || trigger === 'focus' && menuTrigger === 'focus';
        // If the menu is closed and there is nothing to display, early return so toggle isn't called to prevent extraneous onOpenChange
        if (!(allowsEmptyCollection || filteredCollection.size > 0 || displayAllItems && originalCollection.size > 0 || props.items) && !triggerState.isOpen) return;
        if (displayAllItems && !triggerState.isOpen && props.items === undefined) // Show all items if menu is toggled open. Only care about this if items are undefined
        setShowAllItems(true);
        // Only update the menuOpenTrigger if menu is currently closed
        if (!triggerState.isOpen) menuOpenTrigger.current = trigger;
        toggleMenu(focusStrategy);
    };
    let updateLastCollection = (0, $bjszJ$react.useCallback)(()=>{
        setLastCollection(showAllItems ? originalCollection : filteredCollection);
    }, [
        showAllItems,
        originalCollection,
        filteredCollection
    ]);
    // If menu is going to close, save the current collection so we can freeze the displayed collection when the
    // user clicks outside the popover to close the menu. Prevents the menu contents from updating as the menu closes.
    let toggleMenu = (0, $bjszJ$react.useCallback)((focusStrategy = null)=>{
        if (triggerState.isOpen) updateLastCollection();
        setFocusStrategy(focusStrategy);
        triggerState.toggle();
    }, [
        triggerState,
        updateLastCollection
    ]);
    let closeMenu = (0, $bjszJ$react.useCallback)(()=>{
        if (triggerState.isOpen) {
            updateLastCollection();
            triggerState.close();
        }
    }, [
        triggerState,
        updateLastCollection
    ]);
    let [lastValue, setLastValue] = (0, $bjszJ$react.useState)(inputValue);
    let resetInputValue = ()=>{
        let itemText = selectedKey != null ? collection.getItem(selectedKey)?.textValue ?? '' : '';
        setLastValue(itemText);
        setInputValue(itemText);
    };
    let lastValueRef = (0, $bjszJ$react.useRef)(displayValue);
    let lastSelectedKeyText = (0, $bjszJ$react.useRef)(selectedKey != null ? collection.getItem(selectedKey)?.textValue ?? '' : '');
    // intentional omit dependency array, want this to happen on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $bjszJ$react.useEffect)(()=>{
        // Open and close menu automatically when the input value changes if the input is focused,
        // and there are items in the collection or allowEmptyCollection is true.
        if (isFocused && (filteredCollection.size > 0 || allowsEmptyCollection) && !triggerState.isOpen && inputValue !== lastValue && menuTrigger !== 'manual') open(null, 'input');
        // Close the menu if the collection is empty. Don't close menu if filtered collection size is 0
        // but we are currently showing all items via button press
        if (!showAllItems && !allowsEmptyCollection && triggerState.isOpen && filteredCollection.size === 0) closeMenu();
        // Close when an item is selected.
        if (displayValue != null && displayValue !== lastValueRef.current && selectionMode === 'single') closeMenu();
        // Clear focused key when input value changes and display filtered collection again.
        if (inputValue !== lastValue) {
            selectionManager.setFocusedKey(null);
            setShowAllItems(false);
            // Set value to null when the user clears the input.
            // If controlled, this is the application developer's responsibility.
            if (selectionMode === 'single' && inputValue === '' && (props.inputValue === undefined || value === undefined)) setValue(null);
        }
        // If the value changed, update the input value.
        // Do nothing if both inputValue and value are controlled.
        // In this case, it's the user's responsibility to update inputValue in onSelectionChange.
        if (displayValue !== lastValueRef.current && (props.inputValue === undefined || value === undefined)) resetInputValue();
        else if (lastValue !== inputValue) setLastValue(inputValue);
        // Update the inputValue if the selected item's text changes from its last tracked value.
        // This is to handle cases where a selectedKey is specified but the items aren't available (async loading) or the selected item's text value updates.
        // Only reset if the user isn't currently within the field so we don't erroneously modify user input.
        // If inputValue is controlled, it is the user's responsibility to update the inputValue when items change.
        let selectedItemText = selectedKey != null ? collection.getItem(selectedKey)?.textValue ?? '' : '';
        if (!isFocused && selectedKey != null && props.inputValue === undefined && selectedKey === lastValueRef.current) {
            if (lastSelectedKeyText.current !== selectedItemText) {
                setLastValue(selectedItemText);
                setInputValue(selectedItemText);
            }
        }
        lastValueRef.current = displayValue;
        lastSelectedKeyText.current = selectedItemText;
    });
    let validation = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
        ...props,
        value: (0, $bjszJ$react.useMemo)(()=>Array.isArray(displayValue) && displayValue.length === 0 ? null : {
                inputValue: inputValue,
                value: displayValue,
                selectedKey: selectedKey
            }, [
            inputValue,
            selectedKey,
            displayValue
        ])
    });
    // Revert input value and close menu
    let revert = ()=>{
        if (allowsCustomValue && selectedKey == null) commitCustomValue();
        else commitSelection();
    };
    let commitCustomValue = ()=>{
        if (selectionMode === 'multiple') {
            // In multi-select mode, the input's custom text is independent from the selected items.
            // Closing or committing the field should not clear the existing selection.
            setLastValue(inputValue);
            closeMenu();
            return;
        }
        let value = null;
        lastValueRef.current = value;
        setValue(value);
        closeMenu();
    };
    let commitSelection = (shouldForceSelectionChange = false)=>{
        // If multiple things are controlled, call onSelectionChange only when selecting the focused item,
        // or when inputValue needs to be synced back to the selected item on commit/blur.
        if (value !== undefined && props.inputValue !== undefined) {
            let itemText = selectedKey != null ? collection.getItem(selectedKey)?.textValue ?? '' : '';
            if (shouldForceSelectionChange || selectionMode === 'multiple' || inputValue !== itemText) {
                props.onSelectionChange?.(selectedKey);
                props.onChange?.(displayValue);
            }
            // Stop menu from reopening from useEffect
            setLastValue(itemText);
            closeMenu();
        } else {
            // If only a single aspect of combobox is controlled, reset input value and close menu for the user
            resetInputValue();
            closeMenu();
        }
    };
    const commitValue = ()=>{
        if (allowsCustomValue) {
            const itemText = selectedKey != null ? collection.getItem(selectedKey)?.textValue ?? '' : '';
            inputValue === itemText ? commitSelection() : commitCustomValue();
        } else // Reset inputValue and close menu
        commitSelection();
    };
    let commit = ()=>{
        if (triggerState.isOpen && selectionManager.focusedKey != null) {
            // Reset inputValue and close menu here if the selected key is already the focused key. Otherwise
            // fire onSelectionChange to allow the application to control the closing.
            if (selectionManager.isSelected(selectionManager.focusedKey) && selectionMode === 'single') commitSelection(true);
            else selectionManager.select(selectionManager.focusedKey);
        } else commitValue();
    };
    let valueOnFocus = (0, $bjszJ$react.useRef)([
        inputValue,
        displayValue
    ]);
    let setFocused = (isFocused)=>{
        if (isFocused) {
            valueOnFocus.current = [
                inputValue,
                displayValue
            ];
            if (menuTrigger === 'focus' && !props.isReadOnly) open(null, 'focus');
        } else {
            if (shouldCloseOnBlur) commitValue();
            // Commit validation if the input value or selected items changed.
            if (inputValue !== valueOnFocus.current[0] || displayValue !== valueOnFocus.current[1]) validation.commitValidation();
        }
        setFocusedState(isFocused);
    };
    let displayedCollection = (0, $bjszJ$react.useMemo)(()=>{
        if (triggerState.isOpen) {
            if (showAllItems) return originalCollection;
            else return filteredCollection;
        } else return lastCollection;
    }, [
        triggerState.isOpen,
        originalCollection,
        filteredCollection,
        showAllItems,
        lastCollection
    ]);
    let defaultSelectedKey = props.defaultSelectedKey ?? (selectionMode === 'single' ? initialValue : null);
    return {
        ...validation,
        ...triggerState,
        focusStrategy: focusStrategy,
        toggle: toggle,
        open: open,
        close: commitValue,
        selectionManager: selectionManager,
        value: displayValue,
        defaultValue: defaultValue ?? initialValue,
        setValue: setValue,
        selectedKey: selectedKey,
        selectedItems: selectedItems,
        defaultSelectedKey: defaultSelectedKey,
        setSelectedKey: setValue,
        disabledKeys: disabledKeys,
        isFocused: isFocused,
        setFocused: setFocused,
        selectedItem: selectedItems[0] ?? null,
        collection: displayedCollection,
        inputValue: inputValue,
        defaultInputValue: $d4887b243094b5e1$var$getDefaultInputValue(props.defaultInputValue, defaultSelectedKey, collection) ?? initialInputValue,
        setInputValue: setInputValue,
        commit: commit,
        revert: revert
    };
}
function $d4887b243094b5e1$var$filterCollection(collection, inputValue, filter) {
    return new (0, $fdd8ee0c4512c304$exports.ListCollection)($d4887b243094b5e1$var$filterNodes(collection, collection, inputValue, filter));
}
function $d4887b243094b5e1$var$filterNodes(collection, nodes, inputValue, filter) {
    let filteredNode = [];
    for (let node of nodes){
        if (node.type === 'section' && node.hasChildNodes) {
            let filtered = $d4887b243094b5e1$var$filterNodes(collection, (0, $c731fb93d14b07fc$exports.getChildNodes)(node, collection), inputValue, filter);
            if ([
                ...filtered
            ].some((node)=>node.type === 'item')) filteredNode.push({
                ...node,
                childNodes: filtered
            });
        } else if (node.type === 'item' && filter(node.textValue, inputValue)) filteredNode.push({
            ...node
        });
        else if (node.type !== 'item') filteredNode.push({
            ...node
        });
    }
    return filteredNode;
}
function $d4887b243094b5e1$var$getDefaultInputValue(defaultInputValue, selectedKey, collection) {
    if (defaultInputValue == null) {
        if (selectedKey != null) return collection.getItem(selectedKey)?.textValue ?? '';
    }
    return defaultInputValue;
}
function $d4887b243094b5e1$var$convertValue(value) {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return Array.isArray(value) ? value : [
        value
    ];
}


//# sourceMappingURL=useComboBoxState.cjs.map
