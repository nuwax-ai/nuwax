var $d6e22460ce4d6b26$exports = require("./useEffectEvent.cjs");
var $bOpmd$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useUpdateEffect", function () { return $c4703f4a6fffa1e7$export$496315a1608d9602; });
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

function $c4703f4a6fffa1e7$export$496315a1608d9602(cb, dependencies) {
    const isInitialMount = (0, $bOpmd$react.useRef)(true);
    const lastDeps = (0, $bOpmd$react.useRef)(null);
    let cbEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(cb);
    (0, $bOpmd$react.useEffect)(()=>{
        isInitialMount.current = true;
        return ()=>{
            isInitialMount.current = false;
        };
    }, []);
    (0, $bOpmd$react.useEffect)(()=>{
        let prevDeps = lastDeps.current;
        if (isInitialMount.current) isInitialMount.current = false;
        else if (!prevDeps || dependencies.some((dep, i)=>!Object.is(dep, prevDeps[i]))) cbEvent();
        lastDeps.current = dependencies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}


//# sourceMappingURL=useUpdateEffect.cjs.map
