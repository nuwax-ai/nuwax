import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "./I18nProvider.mjs";

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
let $673d46fce3e5717d$var$cache = new Map();
function $673d46fce3e5717d$export$a16aca283550c30d(options) {
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let cacheKey = locale + (options ? Object.entries(options).sort((a, b)=>a[0] < b[0] ? -1 : 1).join() : '');
    if ($673d46fce3e5717d$var$cache.has(cacheKey)) return $673d46fce3e5717d$var$cache.get(cacheKey);
    let formatter = new Intl.Collator(locale, options);
    $673d46fce3e5717d$var$cache.set(cacheKey, formatter);
    return formatter;
}


export {$673d46fce3e5717d$export$a16aca283550c30d as useCollator};
//# sourceMappingURL=useCollator.mjs.map
