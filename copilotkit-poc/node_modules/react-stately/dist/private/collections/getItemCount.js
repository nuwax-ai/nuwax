import {getChildNodes as $684db7aaf37fc901$export$1005530eda016c13} from "./getChildNodes.js";

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
const $977ee5a19ab93bfd$var$cache = new WeakMap();
function $977ee5a19ab93bfd$export$77d5aafae4e095b2(collection) {
    let count = $977ee5a19ab93bfd$var$cache.get(collection);
    if (count != null) return count;
    // TS isn't smart enough to know we've ensured count is a number, so use a new variable
    let counter = 0;
    let countItems = (items)=>{
        for (let item of items){
            if (item.type === 'section') countItems((0, $684db7aaf37fc901$export$1005530eda016c13)(item, collection));
            else if (item.type === 'item') counter++;
        }
    };
    countItems(collection);
    $977ee5a19ab93bfd$var$cache.set(collection, counter);
    return counter;
}


export {$977ee5a19ab93bfd$export$77d5aafae4e095b2 as getItemCount};
//# sourceMappingURL=getItemCount.js.map
