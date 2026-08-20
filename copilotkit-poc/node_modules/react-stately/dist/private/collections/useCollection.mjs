import {CollectionBuilder as $bda7a7e55e1ff206$export$bf788dd355e3a401} from "./CollectionBuilder.mjs";
import {useMemo as $emYU7$useMemo} from "react";

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

function $d03379b88399b8c5$export$6cd28814d92fa9c9(props, factory, context) {
    let builder = (0, $emYU7$useMemo)(()=>new (0, $bda7a7e55e1ff206$export$bf788dd355e3a401)(), []);
    let { children: children, items: items, collection: collection } = props;
    let result = (0, $emYU7$useMemo)(()=>{
        if (collection) return collection;
        let nodes = builder.build({
            children: children,
            items: items
        }, context);
        return factory(nodes);
    }, [
        builder,
        children,
        items,
        collection,
        context,
        factory
    ]);
    return result;
}


export {$d03379b88399b8c5$export$6cd28814d92fa9c9 as useCollection};
//# sourceMappingURL=useCollection.mjs.map
