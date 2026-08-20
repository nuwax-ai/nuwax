var $2522e612fa919664$exports = require("./I18nProvider.cjs");
var $b2Y1V$internationalizedstring = require("@internationalized/string");
var $b2Y1V$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLocalizedStringDictionary", function () { return $d4e8e26182baab6e$export$87b761675e8eaa10; });
$parcel$export(module.exports, "useLocalizedStringFormatter", function () { return $d4e8e26182baab6e$export$f12b703ca79dfbb1; });
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


const $d4e8e26182baab6e$var$cache = new WeakMap();
function $d4e8e26182baab6e$var$getCachedDictionary(strings) {
    let dictionary = $d4e8e26182baab6e$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $b2Y1V$internationalizedstring.LocalizedStringDictionary)(strings);
        $d4e8e26182baab6e$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $d4e8e26182baab6e$export$87b761675e8eaa10(strings, packageName) {
    return packageName && (0, $b2Y1V$internationalizedstring.LocalizedStringDictionary).getGlobalDictionaryForPackage(packageName) || $d4e8e26182baab6e$var$getCachedDictionary(strings);
}
function $d4e8e26182baab6e$export$f12b703ca79dfbb1(strings, packageName) {
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let dictionary = $d4e8e26182baab6e$export$87b761675e8eaa10(strings, packageName);
    return (0, $b2Y1V$react.useMemo)(()=>new (0, $b2Y1V$internationalizedstring.LocalizedStringFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
}


//# sourceMappingURL=useLocalizedStringFormatter.cjs.map
