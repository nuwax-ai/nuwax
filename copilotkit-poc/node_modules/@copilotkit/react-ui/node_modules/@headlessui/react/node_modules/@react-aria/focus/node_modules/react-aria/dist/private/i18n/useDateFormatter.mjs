import {useDeepMemo as $9c268ab73a5d55e5$export$722debc0e56fea39} from "../utils/useDeepMemo.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "./I18nProvider.mjs";
import {DateFormatter as $guoDu$DateFormatter} from "@internationalized/date";
import {useMemo as $guoDu$useMemo} from "react";

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



function $60f33508b4cd9d3b$export$85fd5fdf27bacc79(options) {
    // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
    options = (0, $9c268ab73a5d55e5$export$722debc0e56fea39)(options ?? {}, $60f33508b4cd9d3b$var$isEqual);
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    return (0, $guoDu$useMemo)(()=>new (0, $guoDu$DateFormatter)(locale, options), [
        locale,
        options
    ]);
}
function $60f33508b4cd9d3b$var$isEqual(a, b) {
    if (a === b) return true;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
}


export {$60f33508b4cd9d3b$export$85fd5fdf27bacc79 as useDateFormatter};
//# sourceMappingURL=useDateFormatter.mjs.map
