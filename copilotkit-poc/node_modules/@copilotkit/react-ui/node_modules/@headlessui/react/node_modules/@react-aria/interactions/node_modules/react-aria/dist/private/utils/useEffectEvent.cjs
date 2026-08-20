var $429333cab433657c$exports = require("./useLayoutEffect.cjs");
var $ei5ot$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useEffectEvent", function () { return $d6e22460ce4d6b26$export$7f54fc3180508a52; });
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

// Use the earliest effect type possible. useInsertionEffect runs during the mutation phase,
// before all layout effects, but is available only in React 18 and later.
const $d6e22460ce4d6b26$var$useEarlyEffect = (0, ($parcel$interopDefault($ei5ot$react)))['useInsertionEffect'] ?? (0, $429333cab433657c$exports.useLayoutEffect);
function $d6e22460ce4d6b26$export$7f54fc3180508a52(fn) {
    const ref = (0, $ei5ot$react.useRef)(null);
    $d6e22460ce4d6b26$var$useEarlyEffect(()=>{
        ref.current = fn;
    }, [
        fn
    ]);
    // @ts-ignore
    return (0, $ei5ot$react.useCallback)((...args)=>{
        const f = ref.current;
        return f?.(...args);
    }, []);
}


//# sourceMappingURL=useEffectEvent.cjs.map
