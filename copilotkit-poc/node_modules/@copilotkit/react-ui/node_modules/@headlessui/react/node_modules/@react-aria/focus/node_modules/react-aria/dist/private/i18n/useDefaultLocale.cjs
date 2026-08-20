var $064e661d2887db24$exports = require("./utils.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $haE9X$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDefaultLocale", function () { return $7b6ccbcacbe7a85c$export$188ec29ebc2bdc3a; });
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


// Locale passed from server by PackageLocalizationProvider.
const $7b6ccbcacbe7a85c$var$localeSymbol = Symbol.for('react-aria.i18n.locale');
function $7b6ccbcacbe7a85c$export$f09106e7c6677ec5() {
    let locale = typeof window !== 'undefined' && window[$7b6ccbcacbe7a85c$var$localeSymbol] || // @ts-ignore
    typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage) || 'en-US';
    try {
        Intl.DateTimeFormat.supportedLocalesOf([
            locale
        ]);
    } catch  {
        locale = 'en-US';
    }
    return {
        locale: locale,
        direction: (0, $064e661d2887db24$exports.isRTL)(locale) ? 'rtl' : 'ltr'
    };
}
let $7b6ccbcacbe7a85c$var$currentLocale = $7b6ccbcacbe7a85c$export$f09106e7c6677ec5();
let $7b6ccbcacbe7a85c$var$listeners = new Set();
function $7b6ccbcacbe7a85c$var$updateLocale() {
    $7b6ccbcacbe7a85c$var$currentLocale = $7b6ccbcacbe7a85c$export$f09106e7c6677ec5();
    for (let listener of $7b6ccbcacbe7a85c$var$listeners)listener($7b6ccbcacbe7a85c$var$currentLocale);
}
function $7b6ccbcacbe7a85c$export$188ec29ebc2bdc3a() {
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let [defaultLocale, setDefaultLocale] = (0, $haE9X$react.useState)($7b6ccbcacbe7a85c$var$currentLocale);
    (0, $haE9X$react.useEffect)(()=>{
        if ($7b6ccbcacbe7a85c$var$listeners.size === 0) window.addEventListener('languagechange', $7b6ccbcacbe7a85c$var$updateLocale);
        $7b6ccbcacbe7a85c$var$listeners.add(setDefaultLocale);
        return ()=>{
            $7b6ccbcacbe7a85c$var$listeners.delete(setDefaultLocale);
            if ($7b6ccbcacbe7a85c$var$listeners.size === 0) window.removeEventListener('languagechange', $7b6ccbcacbe7a85c$var$updateLocale);
        };
    }, []);
    // We cannot determine the browser's language on the server, so default to
    // en-US. This will be updated after hydration on the client to the correct value.
    if (isSSR) {
        let locale = typeof window !== 'undefined' && window[$7b6ccbcacbe7a85c$var$localeSymbol];
        return {
            locale: locale || 'en-US',
            direction: 'ltr'
        };
    }
    return defaultLocale;
}


//# sourceMappingURL=useDefaultLocale.cjs.map
