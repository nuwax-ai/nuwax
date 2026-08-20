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
 */ function $d5a2be505488529f$var$testUserAgent(re) {
    var _window_navigator_userAgentData;
    if (typeof window === 'undefined' || window.navigator == null) return false;
    let brands = (_window_navigator_userAgentData = window.navigator['userAgentData']) === null || _window_navigator_userAgentData === void 0 ? void 0 : _window_navigator_userAgentData.brands;
    return Array.isArray(brands) && brands.some((brand)=>re.test(brand.brand)) || re.test(window.navigator.userAgent);
}
function $d5a2be505488529f$var$testPlatform(re) {
    var _window_navigator_userAgentData;
    return typeof window !== 'undefined' && window.navigator != null ? re.test(((_window_navigator_userAgentData = window.navigator['userAgentData']) === null || _window_navigator_userAgentData === void 0 ? void 0 : _window_navigator_userAgentData.platform) || window.navigator.platform) : false;
}
function $d5a2be505488529f$var$cached(fn) {
    if (process.env.NODE_ENV === 'test') return fn;
    let res = null;
    return ()=>{
        if (res == null) res = fn();
        return res;
    };
}
const $d5a2be505488529f$export$9ac100e40613ea10 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testPlatform(/^Mac/i);
});
const $d5a2be505488529f$export$186c6964ca17d99 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testPlatform(/^iPhone/i);
});
const $d5a2be505488529f$export$7bef049ce92e4224 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testPlatform(/^iPad/i) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    $d5a2be505488529f$export$9ac100e40613ea10() && navigator.maxTouchPoints > 1;
});
const $d5a2be505488529f$export$fedb369cb70207f1 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$export$186c6964ca17d99() || $d5a2be505488529f$export$7bef049ce92e4224();
});
const $d5a2be505488529f$export$e1865c3bedcd822b = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$export$9ac100e40613ea10() || $d5a2be505488529f$export$fedb369cb70207f1();
});
const $d5a2be505488529f$export$78551043582a6a98 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testUserAgent(/AppleWebKit/i) && !$d5a2be505488529f$export$6446a186d09e379e();
});
const $d5a2be505488529f$export$6446a186d09e379e = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testUserAgent(/Chrome/i);
});
const $d5a2be505488529f$export$a11b0059900ceec8 = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testUserAgent(/Android/i);
});
const $d5a2be505488529f$export$b7d78993b74f766d = $d5a2be505488529f$var$cached(function() {
    return $d5a2be505488529f$var$testUserAgent(/Firefox/i);
});


export {$d5a2be505488529f$export$9ac100e40613ea10 as isMac, $d5a2be505488529f$export$186c6964ca17d99 as isIPhone, $d5a2be505488529f$export$7bef049ce92e4224 as isIPad, $d5a2be505488529f$export$fedb369cb70207f1 as isIOS, $d5a2be505488529f$export$e1865c3bedcd822b as isAppleDevice, $d5a2be505488529f$export$78551043582a6a98 as isWebKit, $d5a2be505488529f$export$6446a186d09e379e as isChrome, $d5a2be505488529f$export$a11b0059900ceec8 as isAndroid, $d5a2be505488529f$export$b7d78993b74f766d as isFirefox};
//# sourceMappingURL=platform.js.map
