import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "./useLayoutEffect.js";
import {useSSRSafeId as $85138adc03e1f057$export$619500959fc48b26} from "../ssr/SSRProvider.js";
import {useValueEffect as $f3fce08f58563bfe$export$14d238f342723f25} from "./useValueEffect.js";
import {useState as $etu62$useState, useRef as $etu62$useRef, useEffect as $etu62$useEffect, useCallback as $etu62$useCallback} from "react";

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



// copied from SSRProvider.tsx to reduce exports, if needed again, consider sharing
let $0292efe68908de6b$var$canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
let $0292efe68908de6b$export$d41a04c74483c6ef = new Map();
// This allows us to clean up the idsUpdaterMap when the id is no longer used.
// Map is a strong reference, so unused ids wouldn't be cleaned up otherwise.
// This can happen in suspended components where mount/unmount is not called.
let $0292efe68908de6b$var$registry;
if (typeof FinalizationRegistry !== 'undefined') $0292efe68908de6b$var$registry = new FinalizationRegistry((heldValue)=>{
    $0292efe68908de6b$export$d41a04c74483c6ef.delete(heldValue);
});
function $0292efe68908de6b$export$f680877a34711e37(defaultId) {
    let [value, setValue] = (0, $etu62$useState)(defaultId);
    let nextId = (0, $etu62$useRef)(null);
    let res = (0, $85138adc03e1f057$export$619500959fc48b26)(value);
    let cleanupRef = (0, $etu62$useRef)(null);
    if ($0292efe68908de6b$var$registry) $0292efe68908de6b$var$registry.register(cleanupRef, res);
    if ($0292efe68908de6b$var$canUseDOM) {
        const cacheIdRef = $0292efe68908de6b$export$d41a04c74483c6ef.get(res);
        if (cacheIdRef && !cacheIdRef.includes(nextId)) cacheIdRef.push(nextId);
        else $0292efe68908de6b$export$d41a04c74483c6ef.set(res, [
            nextId
        ]);
    }
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        let r = res;
        return ()=>{
            // In Suspense, the cleanup function may be not called
            // when it is though, also remove it from the finalization registry.
            if ($0292efe68908de6b$var$registry) $0292efe68908de6b$var$registry.unregister(cleanupRef);
            $0292efe68908de6b$export$d41a04c74483c6ef.delete(r);
        };
    }, [
        res
    ]);
    // This cannot cause an infinite loop because the ref is always cleaned up.
    // eslint-disable-next-line
    (0, $etu62$useEffect)(()=>{
        let newId = nextId.current;
        if (newId) setValue(newId);
        return ()=>{
            if (newId) nextId.current = null;
        };
    });
    return res;
}
function $0292efe68908de6b$export$cd8c9cb68f842629(idA, idB) {
    if (idA === idB) return idA;
    let setIdsA = $0292efe68908de6b$export$d41a04c74483c6ef.get(idA);
    if (setIdsA) {
        setIdsA.forEach((ref)=>ref.current = idB);
        return idB;
    }
    let setIdsB = $0292efe68908de6b$export$d41a04c74483c6ef.get(idB);
    if (setIdsB) {
        setIdsB.forEach((ref)=>ref.current = idA);
        return idA;
    }
    return idB;
}
function $0292efe68908de6b$export$b4cc09c592e8fdb8(depArray = []) {
    let id = $0292efe68908de6b$export$f680877a34711e37();
    let [resolvedId, setResolvedId] = (0, $f3fce08f58563bfe$export$14d238f342723f25)(id);
    let updateId = (0, $etu62$useCallback)(()=>{
        setResolvedId(function*() {
            yield id;
            yield document.getElementById(id) ? id : undefined;
        });
    }, [
        id,
        setResolvedId
    ]);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(updateId, [
        id,
        updateId,
        ...depArray
    ]);
    return resolvedId;
}


export {$0292efe68908de6b$export$d41a04c74483c6ef as idsUpdaterMap, $0292efe68908de6b$export$f680877a34711e37 as useId, $0292efe68908de6b$export$cd8c9cb68f842629 as mergeIds, $0292efe68908de6b$export$b4cc09c592e8fdb8 as useSlotId};
//# sourceMappingURL=useId.js.map
