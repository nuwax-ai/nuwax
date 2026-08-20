import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "./useLayoutEffect.js";
import {useState as $3FiqG$useState} from "react";

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

let $fe0741815591a8ca$var$descriptionId = 0;
const $fe0741815591a8ca$var$descriptionNodes = new Map();
function $fe0741815591a8ca$export$f8aeda7b10753fa1(description) {
    let [id, setId] = (0, $3FiqG$useState)();
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (!description) return;
        let desc = $fe0741815591a8ca$var$descriptionNodes.get(description);
        if (!desc) {
            let id = `react-aria-description-${$fe0741815591a8ca$var$descriptionId++}`;
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
            $fe0741815591a8ca$var$descriptionNodes.set(description, desc);
        } else setId(desc.element.id);
        desc.refCount++;
        return ()=>{
            if (desc && --desc.refCount === 0) {
                desc.element.remove();
                $fe0741815591a8ca$var$descriptionNodes.delete(description);
            }
        };
    }, [
        description
    ]);
    return {
        'aria-describedby': description ? id : undefined
    };
}


export {$fe0741815591a8ca$export$f8aeda7b10753fa1 as useDescription};
//# sourceMappingURL=useDescription.js.map
