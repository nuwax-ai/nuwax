var $2522e612fa919664$exports = require("./I18nProvider.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCollator", function () { return $74751389dd0da9fc$export$a16aca283550c30d; });
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
let $74751389dd0da9fc$var$cache = new Map();
function $74751389dd0da9fc$export$a16aca283550c30d(options) {
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let cacheKey = locale + (options ? Object.entries(options).sort((a, b)=>a[0] < b[0] ? -1 : 1).join() : '');
    if ($74751389dd0da9fc$var$cache.has(cacheKey)) return $74751389dd0da9fc$var$cache.get(cacheKey);
    let formatter = new Intl.Collator(locale, options);
    $74751389dd0da9fc$var$cache.set(cacheKey, formatter);
    return formatter;
}


//# sourceMappingURL=useCollator.cjs.map
