var $c51b7e0106f45dea$exports = require("../CalendarDate.cjs");
var $05031860ba2f881f$exports = require("./GregorianCalendar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "TaiwanCalendar", function () { return $2dab1d4ea1fc722b$export$65e01080afcb0799; });
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


const $2dab1d4ea1fc722b$var$TAIWAN_ERA_START = 1911;
function $2dab1d4ea1fc722b$var$gregorianYear(date) {
    return date.era === 'minguo' ? date.year + $2dab1d4ea1fc722b$var$TAIWAN_ERA_START : 1 - date.year + $2dab1d4ea1fc722b$var$TAIWAN_ERA_START;
}
function $2dab1d4ea1fc722b$var$gregorianToTaiwan(year) {
    let y = year - $2dab1d4ea1fc722b$var$TAIWAN_ERA_START;
    if (y > 0) return [
        'minguo',
        y
    ];
    else return [
        'before_minguo',
        1 - y
    ];
}
class $2dab1d4ea1fc722b$export$65e01080afcb0799 extends (0, $05031860ba2f881f$exports.GregorianCalendar) {
    fromJulianDay(jd) {
        let date = super.fromJulianDay(jd);
        let extendedYear = (0, $05031860ba2f881f$exports.getExtendedYear)(date.era, date.year);
        let [era, year] = $2dab1d4ea1fc722b$var$gregorianToTaiwan(extendedYear);
        return new (0, $c51b7e0106f45dea$exports.CalendarDate)(this, era, year, date.month, date.day);
    }
    toJulianDay(date) {
        return super.toJulianDay($2dab1d4ea1fc722b$var$toGregorian(date));
    }
    getEras() {
        return [
            'before_minguo',
            'minguo'
        ];
    }
    balanceDate(date) {
        let [era, year] = $2dab1d4ea1fc722b$var$gregorianToTaiwan($2dab1d4ea1fc722b$var$gregorianYear(date));
        date.era = era;
        date.year = year;
    }
    isInverseEra(date) {
        return date.era === 'before_minguo';
    }
    getDaysInMonth(date) {
        return super.getDaysInMonth($2dab1d4ea1fc722b$var$toGregorian(date));
    }
    getYearsInEra(date) {
        return date.era === 'before_minguo' ? 9999 : 9999 - $2dab1d4ea1fc722b$var$TAIWAN_ERA_START;
    }
    constructor(...args){
        super(...args), this.identifier = 'roc' // Republic of China
        ;
    }
}
function $2dab1d4ea1fc722b$var$toGregorian(date) {
    let [era, year] = (0, $05031860ba2f881f$exports.fromExtendedYear)($2dab1d4ea1fc722b$var$gregorianYear(date));
    return new (0, $c51b7e0106f45dea$exports.CalendarDate)(era, year, date.month, date.day);
}


//# sourceMappingURL=TaiwanCalendar.cjs.map
