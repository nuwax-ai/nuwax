var $d6e22460ce4d6b26$exports = require("./useEffectEvent.cjs");
var $iuD9A$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useEvent", function () { return $6e76e65001bbcda2$export$90fc3a17d93f704c; });
/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $6e76e65001bbcda2$export$90fc3a17d93f704c(ref, event, handler, options) {
    let handleEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(handler);
    let isDisabled = handler == null;
    (0, $iuD9A$react.useEffect)(()=>{
        if (isDisabled || !ref.current) return;
        let element = ref.current;
        element.addEventListener(event, handleEvent, options);
        return ()=>{
            element.removeEventListener(event, handleEvent, options);
        };
    }, [
        ref,
        event,
        options,
        isDisabled
    ]);
}


//# sourceMappingURL=useEvent.cjs.map
