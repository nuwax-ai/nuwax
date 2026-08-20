var $hngmi$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useControlledState", function () { return $14cedf286405cc4b$export$40bfa8c7b0832715; });
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
// Use the earliest effect possible to reset the ref below.
const $14cedf286405cc4b$var$useEarlyEffect = typeof document !== 'undefined' ? (0, ($parcel$interopDefault($hngmi$react)))['useInsertionEffect'] ?? (0, ($parcel$interopDefault($hngmi$react))).useLayoutEffect : ()=>{};
function $14cedf286405cc4b$export$40bfa8c7b0832715(value, defaultValue, onChange) {
    // Store the value in both state and a ref. The state value will only be used when uncontrolled.
    // The ref is used to track the most current value, which is passed to the function setState callback.
    let [stateValue, setStateValue] = (0, $hngmi$react.useState)(value || defaultValue);
    let valueRef = (0, $hngmi$react.useRef)(stateValue);
    let isControlledRef = (0, $hngmi$react.useRef)(value !== undefined);
    let isControlled = value !== undefined;
    (0, $hngmi$react.useEffect)(()=>{
        let wasControlled = isControlledRef.current;
        if (wasControlled !== isControlled && process.env.NODE_ENV !== 'production') console.warn(`WARN: A component changed from ${wasControlled ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}.`);
        isControlledRef.current = isControlled;
    }, [
        isControlled
    ]);
    // After each render, update the ref to the current value.
    // This ensures that the setState callback argument is reset.
    // Note: the effect should not have any dependencies so that controlled values always reset.
    let currentValue = isControlled ? value : stateValue;
    $14cedf286405cc4b$var$useEarlyEffect(()=>{
        valueRef.current = currentValue;
    });
    let [, forceUpdate] = (0, $hngmi$react.useReducer)(()=>({}), {});
    let setValue = (0, $hngmi$react.useCallback)((value, ...args)=>{
        // @ts-ignore - TS doesn't know that T cannot be a function.
        let newValue = typeof value === 'function' ? value(valueRef.current) : value;
        if (!Object.is(valueRef.current, newValue)) {
            // Update the ref so that the next setState callback has the most recent value.
            valueRef.current = newValue;
            setStateValue(newValue);
            // Always trigger a re-render, even when controlled, so that the layout effect above runs to reset the value.
            forceUpdate();
            // Trigger onChange. Note that if setState is called multiple times in a single event,
            // onChange will be called for each one instead of only once.
            onChange?.(newValue, ...args);
        }
    }, [
        onChange
    ]);
    return [
        currentValue,
        setValue
    ];
}


//# sourceMappingURL=useControlledState.cjs.map
