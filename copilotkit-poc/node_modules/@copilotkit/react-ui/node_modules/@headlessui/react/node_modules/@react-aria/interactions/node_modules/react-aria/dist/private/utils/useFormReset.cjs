var $d6e22460ce4d6b26$exports = require("./useEffectEvent.cjs");
var $7gbnA$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useFormReset", function () { return $bbab3903416f8d01$export$5add1d006293d136; });
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

function $bbab3903416f8d01$export$5add1d006293d136(ref, initialValue, onReset) {
    let handleReset = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (onReset && !e.defaultPrevented) onReset(initialValue);
    });
    (0, $7gbnA$react.useEffect)(()=>{
        let form = ref?.current?.form;
        form?.addEventListener('reset', handleReset);
        return ()=>{
            form?.removeEventListener('reset', handleReset);
        };
    }, [
        ref
    ]);
}


//# sourceMappingURL=useFormReset.cjs.map
