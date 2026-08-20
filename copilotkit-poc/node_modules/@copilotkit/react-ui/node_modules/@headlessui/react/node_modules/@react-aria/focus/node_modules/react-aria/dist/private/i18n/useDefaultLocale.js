import {isRTL as $80de4f1e59ad92d4$export$702d680b21cbd764} from "./utils.js";
import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {useState as $2t0yL$useState, useEffect as $2t0yL$useEffect} from "react";

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
const $7c8c20f0715e2860$var$localeSymbol = Symbol.for('react-aria.i18n.locale');
function $7c8c20f0715e2860$export$f09106e7c6677ec5() {
    let locale = typeof window !== 'undefined' && window[$7c8c20f0715e2860$var$localeSymbol] || // @ts-ignore
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
        direction: (0, $80de4f1e59ad92d4$export$702d680b21cbd764)(locale) ? 'rtl' : 'ltr'
    };
}
let $7c8c20f0715e2860$var$currentLocale = $7c8c20f0715e2860$export$f09106e7c6677ec5();
let $7c8c20f0715e2860$var$listeners = new Set();
function $7c8c20f0715e2860$var$updateLocale() {
    $7c8c20f0715e2860$var$currentLocale = $7c8c20f0715e2860$export$f09106e7c6677ec5();
    for (let listener of $7c8c20f0715e2860$var$listeners)listener($7c8c20f0715e2860$var$currentLocale);
}
function $7c8c20f0715e2860$export$188ec29ebc2bdc3a() {
    let isSSR = (0, $85138adc03e1f057$export$535bd6ca7f90a273)();
    let [defaultLocale, setDefaultLocale] = (0, $2t0yL$useState)($7c8c20f0715e2860$var$currentLocale);
    (0, $2t0yL$useEffect)(()=>{
        if ($7c8c20f0715e2860$var$listeners.size === 0) window.addEventListener('languagechange', $7c8c20f0715e2860$var$updateLocale);
        $7c8c20f0715e2860$var$listeners.add(setDefaultLocale);
        return ()=>{
            $7c8c20f0715e2860$var$listeners.delete(setDefaultLocale);
            if ($7c8c20f0715e2860$var$listeners.size === 0) window.removeEventListener('languagechange', $7c8c20f0715e2860$var$updateLocale);
        };
    }, []);
    // We cannot determine the browser's language on the server, so default to
    // en-US. This will be updated after hydration on the client to the correct value.
    if (isSSR) {
        let locale = typeof window !== 'undefined' && window[$7c8c20f0715e2860$var$localeSymbol];
        return {
            locale: locale || 'en-US',
            direction: 'ltr'
        };
    }
    return defaultLocale;
}


export {$7c8c20f0715e2860$export$f09106e7c6677ec5 as getDefaultLocale, $7c8c20f0715e2860$export$188ec29ebc2bdc3a as useDefaultLocale};
//# sourceMappingURL=useDefaultLocale.js.map
