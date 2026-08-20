import $mLnuJ$react, {useState as $mLnuJ$useState, useRef as $mLnuJ$useRef, useEffect as $mLnuJ$useEffect, useReducer as $mLnuJ$useReducer, useCallback as $mLnuJ$useCallback} from "react";

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
var $2a35a170cf8e413e$var$_React_useInsertionEffect;
// Use the earliest effect possible to reset the ref below.
const $2a35a170cf8e413e$var$useEarlyEffect = typeof document !== 'undefined' ? ($2a35a170cf8e413e$var$_React_useInsertionEffect = (0, $mLnuJ$react)['useInsertionEffect']) !== null && $2a35a170cf8e413e$var$_React_useInsertionEffect !== void 0 ? $2a35a170cf8e413e$var$_React_useInsertionEffect : (0, $mLnuJ$react).useLayoutEffect : ()=>{};
function $2a35a170cf8e413e$export$40bfa8c7b0832715(value, defaultValue, onChange) {
    // Store the value in both state and a ref. The state value will only be used when uncontrolled.
    // The ref is used to track the most current value, which is passed to the function setState callback.
    let [stateValue, setStateValue] = (0, $mLnuJ$useState)(value || defaultValue);
    let valueRef = (0, $mLnuJ$useRef)(stateValue);
    let isControlledRef = (0, $mLnuJ$useRef)(value !== undefined);
    let isControlled = value !== undefined;
    (0, $mLnuJ$useEffect)(()=>{
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
    $2a35a170cf8e413e$var$useEarlyEffect(()=>{
        valueRef.current = currentValue;
    });
    let [, forceUpdate] = (0, $mLnuJ$useReducer)(()=>({}), {});
    let setValue = (0, $mLnuJ$useCallback)((value, ...args)=>{
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
            onChange === null || onChange === void 0 ? void 0 : onChange(newValue, ...args);
        }
    }, [
        onChange
    ]);
    return [
        currentValue,
        setValue
    ];
}


export {$2a35a170cf8e413e$export$40bfa8c7b0832715 as useControlledState};
//# sourceMappingURL=useControlledState.js.map
