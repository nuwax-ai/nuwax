import {fromAbsolute as $d07e34cce18680fd$export$1b96692a1ba042ac, toAbsolute as $d07e34cce18680fd$export$5107c82f94518f5c, toCalendar as $d07e34cce18680fd$export$b4a036af3fc0b032, toCalendarDate as $d07e34cce18680fd$export$93522d1a439f3617} from "./conversion.mjs";
import {weekStartData as $d2ca8165c9aa885a$export$7a5acbd77d414bd9} from "./weekStartData.mjs";

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

function $ad063034c8620db8$export$ea39ec197993aef0(a, b) {
    b = (0, $d07e34cce18680fd$export$b4a036af3fc0b032)(b, a.calendar);
    return a.era === b.era && a.year === b.year && a.month === b.month && a.day === b.day;
}
function $ad063034c8620db8$export$a18c89cbd24170ff(a, b) {
    b = (0, $d07e34cce18680fd$export$b4a036af3fc0b032)(b, a.calendar);
    // In the Japanese calendar, months can span multiple eras/years, so only compare the first of the month.
    a = $ad063034c8620db8$export$a5a3b454ada2268e(a);
    b = $ad063034c8620db8$export$a5a3b454ada2268e(b);
    return a.era === b.era && a.year === b.year && a.month === b.month;
}
function $ad063034c8620db8$export$5841f9eb9773f25f(a, b) {
    b = (0, $d07e34cce18680fd$export$b4a036af3fc0b032)(b, a.calendar);
    a = $ad063034c8620db8$export$f91e89d3d0406102(a);
    b = $ad063034c8620db8$export$f91e89d3d0406102(b);
    return a.era === b.era && a.year === b.year;
}
function $ad063034c8620db8$export$91b62ebf2ba703ee(a, b) {
    return $ad063034c8620db8$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $ad063034c8620db8$export$ea39ec197993aef0(a, b);
}
function $ad063034c8620db8$export$5a8da0c44a3afdf2(a, b) {
    return $ad063034c8620db8$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $ad063034c8620db8$export$a18c89cbd24170ff(a, b);
}
function $ad063034c8620db8$export$ea840f5a6dda8147(a, b) {
    return $ad063034c8620db8$export$dbc69fd56b53d5e(a.calendar, b.calendar) && $ad063034c8620db8$export$5841f9eb9773f25f(a, b);
}
function $ad063034c8620db8$export$dbc69fd56b53d5e(a, b) {
    return a.isEqual?.(b) ?? b.isEqual?.(a) ?? a.identifier === b.identifier;
}
function $ad063034c8620db8$export$629b0a497aa65267(date, timeZone) {
    return $ad063034c8620db8$export$ea39ec197993aef0(date, $ad063034c8620db8$export$d0bdf45af03a6ea3(timeZone));
}
const $ad063034c8620db8$var$DAY_MAP = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
};
function $ad063034c8620db8$export$2061056d06d7cdf7(date, locale, firstDayOfWeek) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let weekStart = firstDayOfWeek ? $ad063034c8620db8$var$DAY_MAP[firstDayOfWeek] : $ad063034c8620db8$var$getWeekStart(locale);
    let dayOfWeek = Math.ceil(julian + 1 - weekStart) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    return dayOfWeek;
}
function $ad063034c8620db8$export$461939dd4422153(timeZone) {
    return (0, $d07e34cce18680fd$export$1b96692a1ba042ac)(Date.now(), timeZone);
}
function $ad063034c8620db8$export$d0bdf45af03a6ea3(timeZone) {
    return (0, $d07e34cce18680fd$export$93522d1a439f3617)($ad063034c8620db8$export$461939dd4422153(timeZone));
}
function $ad063034c8620db8$export$68781ddf31c0090f(a, b) {
    return a.calendar.toJulianDay(a) - b.calendar.toJulianDay(b);
}
function $ad063034c8620db8$export$c19a80a9721b80f6(a, b) {
    return $ad063034c8620db8$var$timeToMs(a) - $ad063034c8620db8$var$timeToMs(b);
}
function $ad063034c8620db8$var$timeToMs(a) {
    return a.hour * 3600000 + a.minute * 60000 + a.second * 1000 + a.millisecond;
}
function $ad063034c8620db8$export$126c91c941de7e(a, timeZone) {
    let ms = (0, $d07e34cce18680fd$export$5107c82f94518f5c)(a, timeZone);
    let tomorrow = a.add({
        days: 1
    });
    let tomorrowMs = (0, $d07e34cce18680fd$export$5107c82f94518f5c)(tomorrow, timeZone);
    return (tomorrowMs - ms) / 3600000;
}
let $ad063034c8620db8$var$localTimeZone = null;
let $ad063034c8620db8$var$localTimeZoneOverride = false;
function $ad063034c8620db8$export$aa8b41735afcabd2() {
    if ($ad063034c8620db8$var$localTimeZone == null) $ad063034c8620db8$var$localTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return $ad063034c8620db8$var$localTimeZone;
}
function $ad063034c8620db8$export$61a9d83ceb59a3dd(timeZone) {
    $ad063034c8620db8$var$localTimeZoneOverride = true;
    $ad063034c8620db8$var$localTimeZone = timeZone;
}
function $ad063034c8620db8$export$55753838ffe79333() {
    $ad063034c8620db8$var$localTimeZoneOverride = false;
    $ad063034c8620db8$var$localTimeZone = null;
}
function $ad063034c8620db8$export$6ab69b273755230b() {
    return $ad063034c8620db8$var$localTimeZoneOverride;
}
function $ad063034c8620db8$export$a5a3b454ada2268e(date) {
    // Use `subtract` instead of `set` so we don't get constrained in an era.
    return date.subtract({
        days: date.day - 1
    });
}
function $ad063034c8620db8$export$a2258d9c4118825c(date) {
    return date.add({
        days: date.calendar.getDaysInMonth(date) - date.day
    });
}
function $ad063034c8620db8$export$f91e89d3d0406102(date) {
    return $ad063034c8620db8$export$a5a3b454ada2268e(date.subtract({
        months: date.month - 1
    }));
}
function $ad063034c8620db8$export$8b7aa55c66d5569e(date) {
    return $ad063034c8620db8$export$a2258d9c4118825c(date.add({
        months: date.calendar.getMonthsInYear(date) - date.month
    }));
}
function $ad063034c8620db8$export$5412ac11713b72ad(date) {
    if (date.calendar.getMinimumMonthInYear) return date.calendar.getMinimumMonthInYear(date);
    return 1;
}
function $ad063034c8620db8$export$b2f4953d301981d5(date) {
    if (date.calendar.getMinimumDayInMonth) return date.calendar.getMinimumDayInMonth(date);
    return 1;
}
function $ad063034c8620db8$export$42c81a444fbfb5d4(date, locale, firstDayOfWeek) {
    let dayOfWeek = $ad063034c8620db8$export$2061056d06d7cdf7(date, locale, firstDayOfWeek);
    return date.subtract({
        days: dayOfWeek
    });
}
function $ad063034c8620db8$export$ef8b6d9133084f4e(date, locale, firstDayOfWeek) {
    return $ad063034c8620db8$export$42c81a444fbfb5d4(date, locale, firstDayOfWeek).add({
        days: 6
    });
}
const $ad063034c8620db8$var$cachedRegions = new Map();
const $ad063034c8620db8$var$cachedWeekInfo = new Map();
function $ad063034c8620db8$var$getRegion(locale) {
    // If the Intl.Locale API is available, use it to get the region for the locale.
    // @ts-ignore
    if (Intl.Locale) {
        // Constructing an Intl.Locale is expensive, so cache the result.
        let region = $ad063034c8620db8$var$cachedRegions.get(locale);
        if (!region) {
            // @ts-ignore
            region = new Intl.Locale(locale).maximize().region;
            if (region) $ad063034c8620db8$var$cachedRegions.set(locale, region);
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
function $ad063034c8620db8$var$getWeekStart(locale) {
    // TODO: use Intl.Locale for this once browsers support the weekInfo property
    // https://github.com/tc39/proposal-intl-locale-info
    let weekInfo = $ad063034c8620db8$var$cachedWeekInfo.get(locale);
    if (!weekInfo) {
        if (Intl.Locale) {
            // @ts-ignore
            let localeInst = new Intl.Locale(locale);
            if ('getWeekInfo' in localeInst) {
                // @ts-expect-error
                weekInfo = localeInst.getWeekInfo();
                if (weekInfo) {
                    $ad063034c8620db8$var$cachedWeekInfo.set(locale, weekInfo);
                    return weekInfo.firstDay;
                }
            }
        }
        let region = $ad063034c8620db8$var$getRegion(locale);
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
            firstDay: region ? (0, $d2ca8165c9aa885a$export$7a5acbd77d414bd9)[region] || 0 : 0
        };
        $ad063034c8620db8$var$cachedWeekInfo.set(locale, weekInfo);
    }
    return weekInfo.firstDay;
}
function $ad063034c8620db8$export$ccc1b2479e7dd654(date, locale, firstDayOfWeek) {
    let days = date.calendar.getDaysInMonth(date);
    return Math.ceil(($ad063034c8620db8$export$2061056d06d7cdf7($ad063034c8620db8$export$a5a3b454ada2268e(date), locale, firstDayOfWeek) + days) / 7);
}
function $ad063034c8620db8$export$5c333a116e949cdd(a, b) {
    if (a && b) return a.compare(b) <= 0 ? a : b;
    return a || b;
}
function $ad063034c8620db8$export$a75f2bff57811055(a, b) {
    if (a && b) return a.compare(b) >= 0 ? a : b;
    return a || b;
}
const $ad063034c8620db8$var$WEEKEND_DATA = {
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
function $ad063034c8620db8$export$618d60ea299da42(date, locale) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let dayOfWeek = Math.ceil(julian + 1) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    let region = $ad063034c8620db8$var$getRegion(locale);
    // Use Intl.Locale for this once weekInfo is supported.
    // https://github.com/tc39/proposal-intl-locale-info
    let [start, end] = $ad063034c8620db8$var$WEEKEND_DATA[region] || [
        6,
        0
    ];
    return dayOfWeek === start || dayOfWeek === end;
}
function $ad063034c8620db8$export$ee9d87258e1d19ed(date, locale) {
    return !$ad063034c8620db8$export$618d60ea299da42(date, locale);
}


export {$ad063034c8620db8$export$ea39ec197993aef0 as isSameDay, $ad063034c8620db8$export$a18c89cbd24170ff as isSameMonth, $ad063034c8620db8$export$a5a3b454ada2268e as startOfMonth, $ad063034c8620db8$export$5841f9eb9773f25f as isSameYear, $ad063034c8620db8$export$f91e89d3d0406102 as startOfYear, $ad063034c8620db8$export$91b62ebf2ba703ee as isEqualDay, $ad063034c8620db8$export$dbc69fd56b53d5e as isEqualCalendar, $ad063034c8620db8$export$5a8da0c44a3afdf2 as isEqualMonth, $ad063034c8620db8$export$ea840f5a6dda8147 as isEqualYear, $ad063034c8620db8$export$629b0a497aa65267 as isToday, $ad063034c8620db8$export$d0bdf45af03a6ea3 as today, $ad063034c8620db8$export$2061056d06d7cdf7 as getDayOfWeek, $ad063034c8620db8$export$461939dd4422153 as now, $ad063034c8620db8$export$68781ddf31c0090f as compareDate, $ad063034c8620db8$export$c19a80a9721b80f6 as compareTime, $ad063034c8620db8$export$126c91c941de7e as getHoursInDay, $ad063034c8620db8$export$aa8b41735afcabd2 as getLocalTimeZone, $ad063034c8620db8$export$61a9d83ceb59a3dd as setLocalTimeZone, $ad063034c8620db8$export$55753838ffe79333 as resetLocalTimeZone, $ad063034c8620db8$export$6ab69b273755230b as isLocalTimeZoneOverridden, $ad063034c8620db8$export$a2258d9c4118825c as endOfMonth, $ad063034c8620db8$export$8b7aa55c66d5569e as endOfYear, $ad063034c8620db8$export$5412ac11713b72ad as getMinimumMonthInYear, $ad063034c8620db8$export$b2f4953d301981d5 as getMinimumDayInMonth, $ad063034c8620db8$export$42c81a444fbfb5d4 as startOfWeek, $ad063034c8620db8$export$ef8b6d9133084f4e as endOfWeek, $ad063034c8620db8$export$ccc1b2479e7dd654 as getWeeksInMonth, $ad063034c8620db8$export$5c333a116e949cdd as minDate, $ad063034c8620db8$export$a75f2bff57811055 as maxDate, $ad063034c8620db8$export$618d60ea299da42 as isWeekend, $ad063034c8620db8$export$ee9d87258e1d19ed as isWeekday};
//# sourceMappingURL=queries.mjs.map
