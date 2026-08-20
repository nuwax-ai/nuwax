import $5vIuz$intlStringsmjs from "./intlStrings.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringDictionary as $cf2482eff2eeeec2$export$87b761675e8eaa10} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMemo as $5vIuz$useMemo} from "react";


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




function $40cf8faa4dad0740$export$d42c60378c8168f8() {
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let dictionary = (0, $cf2482eff2eeeec2$export$87b761675e8eaa10)((0, ($parcel$interopDefault($5vIuz$intlStringsmjs))), '@react-aria/datepicker');
    return (0, $5vIuz$useMemo)(()=>{
        // Try to use Intl.DisplayNames if possible. It may be supported in browsers, but not support the dateTimeField
        // type as that was only added in v2. https://github.com/tc39/intl-displaynames-v2
        try {
            return new Intl.DisplayNames(locale, {
                type: 'dateTimeField'
            });
        } catch  {
            return new $40cf8faa4dad0740$var$DisplayNamesPolyfill(locale, dictionary);
        }
    }, [
        locale,
        dictionary
    ]);
}
class $40cf8faa4dad0740$var$DisplayNamesPolyfill {
    constructor(locale, dictionary){
        this.locale = locale;
        this.dictionary = dictionary;
    }
    of(field) {
        return this.dictionary.getStringForLocale(field, this.locale);
    }
}


export {$40cf8faa4dad0740$export$d42c60378c8168f8 as useDisplayNames};
//# sourceMappingURL=useDisplayNames.mjs.map
