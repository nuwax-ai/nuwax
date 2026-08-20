var $c51b7e0106f45dea$exports = require("../CalendarDate.cjs");
var $05031860ba2f881f$exports = require("./GregorianCalendar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "BuddhistCalendar", function () { return $0ce473f03e925476$export$42d20a78301dee44; });
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
 */ // Portions of the code in this file are based on code from ICU.
// Original licensing can be found in the NOTICE file in the root directory of this source tree.


const $0ce473f03e925476$var$BUDDHIST_ERA_START = -543;
class $0ce473f03e925476$export$42d20a78301dee44 extends (0, $05031860ba2f881f$exports.GregorianCalendar) {
    fromJulianDay(jd) {
        let gregorianDate = super.fromJulianDay(jd);
        let year = (0, $05031860ba2f881f$exports.getExtendedYear)(gregorianDate.era, gregorianDate.year);
        return new (0, $c51b7e0106f45dea$exports.CalendarDate)(this, year - $0ce473f03e925476$var$BUDDHIST_ERA_START, gregorianDate.month, gregorianDate.day);
    }
    toJulianDay(date) {
        return super.toJulianDay($0ce473f03e925476$var$toGregorian(date));
    }
    getEras() {
        return [
            'BE'
        ];
    }
    getDaysInMonth(date) {
        return super.getDaysInMonth($0ce473f03e925476$var$toGregorian(date));
    }
    balanceDate() {}
    constructor(...args){
        super(...args), this.identifier = 'buddhist';
    }
}
function $0ce473f03e925476$var$toGregorian(date) {
    let [era, year] = (0, $05031860ba2f881f$exports.fromExtendedYear)(date.year + $0ce473f03e925476$var$BUDDHIST_ERA_START);
    return new (0, $c51b7e0106f45dea$exports.CalendarDate)(era, year, date.month, date.day);
}


//# sourceMappingURL=BuddhistCalendar.cjs.map
