import {isRTL as $d805ff57cab8bee2$export$702d680b21cbd764} from "./utils.mjs";
import {useDefaultLocale as $520a025cdb0d710d$export$188ec29ebc2bdc3a} from "./useDefaultLocale.mjs";
import $01Dwp$react, {useContext as $01Dwp$useContext} from "react";

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


const $2eb8e6d23f3d0cb0$var$I18nContext = /*#__PURE__*/ (0, $01Dwp$react).createContext(null);
/**
 * Internal component that handles the case when locale is provided.
 */ function $2eb8e6d23f3d0cb0$var$I18nProviderWithLocale(props) {
    let { locale: locale, children: children } = props;
    let value = (0, $01Dwp$react).useMemo(()=>({
            locale: locale,
            direction: (0, $d805ff57cab8bee2$export$702d680b21cbd764)(locale) ? 'rtl' : 'ltr'
        }), [
        locale
    ]);
    return /*#__PURE__*/ (0, $01Dwp$react).createElement($2eb8e6d23f3d0cb0$var$I18nContext.Provider, {
        value: value
    }, children);
}
/**
 * Internal component that handles the case when no locale is provided.
 */ function $2eb8e6d23f3d0cb0$var$I18nProviderWithDefaultLocale(props) {
    let { children: children } = props;
    let defaultLocale = (0, $520a025cdb0d710d$export$188ec29ebc2bdc3a)();
    return /*#__PURE__*/ (0, $01Dwp$react).createElement($2eb8e6d23f3d0cb0$var$I18nContext.Provider, {
        value: defaultLocale
    }, children);
}
function $2eb8e6d23f3d0cb0$export$a54013f0d02a8f82(props) {
    let { locale: locale, children: children } = props;
    // Conditionally render different components to avoid calling useDefaultLocale.
    // This is necessary because useDefaultLocale triggers a re-render.
    if (locale) return /*#__PURE__*/ (0, $01Dwp$react).createElement($2eb8e6d23f3d0cb0$var$I18nProviderWithLocale, {
        locale: locale,
        children: children
    });
    return /*#__PURE__*/ (0, $01Dwp$react).createElement($2eb8e6d23f3d0cb0$var$I18nProviderWithDefaultLocale, {
        children: children
    });
}
function $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7() {
    let defaultLocale = (0, $520a025cdb0d710d$export$188ec29ebc2bdc3a)();
    let context = (0, $01Dwp$useContext)($2eb8e6d23f3d0cb0$var$I18nContext);
    return context || defaultLocale;
}


export {$2eb8e6d23f3d0cb0$export$a54013f0d02a8f82 as I18nProvider, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7 as useLocale};
//# sourceMappingURL=I18nProvider.mjs.map
