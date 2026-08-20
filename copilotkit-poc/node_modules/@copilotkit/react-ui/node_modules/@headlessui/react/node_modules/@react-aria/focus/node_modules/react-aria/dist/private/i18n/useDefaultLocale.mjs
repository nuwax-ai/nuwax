import {isRTL as $d805ff57cab8bee2$export$702d680b21cbd764} from "./utils.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {useState as $lEF9U$useState, useEffect as $lEF9U$useEffect} from "react";

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
const $520a025cdb0d710d$var$localeSymbol = Symbol.for('react-aria.i18n.locale');
function $520a025cdb0d710d$export$f09106e7c6677ec5() {
    let locale = typeof window !== 'undefined' && window[$520a025cdb0d710d$var$localeSymbol] || // @ts-ignore
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
        direction: (0, $d805ff57cab8bee2$export$702d680b21cbd764)(locale) ? 'rtl' : 'ltr'
    };
}
let $520a025cdb0d710d$var$currentLocale = $520a025cdb0d710d$export$f09106e7c6677ec5();
let $520a025cdb0d710d$var$listeners = new Set();
function $520a025cdb0d710d$var$updateLocale() {
    $520a025cdb0d710d$var$currentLocale = $520a025cdb0d710d$export$f09106e7c6677ec5();
    for (let listener of $520a025cdb0d710d$var$listeners)listener($520a025cdb0d710d$var$currentLocale);
}
function $520a025cdb0d710d$export$188ec29ebc2bdc3a() {
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let [defaultLocale, setDefaultLocale] = (0, $lEF9U$useState)($520a025cdb0d710d$var$currentLocale);
    (0, $lEF9U$useEffect)(()=>{
        if ($520a025cdb0d710d$var$listeners.size === 0) window.addEventListener('languagechange', $520a025cdb0d710d$var$updateLocale);
        $520a025cdb0d710d$var$listeners.add(setDefaultLocale);
        return ()=>{
            $520a025cdb0d710d$var$listeners.delete(setDefaultLocale);
            if ($520a025cdb0d710d$var$listeners.size === 0) window.removeEventListener('languagechange', $520a025cdb0d710d$var$updateLocale);
        };
    }, []);
    // We cannot determine the browser's language on the server, so default to
    // en-US. This will be updated after hydration on the client to the correct value.
    if (isSSR) {
        let locale = typeof window !== 'undefined' && window[$520a025cdb0d710d$var$localeSymbol];
        return {
            locale: locale || 'en-US',
            direction: 'ltr'
        };
    }
    return defaultLocale;
}


export {$520a025cdb0d710d$export$f09106e7c6677ec5 as getDefaultLocale, $520a025cdb0d710d$export$188ec29ebc2bdc3a as useDefaultLocale};
//# sourceMappingURL=useDefaultLocale.mjs.map
