var $429333cab433657c$exports = require("./useLayoutEffect.cjs");
var $5Ri4i$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDescription", function () { return $2205bbfafbd0b5cd$export$f8aeda7b10753fa1; });
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

let $2205bbfafbd0b5cd$var$descriptionId = 0;
const $2205bbfafbd0b5cd$var$descriptionNodes = new Map();
function $2205bbfafbd0b5cd$export$f8aeda7b10753fa1(description) {
    let [id, setId] = (0, $5Ri4i$react.useState)();
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (!description) return;
        let desc = $2205bbfafbd0b5cd$var$descriptionNodes.get(description);
        if (!desc) {
            let id = `react-aria-description-${$2205bbfafbd0b5cd$var$descriptionId++}`;
            setId(id);
            let node = document.createElement('div');
            node.id = id;
            node.style.display = 'none';
            node.textContent = description;
            document.body.appendChild(node);
            desc = {
                refCount: 0,
                element: node
            };
            $2205bbfafbd0b5cd$var$descriptionNodes.set(description, desc);
        } else setId(desc.element.id);
        desc.refCount++;
        return ()=>{
            if (desc && --desc.refCount === 0) {
                desc.element.remove();
                $2205bbfafbd0b5cd$var$descriptionNodes.delete(description);
            }
        };
    }, [
        description
    ]);
    return {
        'aria-describedby': description ? id : undefined
    };
}


//# sourceMappingURL=useDescription.cjs.map
