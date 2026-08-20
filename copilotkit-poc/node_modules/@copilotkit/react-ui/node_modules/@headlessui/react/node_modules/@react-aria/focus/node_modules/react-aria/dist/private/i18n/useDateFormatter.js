import {useDeepMemo as $c94834a103455fff$export$722debc0e56fea39} from "../utils/useDeepMemo.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "./I18nProvider.js";
import {DateFormatter as $48i1t$DateFormatter} from "@internationalized/date";
import {useMemo as $48i1t$useMemo} from "react";

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



function $7673fcc607ba3f7f$export$85fd5fdf27bacc79(options) {
    // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
    options = (0, $c94834a103455fff$export$722debc0e56fea39)(options !== null && options !== void 0 ? options : {}, $7673fcc607ba3f7f$var$isEqual);
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    return (0, $48i1t$useMemo)(()=>new (0, $48i1t$DateFormatter)(locale, options), [
        locale,
        options
    ]);
}
function $7673fcc607ba3f7f$var$isEqual(a, b) {
    if (a === b) return true;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
}


export {$7673fcc607ba3f7f$export$85fd5fdf27bacc79 as useDateFormatter};
//# sourceMappingURL=useDateFormatter.js.map
