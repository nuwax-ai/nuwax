
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "isMac", function () { return $d0b4a781cf26e80b$export$9ac100e40613ea10; });
$parcel$export(module.exports, "isIPhone", function () { return $d0b4a781cf26e80b$export$186c6964ca17d99; });
$parcel$export(module.exports, "isIPad", function () { return $d0b4a781cf26e80b$export$7bef049ce92e4224; });
$parcel$export(module.exports, "isIOS", function () { return $d0b4a781cf26e80b$export$fedb369cb70207f1; });
$parcel$export(module.exports, "isAppleDevice", function () { return $d0b4a781cf26e80b$export$e1865c3bedcd822b; });
$parcel$export(module.exports, "isWebKit", function () { return $d0b4a781cf26e80b$export$78551043582a6a98; });
$parcel$export(module.exports, "isChrome", function () { return $d0b4a781cf26e80b$export$6446a186d09e379e; });
$parcel$export(module.exports, "isAndroid", function () { return $d0b4a781cf26e80b$export$a11b0059900ceec8; });
$parcel$export(module.exports, "isFirefox", function () { return $d0b4a781cf26e80b$export$b7d78993b74f766d; });
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
 */ function $d0b4a781cf26e80b$var$testUserAgent(re) {
    if (typeof window === 'undefined' || window.navigator == null) return false;
    let brands = window.navigator['userAgentData']?.brands;
    return Array.isArray(brands) && brands.some((brand)=>re.test(brand.brand)) || re.test(window.navigator.userAgent);
}
function $d0b4a781cf26e80b$var$testPlatform(re) {
    return typeof window !== 'undefined' && window.navigator != null ? re.test(window.navigator['userAgentData']?.platform || window.navigator.platform) : false;
}
function $d0b4a781cf26e80b$var$cached(fn) {
    if (process.env.NODE_ENV === 'test') return fn;
    let res = null;
    return ()=>{
        if (res == null) res = fn();
        return res;
    };
}
const $d0b4a781cf26e80b$export$9ac100e40613ea10 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testPlatform(/^Mac/i);
});
const $d0b4a781cf26e80b$export$186c6964ca17d99 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testPlatform(/^iPhone/i);
});
const $d0b4a781cf26e80b$export$7bef049ce92e4224 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testPlatform(/^iPad/i) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    $d0b4a781cf26e80b$export$9ac100e40613ea10() && navigator.maxTouchPoints > 1;
});
const $d0b4a781cf26e80b$export$fedb369cb70207f1 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$export$186c6964ca17d99() || $d0b4a781cf26e80b$export$7bef049ce92e4224();
});
const $d0b4a781cf26e80b$export$e1865c3bedcd822b = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$export$9ac100e40613ea10() || $d0b4a781cf26e80b$export$fedb369cb70207f1();
});
const $d0b4a781cf26e80b$export$78551043582a6a98 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testUserAgent(/AppleWebKit/i) && !$d0b4a781cf26e80b$export$6446a186d09e379e();
});
const $d0b4a781cf26e80b$export$6446a186d09e379e = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testUserAgent(/Chrome/i);
});
const $d0b4a781cf26e80b$export$a11b0059900ceec8 = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testUserAgent(/Android/i);
});
const $d0b4a781cf26e80b$export$b7d78993b74f766d = $d0b4a781cf26e80b$var$cached(function() {
    return $d0b4a781cf26e80b$var$testUserAgent(/Firefox/i);
});


//# sourceMappingURL=platform.cjs.map
