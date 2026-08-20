import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "./I18nProvider.mjs";
import {LocalizedStringDictionary as $hwcjY$LocalizedStringDictionary, LocalizedStringFormatter as $hwcjY$LocalizedStringFormatter} from "@internationalized/string";
import {useMemo as $hwcjY$useMemo} from "react";

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


const $cf2482eff2eeeec2$var$cache = new WeakMap();
function $cf2482eff2eeeec2$var$getCachedDictionary(strings) {
    let dictionary = $cf2482eff2eeeec2$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $hwcjY$LocalizedStringDictionary)(strings);
        $cf2482eff2eeeec2$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $cf2482eff2eeeec2$export$87b761675e8eaa10(strings, packageName) {
    return packageName && (0, $hwcjY$LocalizedStringDictionary).getGlobalDictionaryForPackage(packageName) || $cf2482eff2eeeec2$var$getCachedDictionary(strings);
}
function $cf2482eff2eeeec2$export$f12b703ca79dfbb1(strings, packageName) {
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let dictionary = $cf2482eff2eeeec2$export$87b761675e8eaa10(strings, packageName);
    return (0, $hwcjY$useMemo)(()=>new (0, $hwcjY$LocalizedStringFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
}


export {$cf2482eff2eeeec2$export$87b761675e8eaa10 as useLocalizedStringDictionary, $cf2482eff2eeeec2$export$f12b703ca79dfbb1 as useLocalizedStringFormatter};
//# sourceMappingURL=useLocalizedStringFormatter.mjs.map
