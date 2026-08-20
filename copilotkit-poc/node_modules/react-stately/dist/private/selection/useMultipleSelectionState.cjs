var $69defba172ea05d3$exports = require("./Selection.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $fpTJ4$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useMultipleSelectionState", function () { return $0af3d14a0ed99bae$export$253fe78d46329472; });
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


function $0af3d14a0ed99bae$var$equalSets(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (let item of setA){
        if (!setB.has(item)) return false;
    }
    return true;
}
function $0af3d14a0ed99bae$export$253fe78d46329472(props) {
    let { selectionMode: selectionMode = 'none', disallowEmptySelection: disallowEmptySelection = false, allowDuplicateSelectionEvents: allowDuplicateSelectionEvents, selectionBehavior: selectionBehaviorProp = 'toggle', disabledBehavior: disabledBehavior = 'all' } = props;
    // We want synchronous updates to `isFocused` and `focusedKey` after their setters are called.
    // But we also need to trigger a react re-render. So, we have both a ref (sync) and state (async).
    let isFocusedRef = (0, $fpTJ4$react.useRef)(false);
    let [, setFocused] = (0, $fpTJ4$react.useState)(false);
    let focusedKeyRef = (0, $fpTJ4$react.useRef)(null);
    let childFocusStrategyRef = (0, $fpTJ4$react.useRef)(null);
    let [, setFocusedKey] = (0, $fpTJ4$react.useState)(null);
    let selectedKeysProp = (0, $fpTJ4$react.useMemo)(()=>$0af3d14a0ed99bae$var$convertSelection(props.selectedKeys), [
        props.selectedKeys
    ]);
    let defaultSelectedKeys = (0, $fpTJ4$react.useMemo)(()=>$0af3d14a0ed99bae$var$convertSelection(props.defaultSelectedKeys, new (0, $69defba172ea05d3$exports.Selection)()), [
        props.defaultSelectedKeys
    ]);
    let [selectedKeys, setSelectedKeys] = (0, $14cedf286405cc4b$exports.useControlledState)(selectedKeysProp, defaultSelectedKeys, props.onSelectionChange);
    let disabledKeysProp = (0, $fpTJ4$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let [selectionBehavior, setSelectionBehavior] = (0, $fpTJ4$react.useState)(selectionBehaviorProp);
    // If the selectionBehavior prop is set to replace, but the current state is toggle (e.g. due to long press
    // to enter selection mode on touch), and the selection becomes empty, reset the selection behavior.
    if (selectionBehaviorProp === 'replace' && selectionBehavior === 'toggle' && typeof selectedKeys === 'object' && selectedKeys.size === 0) setSelectionBehavior('replace');
    // If the selectionBehavior prop changes, update the state as well.
    let lastSelectionBehavior = (0, $fpTJ4$react.useRef)(selectionBehaviorProp);
    (0, $fpTJ4$react.useEffect)(()=>{
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
            if (allowDuplicateSelectionEvents || !$0af3d14a0ed99bae$var$equalSets(keys, selectedKeys)) setSelectedKeys(keys);
        },
        disabledKeys: disabledKeysProp,
        disabledBehavior: disabledBehavior
    };
}
function $0af3d14a0ed99bae$var$convertSelection(selection, defaultValue) {
    if (!selection) return defaultValue;
    return selection === 'all' ? 'all' : new (0, $69defba172ea05d3$exports.Selection)(selection);
}


//# sourceMappingURL=useMultipleSelectionState.cjs.map
