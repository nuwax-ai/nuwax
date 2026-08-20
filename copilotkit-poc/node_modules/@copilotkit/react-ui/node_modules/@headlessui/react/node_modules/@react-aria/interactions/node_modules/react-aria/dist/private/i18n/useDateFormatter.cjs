var $a6926d440356cac7$exports = require("../utils/useDeepMemo.cjs");
var $2522e612fa919664$exports = require("./I18nProvider.cjs");
var $7gjLO$internationalizeddate = require("@internationalized/date");
var $7gjLO$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDateFormatter", function () { return $b8ffb0adc97ab95f$export$85fd5fdf27bacc79; });
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



function $b8ffb0adc97ab95f$export$85fd5fdf27bacc79(options) {
    // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
    options = (0, $a6926d440356cac7$exports.useDeepMemo)(options ?? {}, $b8ffb0adc97ab95f$var$isEqual);
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    return (0, $7gjLO$react.useMemo)(()=>new (0, $7gjLO$internationalizeddate.DateFormatter)(locale, options), [
        locale,
        options
    ]);
}
function $b8ffb0adc97ab95f$var$isEqual(a, b) {
    if (a === b) return true;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
}


//# sourceMappingURL=useDateFormatter.cjs.map
