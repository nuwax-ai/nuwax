var $c51b7e0106f45dea$exports = require("../CalendarDate.cjs");
var $09f945753a699862$exports = require("../utils.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "gregorianToJulianDay", function () { return $05031860ba2f881f$export$f297eb839006d339; });
$parcel$export(module.exports, "getExtendedYear", function () { return $05031860ba2f881f$export$c36e0ecb2d4fa69d; });
$parcel$export(module.exports, "isLeapYear", function () { return $05031860ba2f881f$export$553d7fa8e3805fc0; });
$parcel$export(module.exports, "fromExtendedYear", function () { return $05031860ba2f881f$export$4475b7e617eb123c; });
$parcel$export(module.exports, "GregorianCalendar", function () { return $05031860ba2f881f$export$80ee6245ec4f29ec; });
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


const $05031860ba2f881f$var$EPOCH = 1721426; // 001/01/03 Julian C.E.
function $05031860ba2f881f$export$f297eb839006d339(era, year, month, day) {
    year = $05031860ba2f881f$export$c36e0ecb2d4fa69d(era, year);
    let y1 = year - 1;
    let monthOffset = -2;
    if (month <= 2) monthOffset = 0;
    else if ($05031860ba2f881f$export$553d7fa8e3805fc0(year)) monthOffset = -1;
    return $05031860ba2f881f$var$EPOCH - 1 + 365 * y1 + Math.floor(y1 / 4) - Math.floor(y1 / 100) + Math.floor(y1 / 400) + Math.floor((367 * month - 362) / 12 + monthOffset + day);
}
function $05031860ba2f881f$export$553d7fa8e3805fc0(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function $05031860ba2f881f$export$c36e0ecb2d4fa69d(era, year) {
    return era === 'BC' ? 1 - year : year;
}
function $05031860ba2f881f$export$4475b7e617eb123c(year) {
    let era = 'AD';
    if (year <= 0) {
        era = 'BC';
        year = 1 - year;
    }
    return [
        era,
        year
    ];
}
const $05031860ba2f881f$var$daysInMonth = {
    standard: [
        31,
        28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ],
    leapyear: [
        31,
        29,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ]
};
class $05031860ba2f881f$export$80ee6245ec4f29ec {
    fromJulianDay(jd) {
        let jd0 = jd;
        let depoch = jd0 - $05031860ba2f881f$var$EPOCH;
        let quadricent = Math.floor(depoch / 146097);
        let dqc = (0, $09f945753a699862$exports.mod)(depoch, 146097);
        let cent = Math.floor(dqc / 36524);
        let dcent = (0, $09f945753a699862$exports.mod)(dqc, 36524);
        let quad = Math.floor(dcent / 1461);
        let dquad = (0, $09f945753a699862$exports.mod)(dcent, 1461);
        let yindex = Math.floor(dquad / 365);
        let extendedYear = quadricent * 400 + cent * 100 + quad * 4 + yindex + (cent !== 4 && yindex !== 4 ? 1 : 0);
        let [era, year] = $05031860ba2f881f$export$4475b7e617eb123c(extendedYear);
        let yearDay = jd0 - $05031860ba2f881f$export$f297eb839006d339(era, year, 1, 1);
        let leapAdj = 2;
        if (jd0 < $05031860ba2f881f$export$f297eb839006d339(era, year, 3, 1)) leapAdj = 0;
        else if ($05031860ba2f881f$export$553d7fa8e3805fc0(year)) leapAdj = 1;
        let month = Math.floor(((yearDay + leapAdj) * 12 + 373) / 367);
        let day = jd0 - $05031860ba2f881f$export$f297eb839006d339(era, year, month, 1) + 1;
        return new (0, $c51b7e0106f45dea$exports.CalendarDate)(era, year, month, day);
    }
    toJulianDay(date) {
        return $05031860ba2f881f$export$f297eb839006d339(date.era, date.year, date.month, date.day);
    }
    getDaysInMonth(date) {
        return $05031860ba2f881f$var$daysInMonth[$05031860ba2f881f$export$553d7fa8e3805fc0(date.year) ? 'leapyear' : 'standard'][date.month - 1];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getMonthsInYear(date) {
        return 12;
    }
    getDaysInYear(date) {
        return $05031860ba2f881f$export$553d7fa8e3805fc0(date.year) ? 366 : 365;
    }
    getMaximumMonthsInYear() {
        return 12;
    }
    getMaximumDaysInMonth() {
        return 31;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getYearsInEra(date) {
        return 9999;
    }
    getEras() {
        return [
            'BC',
            'AD'
        ];
    }
    isInverseEra(date) {
        return date.era === 'BC';
    }
    balanceDate(date) {
        if (date.year <= 0) {
            date.era = date.era === 'BC' ? 'AD' : 'BC';
            date.year = 1 - date.year;
        }
    }
    constructor(){
        this.identifier = 'gregory';
    }
}


//# sourceMappingURL=GregorianCalendar.cjs.map
