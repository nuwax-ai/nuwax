import {CalendarDate as $9a4e222e1bd2b190$export$99faa760c7908e4f} from "../CalendarDate.js";
import {mod as $1797f75f9a4d3bd4$export$842a2cf37af977e1} from "../utils.js";

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


const $3e485caf6e85028a$var$PERSIAN_EPOCH = 1948320;
// Number of days from the start of the year to the start of each month.
const $3e485caf6e85028a$var$MONTH_START = [
    0,
    31,
    62,
    93,
    124,
    155,
    186,
    216,
    246,
    276,
    306,
    336 // Esfand
];
class $3e485caf6e85028a$export$37fccdbfd14c5939 {
    fromJulianDay(jd) {
        let daysSinceEpoch = jd - $3e485caf6e85028a$var$PERSIAN_EPOCH;
        let year = 1 + Math.floor((33 * daysSinceEpoch + 3) / 12053);
        let farvardin1 = 365 * (year - 1) + Math.floor((8 * year + 21) / 33);
        let dayOfYear = daysSinceEpoch - farvardin1;
        let month = dayOfYear < 216 ? Math.floor(dayOfYear / 31) : Math.floor((dayOfYear - 6) / 30);
        let day = dayOfYear - $3e485caf6e85028a$var$MONTH_START[month] + 1;
        return new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)(this, year, month + 1, day);
    }
    toJulianDay(date) {
        let jd = $3e485caf6e85028a$var$PERSIAN_EPOCH - 1 + 365 * (date.year - 1) + Math.floor((8 * date.year + 21) / 33);
        jd += $3e485caf6e85028a$var$MONTH_START[date.month - 1];
        jd += date.day;
        return jd;
    }
    getMonthsInYear() {
        return 12;
    }
    getDaysInMonth(date) {
        if (date.month <= 6) return 31;
        if (date.month <= 11) return 30;
        let isLeapYear = (0, $1797f75f9a4d3bd4$export$842a2cf37af977e1)(25 * date.year + 11, 33) < 8;
        return isLeapYear ? 30 : 29;
    }
    getMaximumMonthsInYear() {
        return 12;
    }
    getMaximumDaysInMonth() {
        return 31;
    }
    getEras() {
        return [
            'AP'
        ];
    }
    getYearsInEra() {
        // 9378-10-10 persian is 9999-12-31 gregorian.
        // Round down to 9377 to set the maximum full year.
        return 9377;
    }
    constructor(){
        this.identifier = 'persian';
    }
}


export {$3e485caf6e85028a$export$37fccdbfd14c5939 as PersianCalendar};
//# sourceMappingURL=PersianCalendar.js.map
