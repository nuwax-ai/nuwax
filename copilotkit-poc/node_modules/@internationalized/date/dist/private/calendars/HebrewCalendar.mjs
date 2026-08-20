import {CalendarDate as $2aaf608024c21ca1$export$99faa760c7908e4f} from "../CalendarDate.mjs";
import {mod as $09ec6a572d60460f$export$842a2cf37af977e1} from "../utils.mjs";

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


const $f39495b96f9dbac6$var$HEBREW_EPOCH = 347997;
// Hebrew date calculations are performed in terms of days, hours, and
// "parts" (or halakim), which are 1/1080 of an hour, or 3 1/3 seconds.
const $f39495b96f9dbac6$var$HOUR_PARTS = 1080;
const $f39495b96f9dbac6$var$DAY_PARTS = 24 * $f39495b96f9dbac6$var$HOUR_PARTS;
// An approximate value for the length of a lunar month.
// It is used to calculate the approximate year and month of a given
// absolute date.
const $f39495b96f9dbac6$var$MONTH_DAYS = 29;
const $f39495b96f9dbac6$var$MONTH_FRACT = 12 * $f39495b96f9dbac6$var$HOUR_PARTS + 793;
const $f39495b96f9dbac6$var$MONTH_PARTS = $f39495b96f9dbac6$var$MONTH_DAYS * $f39495b96f9dbac6$var$DAY_PARTS + $f39495b96f9dbac6$var$MONTH_FRACT;
function $f39495b96f9dbac6$var$isLeapYear(year) {
    return (0, $09ec6a572d60460f$export$842a2cf37af977e1)(year * 7 + 1, 19) < 7;
}
// Test for delay of start of new year and to avoid
// Sunday, Wednesday, and Friday as start of the new year.
function $f39495b96f9dbac6$var$hebrewDelay1(year) {
    let months = Math.floor((235 * year - 234) / 19);
    let parts = 12084 + 13753 * months;
    let day = months * 29 + Math.floor(parts / 25920);
    if ((0, $09ec6a572d60460f$export$842a2cf37af977e1)(3 * (day + 1), 7) < 3) day += 1;
    return day;
}
// Check for delay in start of new year due to length of adjacent years
function $f39495b96f9dbac6$var$hebrewDelay2(year) {
    let last = $f39495b96f9dbac6$var$hebrewDelay1(year - 1);
    let present = $f39495b96f9dbac6$var$hebrewDelay1(year);
    let next = $f39495b96f9dbac6$var$hebrewDelay1(year + 1);
    if (next - present === 356) return 2;
    if (present - last === 382) return 1;
    return 0;
}
function $f39495b96f9dbac6$var$startOfYear(year) {
    return $f39495b96f9dbac6$var$hebrewDelay1(year) + $f39495b96f9dbac6$var$hebrewDelay2(year);
}
function $f39495b96f9dbac6$var$getDaysInYear(year) {
    return $f39495b96f9dbac6$var$startOfYear(year + 1) - $f39495b96f9dbac6$var$startOfYear(year);
}
function $f39495b96f9dbac6$var$getYearType(year) {
    let yearLength = $f39495b96f9dbac6$var$getDaysInYear(year);
    if (yearLength > 380) yearLength -= 30; // Subtract length of leap month.
    switch(yearLength){
        case 353:
            return 0; // deficient
        case 354:
            return 1; // normal
        case 355:
            return 2; // complete
    }
}
function $f39495b96f9dbac6$var$getDaysInMonth(year, month) {
    // Normalize month numbers from 1 - 13, even on non-leap years
    if (month >= 6 && !$f39495b96f9dbac6$var$isLeapYear(year)) month++;
    // First of all, dispose of fixed-length 29 day months
    if (month === 4 || month === 7 || month === 9 || month === 11 || month === 13) return 29;
    let yearType = $f39495b96f9dbac6$var$getYearType(year);
    // If it's Heshvan, days depend on length of year
    if (month === 2) return yearType === 2 ? 30 : 29;
    // Similarly, Kislev varies with the length of year
    if (month === 3) return yearType === 0 ? 29 : 30;
    // Adar I only exists in leap years
    if (month === 6) return $f39495b96f9dbac6$var$isLeapYear(year) ? 30 : 0;
    return 30;
}
class $f39495b96f9dbac6$export$ca405048b8fb5af {
    fromJulianDay(jd) {
        let d = jd - $f39495b96f9dbac6$var$HEBREW_EPOCH;
        let m = d * $f39495b96f9dbac6$var$DAY_PARTS / $f39495b96f9dbac6$var$MONTH_PARTS; // Months (approx)
        let year = Math.floor((19 * m + 234) / 235) + 1; // Years (approx)
        let ys = $f39495b96f9dbac6$var$startOfYear(year); // 1st day of year
        let dayOfYear = Math.floor(d - ys);
        // Because of the postponement rules, it's possible to guess wrong.  Fix it.
        while(dayOfYear < 1){
            year--;
            ys = $f39495b96f9dbac6$var$startOfYear(year);
            dayOfYear = Math.floor(d - ys);
        }
        // Now figure out which month we're in, and the date within that month
        let month = 1;
        let monthStart = 0;
        while(monthStart < dayOfYear){
            monthStart += $f39495b96f9dbac6$var$getDaysInMonth(year, month);
            month++;
        }
        month--;
        monthStart -= $f39495b96f9dbac6$var$getDaysInMonth(year, month);
        let day = dayOfYear - monthStart;
        return new (0, $2aaf608024c21ca1$export$99faa760c7908e4f)(this, year, month, day);
    }
    toJulianDay(date) {
        let jd = $f39495b96f9dbac6$var$startOfYear(date.year);
        for(let month = 1; month < date.month; month++)jd += $f39495b96f9dbac6$var$getDaysInMonth(date.year, month);
        return jd + date.day + $f39495b96f9dbac6$var$HEBREW_EPOCH;
    }
    getDaysInMonth(date) {
        return $f39495b96f9dbac6$var$getDaysInMonth(date.year, date.month);
    }
    getMonthsInYear(date) {
        return $f39495b96f9dbac6$var$isLeapYear(date.year) ? 13 : 12;
    }
    getDaysInYear(date) {
        return $f39495b96f9dbac6$var$getDaysInYear(date.year);
    }
    getMaximumMonthsInYear() {
        return 13;
    }
    getMaximumDaysInMonth() {
        return 30;
    }
    getYearsInEra() {
        // 6239 gregorian
        return 9999;
    }
    getEras() {
        return [
            'AM'
        ];
    }
    balanceYearMonth(date, previousDate) {
        // Keep date in the same month when switching between leap years and non leap years
        if (previousDate.year !== date.year) {
            if ($f39495b96f9dbac6$var$isLeapYear(previousDate.year) && !$f39495b96f9dbac6$var$isLeapYear(date.year) && previousDate.month > 6) date.month--;
            else if (!$f39495b96f9dbac6$var$isLeapYear(previousDate.year) && $f39495b96f9dbac6$var$isLeapYear(date.year) && previousDate.month > 6) date.month++;
        }
    }
    constructor(){
        this.identifier = 'hebrew';
    }
}


export {$f39495b96f9dbac6$export$ca405048b8fb5af as HebrewCalendar};
//# sourceMappingURL=HebrewCalendar.mjs.map
