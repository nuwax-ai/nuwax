var $429333cab433657c$exports = require("./useLayoutEffect.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $c3bc93049362f211$exports = require("./useValueEffect.cjs");
var $4w5Si$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useId", function () { return $7ac82d1fee77eb8a$export$f680877a34711e37; });
$parcel$export(module.exports, "mergeIds", function () { return $7ac82d1fee77eb8a$export$cd8c9cb68f842629; });
$parcel$export(module.exports, "useSlotId", function () { return $7ac82d1fee77eb8a$export$b4cc09c592e8fdb8; });
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
let $7ac82d1fee77eb8a$var$canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
let $7ac82d1fee77eb8a$export$d41a04c74483c6ef = new Map();
// This allows us to clean up the idsUpdaterMap when the id is no longer used.
// Map is a strong reference, so unused ids wouldn't be cleaned up otherwise.
// This can happen in suspended components where mount/unmount is not called.
let $7ac82d1fee77eb8a$var$registry;
if (typeof FinalizationRegistry !== 'undefined') $7ac82d1fee77eb8a$var$registry = new FinalizationRegistry((heldValue)=>{
    $7ac82d1fee77eb8a$export$d41a04c74483c6ef.delete(heldValue);
});
function $7ac82d1fee77eb8a$export$f680877a34711e37(defaultId) {
    let [value, setValue] = (0, $4w5Si$react.useState)(defaultId);
    let nextId = (0, $4w5Si$react.useRef)(null);
    let res = (0, $25c7fefe1bb8073e$exports.useSSRSafeId)(value);
    let cleanupRef = (0, $4w5Si$react.useRef)(null);
    if ($7ac82d1fee77eb8a$var$registry) $7ac82d1fee77eb8a$var$registry.register(cleanupRef, res);
    if ($7ac82d1fee77eb8a$var$canUseDOM) {
        const cacheIdRef = $7ac82d1fee77eb8a$export$d41a04c74483c6ef.get(res);
        if (cacheIdRef && !cacheIdRef.includes(nextId)) cacheIdRef.push(nextId);
        else $7ac82d1fee77eb8a$export$d41a04c74483c6ef.set(res, [
            nextId
        ]);
    }
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        let r = res;
        return ()=>{
            // In Suspense, the cleanup function may be not called
            // when it is though, also remove it from the finalization registry.
            if ($7ac82d1fee77eb8a$var$registry) $7ac82d1fee77eb8a$var$registry.unregister(cleanupRef);
            $7ac82d1fee77eb8a$export$d41a04c74483c6ef.delete(r);
        };
    }, [
        res
    ]);
    // This cannot cause an infinite loop because the ref is always cleaned up.
    // eslint-disable-next-line
    (0, $4w5Si$react.useEffect)(()=>{
        let newId = nextId.current;
        if (newId) setValue(newId);
        return ()=>{
            if (newId) nextId.current = null;
        };
    });
    return res;
}
function $7ac82d1fee77eb8a$export$cd8c9cb68f842629(idA, idB) {
    if (idA === idB) return idA;
    let setIdsA = $7ac82d1fee77eb8a$export$d41a04c74483c6ef.get(idA);
    if (setIdsA) {
        setIdsA.forEach((ref)=>ref.current = idB);
        return idB;
    }
    let setIdsB = $7ac82d1fee77eb8a$export$d41a04c74483c6ef.get(idB);
    if (setIdsB) {
        setIdsB.forEach((ref)=>ref.current = idA);
        return idA;
    }
    return idB;
}
function $7ac82d1fee77eb8a$export$b4cc09c592e8fdb8(depArray = []) {
    let id = $7ac82d1fee77eb8a$export$f680877a34711e37();
    let [resolvedId, setResolvedId] = (0, $c3bc93049362f211$exports.useValueEffect)(id);
    let updateId = (0, $4w5Si$react.useCallback)(()=>{
        setResolvedId(function*() {
            yield id;
            yield document.getElementById(id) ? id : undefined;
        });
    }, [
        id,
        setResolvedId
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(updateId, [
        id,
        updateId,
        ...depArray
    ]);
    return resolvedId;
}


//# sourceMappingURL=useId.cjs.map
