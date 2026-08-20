var $45851fded752e83c$exports = require("./intlStrings.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $1saYV$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDisplayNames", function () { return $8c5a06cee2b48b29$export$d42c60378c8168f8; });
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




function $8c5a06cee2b48b29$export$d42c60378c8168f8() {
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let dictionary = (0, $d4e8e26182baab6e$exports.useLocalizedStringDictionary)((0, ($parcel$interopDefault($45851fded752e83c$exports))), '@react-aria/datepicker');
    return (0, $1saYV$react.useMemo)(()=>{
        // Try to use Intl.DisplayNames if possible. It may be supported in browsers, but not support the dateTimeField
        // type as that was only added in v2. https://github.com/tc39/intl-displaynames-v2
        try {
            return new Intl.DisplayNames(locale, {
                type: 'dateTimeField'
            });
        } catch  {
            return new $8c5a06cee2b48b29$var$DisplayNamesPolyfill(locale, dictionary);
        }
    }, [
        locale,
        dictionary
    ]);
}
class $8c5a06cee2b48b29$var$DisplayNamesPolyfill {
    constructor(locale, dictionary){
        this.locale = locale;
        this.dictionary = dictionary;
    }
    of(field) {
        return this.dictionary.getStringForLocale(field, this.locale);
    }
}


//# sourceMappingURL=useDisplayNames.cjs.map
