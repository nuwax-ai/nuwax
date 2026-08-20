var $7Zkbq$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "Section", function () { return $df46e193d1d4be29$export$6e2c8f0811a474ce; });
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function $df46e193d1d4be29$var$Section(props) {
    return null;
}
$df46e193d1d4be29$var$Section.getCollectionNode = function* getCollectionNode(props) {
    let { children: children, title: title, items: items } = props;
    yield {
        type: 'section',
        props: props,
        hasChildNodes: true,
        rendered: title,
        'aria-label': props['aria-label'],
        *childNodes () {
            if (typeof children === 'function') {
                if (!items) throw new Error('props.children was a function but props.items is missing');
                for (let item of items)yield {
                    type: 'item',
                    value: item,
                    renderer: children
                };
            } else {
                let items = [];
                (0, ($parcel$interopDefault($7Zkbq$react))).Children.forEach(children, (child)=>{
                    items.push({
                        type: 'item',
                        element: child
                    });
                });
                yield* items;
            }
        }
    };
};
// We don't want getCollectionNode to show up in the type definition
let $df46e193d1d4be29$export$6e2c8f0811a474ce = $df46e193d1d4be29$var$Section;


//# sourceMappingURL=Section.cjs.map
