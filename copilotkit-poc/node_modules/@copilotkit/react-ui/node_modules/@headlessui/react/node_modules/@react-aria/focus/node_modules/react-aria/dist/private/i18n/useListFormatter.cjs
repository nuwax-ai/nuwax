var $2522e612fa919664$exports = require("./I18nProvider.cjs");
var $pk03p$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useListFormatter", function () { return $fca92d46bac19491$export$a2f47a3d2973640; });
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

function $fca92d46bac19491$export$a2f47a3d2973640(options = {}) {
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    return (0, $pk03p$react.useMemo)(()=>new Intl.ListFormat(locale, options), [
        locale,
        options
    ]);
}


//# sourceMappingURL=useListFormatter.cjs.map
