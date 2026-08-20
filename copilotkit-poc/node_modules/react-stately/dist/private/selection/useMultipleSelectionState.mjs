import {Selection as $8b2540e09867b15e$export$52baac22726c72bf} from "./Selection.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useRef as $7w3VE$useRef, useState as $7w3VE$useState, useMemo as $7w3VE$useMemo, useEffect as $7w3VE$useEffect} from "react";

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


function $60f19cefd567a3e4$var$equalSets(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (let item of setA){
        if (!setB.has(item)) return false;
    }
    return true;
}
function $60f19cefd567a3e4$export$253fe78d46329472(props) {
    let { selectionMode: selectionMode = 'none', disallowEmptySelection: disallowEmptySelection = false, allowDuplicateSelectionEvents: allowDuplicateSelectionEvents, selectionBehavior: selectionBehaviorProp = 'toggle', disabledBehavior: disabledBehavior = 'all' } = props;
    // We want synchronous updates to `isFocused` and `focusedKey` after their setters are called.
    // But we also need to trigger a react re-render. So, we have both a ref (sync) and state (async).
    let isFocusedRef = (0, $7w3VE$useRef)(false);
    let [, setFocused] = (0, $7w3VE$useState)(false);
    let focusedKeyRef = (0, $7w3VE$useRef)(null);
    let childFocusStrategyRef = (0, $7w3VE$useRef)(null);
    let [, setFocusedKey] = (0, $7w3VE$useState)(null);
    let selectedKeysProp = (0, $7w3VE$useMemo)(()=>$60f19cefd567a3e4$var$convertSelection(props.selectedKeys), [
        props.selectedKeys
    ]);
    let defaultSelectedKeys = (0, $7w3VE$useMemo)(()=>$60f19cefd567a3e4$var$convertSelection(props.defaultSelectedKeys, new (0, $8b2540e09867b15e$export$52baac22726c72bf)()), [
        props.defaultSelectedKeys
    ]);
    let [selectedKeys, setSelectedKeys] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(selectedKeysProp, defaultSelectedKeys, props.onSelectionChange);
    let disabledKeysProp = (0, $7w3VE$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let [selectionBehavior, setSelectionBehavior] = (0, $7w3VE$useState)(selectionBehaviorProp);
    // If the selectionBehavior prop is set to replace, but the current state is toggle (e.g. due to long press
    // to enter selection mode on touch), and the selection becomes empty, reset the selection behavior.
    if (selectionBehaviorProp === 'replace' && selectionBehavior === 'toggle' && typeof selectedKeys === 'object' && selectedKeys.size === 0) setSelectionBehavior('replace');
    // If the selectionBehavior prop changes, update the state as well.
    let lastSelectionBehavior = (0, $7w3VE$useRef)(selectionBehaviorProp);
    (0, $7w3VE$useEffect)(()=>{
        if (selectionBehaviorProp !== lastSelectionBehavior.current) {
            setSelectionBehavior(selectionBehaviorProp);
            lastSelectionBehavior.current = selectionBehaviorProp;
        }
    }, [
        selectionBehaviorProp
    ]);
    return {
        selectionMode: selectionMode,
        disallowEmptySelection: disallowEmptySelection,
        selectionBehavior: selectionBehavior,
        setSelectionBehavior: setSelectionBehavior,
        get isFocused () {
            return isFocusedRef.current;
        },
        setFocused (f) {
            isFocusedRef.current = f;
            setFocused(f);
        },
        get focusedKey () {
            return focusedKeyRef.current;
        },
        get childFocusStrategy () {
            return childFocusStrategyRef.current;
        },
        setFocusedKey (k, childFocusStrategy = 'first') {
            focusedKeyRef.current = k;
            childFocusStrategyRef.current = childFocusStrategy;
            setFocusedKey(k);
        },
        selectedKeys: selectedKeys,
        setSelectedKeys (keys) {
            if (allowDuplicateSelectionEvents || !$60f19cefd567a3e4$var$equalSets(keys, selectedKeys)) setSelectedKeys(keys);
        },
        disabledKeys: disabledKeysProp,
        disabledBehavior: disabledBehavior
    };
}
function $60f19cefd567a3e4$var$convertSelection(selection, defaultValue) {
    if (!selection) return defaultValue;
    return selection === 'all' ? 'all' : new (0, $8b2540e09867b15e$export$52baac22726c72bf)(selection);
}


export {$60f19cefd567a3e4$export$253fe78d46329472 as useMultipleSelectionState};
//# sourceMappingURL=useMultipleSelectionState.mjs.map
