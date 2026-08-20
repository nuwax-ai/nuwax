import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "./I18nProvider.js";
import {LocalizedStringDictionary as $bPD3J$LocalizedStringDictionary, LocalizedStringFormatter as $bPD3J$LocalizedStringFormatter} from "@internationalized/string";
import {useMemo as $bPD3J$useMemo} from "react";

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


const $1adfa757ef3cd864$var$cache = new WeakMap();
function $1adfa757ef3cd864$var$getCachedDictionary(strings) {
    let dictionary = $1adfa757ef3cd864$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $bPD3J$LocalizedStringDictionary)(strings);
        $1adfa757ef3cd864$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $1adfa757ef3cd864$export$87b761675e8eaa10(strings, packageName) {
    return packageName && (0, $bPD3J$LocalizedStringDictionary).getGlobalDictionaryForPackage(packageName) || $1adfa757ef3cd864$var$getCachedDictionary(strings);
}
function $1adfa757ef3cd864$export$f12b703ca79dfbb1(strings, packageName) {
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let dictionary = $1adfa757ef3cd864$export$87b761675e8eaa10(strings, packageName);
    return (0, $bPD3J$useMemo)(()=>new (0, $bPD3J$LocalizedStringFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
}


export {$1adfa757ef3cd864$export$87b761675e8eaa10 as useLocalizedStringDictionary, $1adfa757ef3cd864$export$f12b703ca79dfbb1 as useLocalizedStringFormatter};
//# sourceMappingURL=useLocalizedStringFormatter.js.map
