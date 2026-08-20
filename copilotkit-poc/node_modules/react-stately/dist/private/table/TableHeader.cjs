var $kf4zH$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "TableHeader", function () { return $2dad2b3097abe782$export$f850895b287ef28e; });
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
function $2dad2b3097abe782$var$TableHeader(props) {
    return null;
}
$2dad2b3097abe782$var$TableHeader.getCollectionNode = function* getCollectionNode(props, context) {
    let { children: children, columns: columns } = props;
    // Clear columns so they aren't double added in strict mode.
    context.columns = [];
    if (typeof children === 'function') {
        if (!columns) throw new Error('props.children was a function but props.columns is missing');
        for (let column of columns)yield {
            type: 'column',
            value: column,
            renderer: children
        };
    } else {
        let columns = [];
        (0, ($parcel$interopDefault($kf4zH$react))).Children.forEach(children, (column)=>{
            columns.push({
                type: 'column',
                element: column
            });
        });
        yield* columns;
    }
};
/**
 * A TableHeader is a container for the Column elements in a Table. Columns can be statically
 * defined as children, or generated dynamically using a function based on the data passed to the
 * `columns` prop.
 */ // We don't want getCollectionNode to show up in the type definition
let $2dad2b3097abe782$export$f850895b287ef28e = $2dad2b3097abe782$var$TableHeader;


//# sourceMappingURL=TableHeader.cjs.map
