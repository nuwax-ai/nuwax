import {CalendarDate as $2aaf608024c21ca1$export$99faa760c7908e4f, CalendarDateTime as $2aaf608024c21ca1$export$ca871e8dbb80966f, Time as $2aaf608024c21ca1$export$680ea196effce5f, ZonedDateTime as $2aaf608024c21ca1$export$d3b7288e7994edea} from "./CalendarDate.mjs";
import {constrain as $435a2ceaa8778ed8$export$c4e2ecac49351ef2} from "./manipulation.mjs";
import {getExtendedYear as $93635573935797de$export$c36e0ecb2d4fa69d, GregorianCalendar as $93635573935797de$export$80ee6245ec4f29ec} from "./calendars/GregorianCalendar.mjs";
import {getLocalTimeZone as $ad063034c8620db8$export$aa8b41735afcabd2, isEqualCalendar as $ad063034c8620db8$export$dbc69fd56b53d5e, isLocalTimeZoneOverridden as $ad063034c8620db8$export$6ab69b273755230b} from "./queries.mjs";

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
 */ // Portions of the code in this file are based on code from the TC39 Temporal proposal.
// Original licensing can be found in the NOTICE file in the root directory of this source tree.




function $d07e34cce18680fd$export$bd4fb2bc8bb06fb(date) {
    date = $d07e34cce18680fd$export$b4a036af3fc0b032(date, new (0, $93635573935797de$export$80ee6245ec4f29ec)());
    let year = (0, $93635573935797de$export$c36e0ecb2d4fa69d)(date.era, date.year);
    return $d07e34cce18680fd$var$epochFromParts(year, date.month, date.day, date.hour, date.minute, date.second, date.millisecond);
}
function $d07e34cce18680fd$var$epochFromParts(year, month, day, hour, minute, second, millisecond) {
    // Note: Date.UTC() interprets one and two-digit years as being in the
    // 20th century, so don't use it
    let date = new Date();
    date.setUTCHours(hour, minute, second, millisecond);
    date.setUTCFullYear(year, month - 1, day);
    return date.getTime();
}
function $d07e34cce18680fd$export$59c99f3515d3493f(ms, timeZone) {
    // Fast path for UTC.
    if (timeZone === 'UTC') return 0;
    // Fast path: for local timezone after 1970, use native Date.
    // Skip this fast path if the local timezone was explicitly overridden via setLocalTimeZone,
    // since native Date always uses the browser's timezone, not the overridden one.
    if (ms > 0 && timeZone === (0, $ad063034c8620db8$export$aa8b41735afcabd2)() && !(0, $ad063034c8620db8$export$6ab69b273755230b)()) return new Date(ms).getTimezoneOffset() * -60000;
    let { year: year, month: month, day: day, hour: hour, minute: minute, second: second } = $d07e34cce18680fd$var$getTimeZoneParts(ms, timeZone);
    let utc = $d07e34cce18680fd$var$epochFromParts(year, month, day, hour, minute, second, 0);
    return utc - Math.floor(ms / 1000) * 1000;
}
const $d07e34cce18680fd$var$formattersByTimeZone = new Map();
function $d07e34cce18680fd$var$getTimeZoneParts(ms, timeZone) {
    let formatter = $d07e34cce18680fd$var$formattersByTimeZone.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour12: false,
            era: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
        $d07e34cce18680fd$var$formattersByTimeZone.set(timeZone, formatter);
    }
    let parts = formatter.formatToParts(new Date(ms));
    let namedParts = {};
    for (let part of parts)if (part.type !== 'literal') namedParts[part.type] = part.value;
    return {
        // Firefox returns B instead of BC... https://bugzilla.mozilla.org/show_bug.cgi?id=1752253
        year: namedParts.era === 'BC' || namedParts.era === 'B' ? -namedParts.year + 1 : +namedParts.year,
        month: +namedParts.month,
        day: +namedParts.day,
        hour: namedParts.hour === '24' ? 0 : +namedParts.hour,
        minute: +namedParts.minute,
        second: +namedParts.second
    };
}
const $d07e34cce18680fd$var$DAYMILLIS = 86400000;
function $d07e34cce18680fd$export$136f38efe7caf549(date, timeZone) {
    let ms = $d07e34cce18680fd$export$bd4fb2bc8bb06fb(date);
    let earlier = ms - $d07e34cce18680fd$export$59c99f3515d3493f(ms - $d07e34cce18680fd$var$DAYMILLIS, timeZone);
    let later = ms - $d07e34cce18680fd$export$59c99f3515d3493f(ms + $d07e34cce18680fd$var$DAYMILLIS, timeZone);
    return $d07e34cce18680fd$var$getValidWallTimes(date, timeZone, earlier, later);
}
function $d07e34cce18680fd$var$getValidWallTimes(date, timeZone, earlier, later) {
    let found = earlier === later ? [
        earlier
    ] : [
        earlier,
        later
    ];
    return found.filter((absolute)=>$d07e34cce18680fd$var$isValidWallTime(date, timeZone, absolute));
}
function $d07e34cce18680fd$var$isValidWallTime(date, timeZone, absolute) {
    let parts = $d07e34cce18680fd$var$getTimeZoneParts(absolute, timeZone);
    return date.year === parts.year && date.month === parts.month && date.day === parts.day && date.hour === parts.hour && date.minute === parts.minute && date.second === parts.second;
}
function $d07e34cce18680fd$export$5107c82f94518f5c(date, timeZone, disambiguation = 'compatible') {
    let dateTime = $d07e34cce18680fd$export$b21e0b124e224484(date);
    // Fast path: if the time zone is UTC, use native Date.
    if (timeZone === 'UTC') return $d07e34cce18680fd$export$bd4fb2bc8bb06fb(dateTime);
    // Fast path: if the time zone is the local timezone and disambiguation is compatible, use native Date.
    // Skip this fast path if the local timezone was explicitly overridden via setLocalTimeZone,
    // since native Date always uses the browser's timezone, not the overridden one.
    if (timeZone === (0, $ad063034c8620db8$export$aa8b41735afcabd2)() && disambiguation === 'compatible' && !(0, $ad063034c8620db8$export$6ab69b273755230b)()) {
        dateTime = $d07e34cce18680fd$export$b4a036af3fc0b032(dateTime, new (0, $93635573935797de$export$80ee6245ec4f29ec)());
        // Don't use Date constructor here because two-digit years are interpreted in the 20th century.
        let date = new Date();
        let year = (0, $93635573935797de$export$c36e0ecb2d4fa69d)(dateTime.era, dateTime.year);
        date.setFullYear(year, dateTime.month - 1, dateTime.day);
        date.setHours(dateTime.hour, dateTime.minute, dateTime.second, dateTime.millisecond);
        return date.getTime();
    }
    let ms = $d07e34cce18680fd$export$bd4fb2bc8bb06fb(dateTime);
    let offsetBefore = $d07e34cce18680fd$export$59c99f3515d3493f(ms - $d07e34cce18680fd$var$DAYMILLIS, timeZone);
    let offsetAfter = $d07e34cce18680fd$export$59c99f3515d3493f(ms + $d07e34cce18680fd$var$DAYMILLIS, timeZone);
    let valid = $d07e34cce18680fd$var$getValidWallTimes(dateTime, timeZone, ms - offsetBefore, ms - offsetAfter);
    if (valid.length === 1) return valid[0];
    if (valid.length > 1) switch(disambiguation){
        // 'compatible' means 'earlier' for "fall back" transitions
        case 'compatible':
        case 'earlier':
            return valid[0];
        case 'later':
            return valid[valid.length - 1];
        case 'reject':
            throw new RangeError('Multiple possible absolute times found');
    }
    switch(disambiguation){
        case 'earlier':
            return Math.min(ms - offsetBefore, ms - offsetAfter);
        // 'compatible' means 'later' for "spring forward" transitions
        case 'compatible':
        case 'later':
            return Math.max(ms - offsetBefore, ms - offsetAfter);
        case 'reject':
            throw new RangeError('No such absolute time found');
    }
}
function $d07e34cce18680fd$export$e67a095c620b86fe(dateTime, timeZone, disambiguation = 'compatible') {
    return new Date($d07e34cce18680fd$export$5107c82f94518f5c(dateTime, timeZone, disambiguation));
}
function $d07e34cce18680fd$export$1b96692a1ba042ac(ms, timeZone) {
    let offset = $d07e34cce18680fd$export$59c99f3515d3493f(ms, timeZone);
    let date = new Date(ms + offset);
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    let day = date.getUTCDate();
    let hour = date.getUTCHours();
    let minute = date.getUTCMinutes();
    let second = date.getUTCSeconds();
    let millisecond = date.getUTCMilliseconds();
    return new (0, $2aaf608024c21ca1$export$d3b7288e7994edea)(year < 1 ? 'BC' : 'AD', year < 1 ? -year + 1 : year, month, day, timeZone, offset, hour, minute, second, millisecond);
}
function $d07e34cce18680fd$export$e57ff100d91bd4b9(date, timeZone) {
    return $d07e34cce18680fd$export$1b96692a1ba042ac(date.getTime(), timeZone);
}
function $d07e34cce18680fd$export$d7f92bcd3596b086(date) {
    return $d07e34cce18680fd$export$e57ff100d91bd4b9(date, (0, $ad063034c8620db8$export$aa8b41735afcabd2)());
}
function $d07e34cce18680fd$export$93522d1a439f3617(dateTime) {
    return new (0, $2aaf608024c21ca1$export$99faa760c7908e4f)(dateTime.calendar, dateTime.era, dateTime.year, dateTime.month, dateTime.day);
}
function $d07e34cce18680fd$export$6f4d78149f3f53ac(date) {
    return {
        era: date.era,
        year: date.year,
        month: date.month,
        day: date.day
    };
}
function $d07e34cce18680fd$export$4d0393e732857be5(date) {
    return {
        hour: date.hour,
        minute: date.minute,
        second: date.second,
        millisecond: date.millisecond
    };
}
function $d07e34cce18680fd$export$b21e0b124e224484(date, time) {
    let hour = 0, minute = 0, second = 0, millisecond = 0;
    if ('timeZone' in date) ({ hour: hour, minute: minute, second: second, millisecond: millisecond } = date);
    else if ('hour' in date && !time) return date;
    if (time) ({ hour: hour, minute: minute, second: second, millisecond: millisecond } = time);
    return new (0, $2aaf608024c21ca1$export$ca871e8dbb80966f)(date.calendar, date.era, date.year, date.month, date.day, hour, minute, second, millisecond);
}
function $d07e34cce18680fd$export$d33f79e3ffc3dc83(dateTime) {
    return new (0, $2aaf608024c21ca1$export$680ea196effce5f)(dateTime.hour, dateTime.minute, dateTime.second, dateTime.millisecond);
}
function $d07e34cce18680fd$export$b4a036af3fc0b032(date, calendar) {
    if ((0, $ad063034c8620db8$export$dbc69fd56b53d5e)(date.calendar, calendar)) return date;
    let calendarDate = calendar.fromJulianDay(date.calendar.toJulianDay(date));
    let copy = date.copy();
    copy.calendar = calendar;
    copy.era = calendarDate.era;
    copy.year = calendarDate.year;
    copy.month = calendarDate.month;
    copy.day = calendarDate.day;
    (0, $435a2ceaa8778ed8$export$c4e2ecac49351ef2)(copy);
    return copy;
}
function $d07e34cce18680fd$export$84c95a83c799e074(date, timeZone, disambiguation) {
    if (date instanceof (0, $2aaf608024c21ca1$export$d3b7288e7994edea)) {
        if (date.timeZone === timeZone) return date;
        return $d07e34cce18680fd$export$538b00033cc11c75(date, timeZone);
    }
    let ms = $d07e34cce18680fd$export$5107c82f94518f5c(date, timeZone, disambiguation);
    return $d07e34cce18680fd$export$1b96692a1ba042ac(ms, timeZone);
}
function $d07e34cce18680fd$export$83aac07b4c37b25(date) {
    let ms = $d07e34cce18680fd$export$bd4fb2bc8bb06fb(date) - date.offset;
    return new Date(ms);
}
function $d07e34cce18680fd$export$538b00033cc11c75(date, timeZone) {
    let ms = $d07e34cce18680fd$export$bd4fb2bc8bb06fb(date) - date.offset;
    return $d07e34cce18680fd$export$b4a036af3fc0b032($d07e34cce18680fd$export$1b96692a1ba042ac(ms, timeZone), date.calendar);
}
function $d07e34cce18680fd$export$d9b67bc93c097491(date) {
    return $d07e34cce18680fd$export$538b00033cc11c75(date, (0, $ad063034c8620db8$export$aa8b41735afcabd2)());
}


export {$d07e34cce18680fd$export$bd4fb2bc8bb06fb as epochFromDate, $d07e34cce18680fd$export$b4a036af3fc0b032 as toCalendar, $d07e34cce18680fd$export$59c99f3515d3493f as getTimeZoneOffset, $d07e34cce18680fd$export$136f38efe7caf549 as possibleAbsolutes, $d07e34cce18680fd$export$5107c82f94518f5c as toAbsolute, $d07e34cce18680fd$export$b21e0b124e224484 as toCalendarDateTime, $d07e34cce18680fd$export$e67a095c620b86fe as toDate, $d07e34cce18680fd$export$1b96692a1ba042ac as fromAbsolute, $d07e34cce18680fd$export$e57ff100d91bd4b9 as fromDate, $d07e34cce18680fd$export$d7f92bcd3596b086 as fromDateToLocal, $d07e34cce18680fd$export$93522d1a439f3617 as toCalendarDate, $d07e34cce18680fd$export$6f4d78149f3f53ac as toDateFields, $d07e34cce18680fd$export$4d0393e732857be5 as toTimeFields, $d07e34cce18680fd$export$d33f79e3ffc3dc83 as toTime, $d07e34cce18680fd$export$84c95a83c799e074 as toZoned, $d07e34cce18680fd$export$538b00033cc11c75 as toTimeZone, $d07e34cce18680fd$export$83aac07b4c37b25 as zonedToDate, $d07e34cce18680fd$export$d9b67bc93c097491 as toLocalTimeZone};
//# sourceMappingURL=conversion.mjs.map
