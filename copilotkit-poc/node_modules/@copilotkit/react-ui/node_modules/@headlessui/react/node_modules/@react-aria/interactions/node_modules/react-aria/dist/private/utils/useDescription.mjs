import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "./useLayoutEffect.mjs";
import {useState as $4UXHm$useState} from "react";

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

let $121970af65029459$var$descriptionId = 0;
const $121970af65029459$var$descriptionNodes = new Map();
function $121970af65029459$export$f8aeda7b10753fa1(description) {
    let [id, setId] = (0, $4UXHm$useState)();
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (!description) return;
        let desc = $121970af65029459$var$descriptionNodes.get(description);
        if (!desc) {
            let id = `react-aria-description-${$121970af65029459$var$descriptionId++}`;
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
            $121970af65029459$var$descriptionNodes.set(description, desc);
        } else setId(desc.element.id);
        desc.refCount++;
        return ()=>{
            if (desc && --desc.refCount === 0) {
                desc.element.remove();
                $121970af65029459$var$descriptionNodes.delete(description);
            }
        };
    }, [
        description
    ]);
    return {
        'aria-describedby': description ? id : undefined
    };
}


export {$121970af65029459$export$f8aeda7b10753fa1 as useDescription};
//# sourceMappingURL=useDescription.mjs.map
