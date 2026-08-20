import $act7j$react from "react";

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
function $d6a72f1213e17447$var$TableBody(props) {
    return null;
}
$d6a72f1213e17447$var$TableBody.getCollectionNode = function* getCollectionNode(props) {
    let { children: children, items: items } = props;
    yield {
        type: 'body',
        hasChildNodes: true,
        props: props,
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
                (0, $act7j$react).Children.forEach(children, (item)=>{
                    items.push({
                        type: 'item',
                        element: item
                    });
                });
                yield* items;
            }
        }
    };
};
/**
 * A TableBody is a container for the Row elements of a Table. Rows can be statically defined as
 * children, or generated dynamically using a function based on the data passed to the `items`
 * prop.
 */ // We don't want getCollectionNode to show up in the type definition
let $d6a72f1213e17447$export$76ccd210b9029917 = $d6a72f1213e17447$var$TableBody;


export {$d6a72f1213e17447$export$76ccd210b9029917 as TableBody};
//# sourceMappingURL=TableBody.js.map
