import $b4RhR$intlStringsjs from "./intlStrings.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringDictionary as $1adfa757ef3cd864$export$87b761675e8eaa10} from "../i18n/useLocalizedStringFormatter.js";
import {useMemo as $b4RhR$useMemo} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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
 */ // @ts-ignore




function $d450be8b38bba6ef$export$d42c60378c8168f8() {
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let dictionary = (0, $1adfa757ef3cd864$export$87b761675e8eaa10)((0, ($parcel$interopDefault($b4RhR$intlStringsjs))), '@react-aria/datepicker');
    return (0, $b4RhR$useMemo)(()=>{
        // Try to use Intl.DisplayNames if possible. It may be supported in browsers, but not support the dateTimeField
        // type as that was only added in v2. https://github.com/tc39/intl-displaynames-v2
        try {
            return new Intl.DisplayNames(locale, {
                type: 'dateTimeField'
            });
        } catch  {
            return new $d450be8b38bba6ef$var$DisplayNamesPolyfill(locale, dictionary);
        }
    }, [
        locale,
        dictionary
    ]);
}
class $d450be8b38bba6ef$var$DisplayNamesPolyfill {
    of(field) {
        return this.dictionary.getStringForLocale(field, this.locale);
    }
    constructor(locale, dictionary){
        this.locale = locale;
        this.dictionary = dictionary;
    }
}


export {$d450be8b38bba6ef$export$d42c60378c8168f8 as useDisplayNames};
//# sourceMappingURL=useDisplayNames.js.map
