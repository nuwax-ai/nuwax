var $e13115b3b86b9007$exports = require("./conversion.cjs");
var $621d1537dc806c0f$exports = require("./weekStartData.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "isSameDay", function () { return $84a63d30beb0af0f$export$ea39ec197993aef0; });
$parcel$export(module.exports, "isSameMonth", function () { return $84a63d30beb0af0f$export$a18c89cbd24170ff; });
$parcel$export(module.exports, "startOfMonth", function () { return $84a63d30beb0af0f$export$a5a3b454ada2268e; });
$parcel$export(module.exports, "isSameYear", function () { return $84a63d30beb0af0f$export$5841f9eb9773f25f; });
$parcel$export(module.exports, "startOfYear", function () { return $84a63d30beb0af0f$export$f91e89d3d0406102; });
$parcel$export(module.exports, "isEqualDay", function () { return $84a63d30beb0af0f$export$91b62ebf2ba703ee; });
$parcel$export(module.exports, "isEqualCalendar", function () { return $84a63d30beb0af0f$export$dbc69fd56b53d5e; });
$parcel$export(module.exports, "isEqualMonth", function () { return $84a63d30beb0af0f$export$5a8da0c44a3afdf2; });
$parcel$export(module.exports, "isEqualYear", function () { return $84a63d30beb0af0f$export$ea840f5a6dda8147; });
$parcel$export(module.exports, "isToday", function () { return $84a63d30beb0af0f$export$629b0a497aa65267; });
$parcel$export(module.exports, "today", function () { return $84a63d30beb0af0f$export$d0bdf45af03a6ea3; });
$parcel$export(module.exports, "getDayOfWeek", function () { return $84a63d30beb0af0f$export$2061056d06d7cdf7; });
$parcel$export(module.exports, "now", function () { return $84a63d30beb0af0f$export$461939dd4422153; });
$parcel$export(module.exports, "compareDate", function () { return $84a63d30beb0af0f$export$68781ddf31c0090f; });
$parcel$export(module.exports, "compareTime", function () { return $84a63d30beb0af0f$export$c19a80a9721b80f6; });
$parcel$export(module.exports, "getHoursInDay", function () { return $84a63d30beb0af0f$export$126c91c941de7e; });
$parcel$export(module.exports, "getLocalTimeZone", function () { return $84a63d30beb0af0f$export$aa8b41735afcabd2; });
$parcel$export(module.exports, "setLocalTimeZone", function () { return $84a63d30beb0af0f$export$61a9d83ceb59a3dd; });
$parcel$export(module.exports, "resetLocalTimeZone", function () { return $84a63d30beb0af0f$export$55753838ffe79333; });
$parcel$export(module.exports, "isLocalTimeZoneOverridden", function () { return $84a63d30beb0af0f$export$6ab69b273755230b; });
$parcel$export(module.exports, "endOfMonth", function () { return $84a63d30beb0af0f$export$a2258d9c4118825c; });
$parcel$export(module.exports, "endOfYear", function () { return $84a63d30beb0af0f$export$8b7aa55c66d5569e; });
$parcel$export(module.exports, "getMinimumMonthInYear", function () { return $84a63d30beb0af0f$export$5412ac11713b72ad; });
$parcel$export(module.exports, "getMinimumDayInMonth", function () { return $84a63d30beb0af0f$export$b2f4953d301981d5; });
$parcel$export(module.exports, "startOfWeek", function () { return $84a63d30beb0af0f$export$42c81a444fbfb5d4; });
$parcel$export(module.exports, "endOfWeek", function () { return $84a63d30beb0af0f$export$ef8b6d9133084f4e; });
$parcel$export(module.exports, "getWeeksInMonth", function () { return $84a63d30beb0af0f$export$ccc1b2479e7dd654; });
$parcel$export(module.exports, "minDate", function () { return $84a63d30beb0af0f$export$5c333a116e949cdd; });
$parcel$export(module.exports, "maxDate", function () { return $84a63d30beb0af0f$export$a75f2bff57811055; });
$parcel$export(module.exports, "isWeekend", function () { return $84a63d30beb0af0f$export$618d60ea299da42; });
$parcel$export(module.exports, "isWeekday", function () { return $84a63d30beb0af0f$export$ee9d87258e1d19ed; });
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

function $84a63d30beb0af0f$export$ea39ec197993aef0(a, b) {
    b = (0, $e13115b3b86b9007$exports.toCalendar)(b, a.calendar);
    return a.era === b.era && a.year === b.year && a.month === b.month && a.day === b.day;
}
function $84a63d30beb0af0f$export$a18c89cbd24170ff(a, b) {
    b = (0, $e13115b3b86b9007$exports.toCalendar)(b, a.calendar);
    // In the Japanese calendar, months can span multiple eras/years, so only compare the first of the month.
    a = $84a63d30beb0af0f$export$a5a3b454ada2268e(a);
    b = $84a63d30beb0af0f$export$a5a3b454ada2268e(b);
    return a.era === b.era && a.year === b.year && a.month === b.month;
}
function $84a63d30beb0af0f$export$5841f9eb9773f25f(a, b) {
    b = (0, $e13115b3b86b9007$exports.toCalendar)(b, a.calendar);
    a = $84a63d30beb0af0f$export$f91e89d3d0406102(a);
    b = $84a63d30beb0af0f$export$f91e89d3d0406102(b);
    return a.era === b.era && a.year === b.year;
}
function $84a63d30beb0af0f$export$91b62ebf2ba703ee(a, b) {
    return $84a63d30beb0af0f$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $84a63d30beb0af0f$export$ea39ec197993aef0(a, b);
}
function $84a63d30beb0af0f$export$5a8da0c44a3afdf2(a, b) {
    return $84a63d30beb0af0f$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $84a63d30beb0af0f$export$a18c89cbd24170ff(a, b);
}
function $84a63d30beb0af0f$export$ea840f5a6dda8147(a, b) {
    return $84a63d30beb0af0f$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $84a63d30beb0af0f$export$5841f9eb9773f25f(a, b);
}
function $84a63d30beb0af0f$export$dbc69fd56b53d5e(a, b) {
    return a.isEqual?.(b) ?? b.isEqual?.(a) ?? a.identifier === b.identifier;
}
function $84a63d30beb0af0f$export$629b0a497aa65267(date, timeZone) {
    return $84a63d30beb0af0f$export$ea39ec197993aef0(date, $84a63d30beb0af0f$export$d0bdf45af03a6ea3(timeZone));
}
const $84a63d30beb0af0f$var$DAY_MAP = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
};
function $84a63d30beb0af0f$export$2061056d06d7cdf7(date, locale, firstDayOfWeek) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let weekStart = firstDayOfWeek ? $84a63d30beb0af0f$var$DAY_MAP[firstDayOfWeek] : $84a63d30beb0af0f$var$getWeekStart(locale);
    let dayOfWeek = Math.ceil(julian + 1 - weekStart) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    return dayOfWeek;
}
function $84a63d30beb0af0f$export$461939dd4422153(timeZone) {
    return (0, $e13115b3b86b9007$exports.fromAbsolute)(Date.now(), timeZone);
}
function $84a63d30beb0af0f$export$d0bdf45af03a6ea3(timeZone) {
    return (0, $e13115b3b86b9007$exports.toCalendarDate)($84a63d30beb0af0f$export$461939dd4422153(timeZone));
}
function $84a63d30beb0af0f$export$68781ddf31c0090f(a, b) {
    return a.calendar.toJulianDay(a) - b.calendar.toJulianDay(b);
}
function $84a63d30beb0af0f$export$c19a80a9721b80f6(a, b) {
    return $84a63d30beb0af0f$var$timeToMs(a) - $84a63d30beb0af0f$var$timeToMs(b);
}
function $84a63d30beb0af0f$var$timeToMs(a) {
    return a.hour * 3600000 + a.minute * 60000 + a.second * 1000 + a.millisecond;
}
function $84a63d30beb0af0f$export$126c91c941de7e(a, timeZone) {
    let ms = (0, $e13115b3b86b9007$exports.toAbsolute)(a, timeZone);
    let tomorrow = a.add({
        days: 1
    });
    let tomorrowMs = (0, $e13115b3b86b9007$exports.toAbsolute)(tomorrow, timeZone);
    return (tomorrowMs - ms) / 3600000;
}
let $84a63d30beb0af0f$var$localTimeZone = null;
let $84a63d30beb0af0f$var$localTimeZoneOverride = false;
function $84a63d30beb0af0f$export$aa8b41735afcabd2() {
    if ($84a63d30beb0af0f$var$localTimeZone == null) $84a63d30beb0af0f$var$localTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return $84a63d30beb0af0f$var$localTimeZone;
}
function $84a63d30beb0af0f$export$61a9d83ceb59a3dd(timeZone) {
    $84a63d30beb0af0f$var$localTimeZoneOverride = true;
    $84a63d30beb0af0f$var$localTimeZone = timeZone;
}
function $84a63d30beb0af0f$export$55753838ffe79333() {
    $84a63d30beb0af0f$var$localTimeZoneOverride = false;
    $84a63d30beb0af0f$var$localTimeZone = null;
}
function $84a63d30beb0af0f$export$6ab69b273755230b() {
    return $84a63d30beb0af0f$var$localTimeZoneOverride;
}
function $84a63d30beb0af0f$export$a5a3b454ada2268e(date) {
    // Use `subtract` instead of `set` so we don't get constrained in an era.
    return date.subtract({
        days: date.day - 1
    });
}
function $84a63d30beb0af0f$export$a2258d9c4118825c(date) {
    return date.add({
        days: date.calendar.getDaysInMonth(date) - date.day
    });
}
function $84a63d30beb0af0f$export$f91e89d3d0406102(date) {
    return $84a63d30beb0af0f$export$a5a3b454ada2268e(date.subtract({
        months: date.month - 1
    }));
}
function $84a63d30beb0af0f$export$8b7aa55c66d5569e(date) {
    return $84a63d30beb0af0f$export$a2258d9c4118825c(date.add({
        months: date.calendar.getMonthsInYear(date) - date.month
    }));
}
function $84a63d30beb0af0f$export$5412ac11713b72ad(date) {
    if (date.calendar.getMinimumMonthInYear) return date.calendar.getMinimumMonthInYear(date);
    return 1;
}
function $84a63d30beb0af0f$export$b2f4953d301981d5(date) {
    if (date.calendar.getMinimumDayInMonth) return date.calendar.getMinimumDayInMonth(date);
    return 1;
}
function $84a63d30beb0af0f$export$42c81a444fbfb5d4(date, locale, firstDayOfWeek) {
    let dayOfWeek = $84a63d30beb0af0f$export$2061056d06d7cdf7(date, locale, firstDayOfWeek);
    return date.subtract({
        days: dayOfWeek
    });
}
function $84a63d30beb0af0f$export$ef8b6d9133084f4e(date, locale, firstDayOfWeek) {
    return $84a63d30beb0af0f$export$42c81a444fbfb5d4(date, locale, firstDayOfWeek).add({
        days: 6
    });
}
const $84a63d30beb0af0f$var$cachedRegions = new Map();
const $84a63d30beb0af0f$var$cachedWeekInfo = new Map();
function $84a63d30beb0af0f$var$getRegion(locale) {
    // If the Intl.Locale API is available, use it to get the region for the locale.
    // @ts-ignore
    if (Intl.Locale) {
        // Constructing an Intl.Locale is expensive, so cache the result.
        let region = $84a63d30beb0af0f$var$cachedRegions.get(locale);
        if (!region) {
            // @ts-ignore
            region = new Intl.Locale(locale).maximize().region;
            if (region) $84a63d30beb0af0f$var$cachedRegions.set(locale, region);
        }
        return region;
    }
    // If not, just try splitting the string.
    // If the second part of the locale string is 'u',
    // then this is a unicode extension, so ignore it.
    // Otherwise, it should be the region.
    let part = locale.split('-')[1];
    return part === 'u' ? undefined : part;
}
function $84a63d30beb0af0f$var$getWeekStart(locale) {
    // TODO: use Intl.Locale for this once browsers support the weekInfo property
    // https://github.com/tc39/proposal-intl-locale-info
    let weekInfo = $84a63d30beb0af0f$var$cachedWeekInfo.get(locale);
    if (!weekInfo) {
        if (Intl.Locale) {
            // @ts-ignore
            let localeInst = new Intl.Locale(locale);
            if ('getWeekInfo' in localeInst) {
                // @ts-expect-error
                weekInfo = localeInst.getWeekInfo();
                if (weekInfo) {
                    $84a63d30beb0af0f$var$cachedWeekInfo.set(locale, weekInfo);
                    return weekInfo.firstDay;
                }
            }
        }
        let region = $84a63d30beb0af0f$var$getRegion(locale);
        if (locale.includes('-fw-')) {
            // pull the value for the attribute fw from strings such as en-US-u-ca-iso8601-fw-tue or en-US-u-ca-iso8601-fw-mon-nu-thai
            // where the fw attribute could be followed by another unicode locale extension or not
            let day = locale.split('-fw-')[1].split('-')[0];
            if (day === 'mon') weekInfo = {
                firstDay: 1
            };
            else if (day === 'tue') weekInfo = {
                firstDay: 2
            };
            else if (day === 'wed') weekInfo = {
                firstDay: 3
            };
            else if (day === 'thu') weekInfo = {
                firstDay: 4
            };
            else if (day === 'fri') weekInfo = {
                firstDay: 5
            };
            else if (day === 'sat') weekInfo = {
                firstDay: 6
            };
            else weekInfo = {
                firstDay: 0
            };
        } else if (locale.includes('-ca-iso8601')) weekInfo = {
            firstDay: 1
        };
        else weekInfo = {
            firstDay: region ? (0, $621d1537dc806c0f$exports.weekStartData)[region] || 0 : 0
        };
        $84a63d30beb0af0f$var$cachedWeekInfo.set(locale, weekInfo);
    }
    return weekInfo.firstDay;
}
function $84a63d30beb0af0f$export$ccc1b2479e7dd654(date, locale, firstDayOfWeek) {
    let days = date.calendar.getDaysInMonth(date);
    return Math.ceil(($84a63d30beb0af0f$export$2061056d06d7cdf7($84a63d30beb0af0f$export$a5a3b454ada2268e(date), locale, firstDayOfWeek) + days) / 7);
}
function $84a63d30beb0af0f$export$5c333a116e949cdd(a, b) {
    if (a && b) return a.compare(b) <= 0 ? a : b;
    return a || b;
}
function $84a63d30beb0af0f$export$a75f2bff57811055(a, b) {
    if (a && b) return a.compare(b) >= 0 ? a : b;
    return a || b;
}
const $84a63d30beb0af0f$var$WEEKEND_DATA = {
    AF: [
        4,
        5
    ],
    AE: [
        5,
        6
    ],
    BH: [
        5,
        6
    ],
    DZ: [
        5,
        6
    ],
    EG: [
        5,
        6
    ],
    IL: [
        5,
        6
    ],
    IQ: [
        5,
        6
    ],
    IR: [
        5,
        5
    ],
    JO: [
        5,
        6
    ],
    KW: [
        5,
        6
    ],
    LY: [
        5,
        6
    ],
    OM: [
        5,
        6
    ],
    QA: [
        5,
        6
    ],
    SA: [
        5,
        6
    ],
    SD: [
        5,
        6
    ],
    SY: [
        5,
        6
    ],
    YE: [
        5,
        6
    ]
};
function $84a63d30beb0af0f$export$618d60ea299da42(date, locale) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let dayOfWeek = Math.ceil(julian + 1) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    let region = $84a63d30beb0af0f$var$getRegion(locale);
    // Use Intl.Locale for this once weekInfo is supported.
    // https://github.com/tc39/proposal-intl-locale-info
    let [start, end] = $84a63d30beb0af0f$var$WEEKEND_DATA[region] || [
        6,
        0
    ];
    return dayOfWeek === start || dayOfWeek === end;
}
function $84a63d30beb0af0f$export$ee9d87258e1d19ed(date, locale) {
    return !$84a63d30beb0af0f$export$618d60ea299da42(date, locale);
}


//# sourceMappingURL=queries.cjs.map
