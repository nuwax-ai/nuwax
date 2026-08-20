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
 */ function $2add3ce32c6007eb$var$testUserAgent(re) {
    if (typeof window === 'undefined' || window.navigator == null) return false;
    let brands = window.navigator['userAgentData']?.brands;
    return Array.isArray(brands) && brands.some((brand)=>re.test(brand.brand)) || re.test(window.navigator.userAgent);
}
function $2add3ce32c6007eb$var$testPlatform(re) {
    return typeof window !== 'undefined' && window.navigator != null ? re.test(window.navigator['userAgentData']?.platform || window.navigator.platform) : false;
}
function $2add3ce32c6007eb$var$cached(fn) {
    if (process.env.NODE_ENV === 'test') return fn;
    let res = null;
    return ()=>{
        if (res == null) res = fn();
        return res;
    };
}
const $2add3ce32c6007eb$export$9ac100e40613ea10 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testPlatform(/^Mac/i);
});
const $2add3ce32c6007eb$export$186c6964ca17d99 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testPlatform(/^iPhone/i);
});
const $2add3ce32c6007eb$export$7bef049ce92e4224 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testPlatform(/^iPad/i) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    $2add3ce32c6007eb$export$9ac100e40613ea10() && navigator.maxTouchPoints > 1;
});
const $2add3ce32c6007eb$export$fedb369cb70207f1 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$export$186c6964ca17d99() || $2add3ce32c6007eb$export$7bef049ce92e4224();
});
const $2add3ce32c6007eb$export$e1865c3bedcd822b = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$export$9ac100e40613ea10() || $2add3ce32c6007eb$export$fedb369cb70207f1();
});
const $2add3ce32c6007eb$export$78551043582a6a98 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testUserAgent(/AppleWebKit/i) && !$2add3ce32c6007eb$export$6446a186d09e379e();
});
const $2add3ce32c6007eb$export$6446a186d09e379e = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testUserAgent(/Chrome/i);
});
const $2add3ce32c6007eb$export$a11b0059900ceec8 = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testUserAgent(/Android/i);
});
const $2add3ce32c6007eb$export$b7d78993b74f766d = $2add3ce32c6007eb$var$cached(function() {
    return $2add3ce32c6007eb$var$testUserAgent(/Firefox/i);
});


export {$2add3ce32c6007eb$export$9ac100e40613ea10 as isMac, $2add3ce32c6007eb$export$186c6964ca17d99 as isIPhone, $2add3ce32c6007eb$export$7bef049ce92e4224 as isIPad, $2add3ce32c6007eb$export$fedb369cb70207f1 as isIOS, $2add3ce32c6007eb$export$e1865c3bedcd822b as isAppleDevice, $2add3ce32c6007eb$export$78551043582a6a98 as isWebKit, $2add3ce32c6007eb$export$6446a186d09e379e as isChrome, $2add3ce32c6007eb$export$a11b0059900ceec8 as isAndroid, $2add3ce32c6007eb$export$b7d78993b74f766d as isFirefox};
//# sourceMappingURL=platform.mjs.map
