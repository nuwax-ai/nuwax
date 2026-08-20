var $c51b7e0106f45dea$exports = require("./CalendarDate.cjs");
var $19485913bea41f19$exports = require("./manipulation.cjs");
var $05031860ba2f881f$exports = require("./calendars/GregorianCalendar.cjs");
var $84a63d30beb0af0f$exports = require("./queries.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "epochFromDate", function () { return $e13115b3b86b9007$export$bd4fb2bc8bb06fb; });
$parcel$export(module.exports, "toCalendar", function () { return $e13115b3b86b9007$export$b4a036af3fc0b032; });
$parcel$export(module.exports, "possibleAbsolutes", function () { return $e13115b3b86b9007$export$136f38efe7caf549; });
$parcel$export(module.exports, "toAbsolute", function () { return $e13115b3b86b9007$export$5107c82f94518f5c; });
$parcel$export(module.exports, "toCalendarDateTime", function () { return $e13115b3b86b9007$export$b21e0b124e224484; });
$parcel$export(module.exports, "toDate", function () { return $e13115b3b86b9007$export$e67a095c620b86fe; });
$parcel$export(module.exports, "fromAbsolute", function () { return $e13115b3b86b9007$export$1b96692a1ba042ac; });
$parcel$export(module.exports, "fromDate", function () { return $e13115b3b86b9007$export$e57ff100d91bd4b9; });
$parcel$export(module.exports, "fromDateToLocal", function () { return $e13115b3b86b9007$export$d7f92bcd3596b086; });
$parcel$export(module.exports, "toCalendarDate", function () { return $e13115b3b86b9007$export$93522d1a439f3617; });
$parcel$export(module.exports, "toTime", function () { return $e13115b3b86b9007$export$d33f79e3ffc3dc83; });
$parcel$export(module.exports, "toZoned", function () { return $e13115b3b86b9007$export$84c95a83c799e074; });
$parcel$export(module.exports, "toTimeZone", function () { return $e13115b3b86b9007$export$538b00033cc11c75; });
$parcel$export(module.exports, "zonedToDate", function () { return $e13115b3b86b9007$export$83aac07b4c37b25; });
$parcel$export(module.exports, "toLocalTimeZone", function () { return $e13115b3b86b9007$export$d9b67bc93c097491; });
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




function $e13115b3b86b9007$export$bd4fb2bc8bb06fb(date) {
    date = $e13115b3b86b9007$export$b4a036af3fc0b032(date, new (0, $05031860ba2f881f$exports.GregorianCalendar)());
    let year = (0, $05031860ba2f881f$exports.getExtendedYear)(date.era, date.year);
    return $e13115b3b86b9007$var$epochFromParts(year, date.month, date.day, date.hour, date.minute, date.second, date.millisecond);
}
function $e13115b3b86b9007$var$epochFromParts(year, month, day, hour, minute, second, millisecond) {
    // Note: Date.UTC() interprets one and two-digit years as being in the
    // 20th century, so don't use it
    let date = new Date();
    date.setUTCHours(hour, minute, second, millisecond);
    date.setUTCFullYear(year, month - 1, day);
    return date.getTime();
}
function $e13115b3b86b9007$export$59c99f3515d3493f(ms, timeZone) {
    // Fast path for UTC.
    if (timeZone === 'UTC') return 0;
    // Fast path: for local timezone after 1970, use native Date.
    // Skip this fast path if the local timezone was explicitly overridden via setLocalTimeZone,
    // since native Date always uses the browser's timezone, not the overridden one.
    if (ms > 0 && timeZone === (0, $84a63d30beb0af0f$exports.getLocalTimeZone)() && !(0, $84a63d30beb0af0f$exports.isLocalTimeZoneOverridden)()) return new Date(ms).getTimezoneOffset() * -60000;
    let { year: year, month: month, day: day, hour: hour, minute: minute, second: second } = $e13115b3b86b9007$var$getTimeZoneParts(ms, timeZone);
    let utc = $e13115b3b86b9007$var$epochFromParts(year, month, day, hour, minute, second, 0);
    return utc - Math.floor(ms / 1000) * 1000;
}
const $e13115b3b86b9007$var$formattersByTimeZone = new Map();
function $e13115b3b86b9007$var$getTimeZoneParts(ms, timeZone) {
    let formatter = $e13115b3b86b9007$var$formattersByTimeZone.get(timeZone);
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
        $e13115b3b86b9007$var$formattersByTimeZone.set(timeZone, formatter);
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
const $e13115b3b86b9007$var$DAYMILLIS = 86400000;
function $e13115b3b86b9007$export$136f38efe7caf549(date, timeZone) {
    let ms = $e13115b3b86b9007$export$bd4fb2bc8bb06fb(date);
    let earlier = ms - $e13115b3b86b9007$export$59c99f3515d3493f(ms - $e13115b3b86b9007$var$DAYMILLIS, timeZone);
    let later = ms - $e13115b3b86b9007$export$59c99f3515d3493f(ms + $e13115b3b86b9007$var$DAYMILLIS, timeZone);
    return $e13115b3b86b9007$var$getValidWallTimes(date, timeZone, earlier, later);
}
function $e13115b3b86b9007$var$getValidWallTimes(date, timeZone, earlier, later) {
    let found = earlier === later ? [
        earlier
    ] : [
        earlier,
        later
    ];
    return found.filter((absolute)=>$e13115b3b86b9007$var$isValidWallTime(date, timeZone, absolute));
}
function $e13115b3b86b9007$var$isValidWallTime(date, timeZone, absolute) {
    let parts = $e13115b3b86b9007$var$getTimeZoneParts(absolute, timeZone);
    return date.year === parts.year && date.month === parts.month && date.day === parts.day && date.hour === parts.hour && date.minute === parts.minute && date.second === parts.second;
}
function $e13115b3b86b9007$export$5107c82f94518f5c(date, timeZone, disambiguation = 'compatible') {
    let dateTime = $e13115b3b86b9007$export$b21e0b124e224484(date);
    // Fast path: if the time zone is UTC, use native Date.
    if (timeZone === 'UTC') return $e13115b3b86b9007$export$bd4fb2bc8bb06fb(dateTime);
    // Fast path: if the time zone is the local timezone and disambiguation is compatible, use native Date.
    // Skip this fast path if the local timezone was explicitly overridden via setLocalTimeZone,
    // since native Date always uses the browser's timezone, not the overridden one.
    if (timeZone === (0, $84a63d30beb0af0f$exports.getLocalTimeZone)() && disambiguation === 'compatible' && !(0, $84a63d30beb0af0f$exports.isLocalTimeZoneOverridden)()) {
        dateTime = $e13115b3b86b9007$export$b4a036af3fc0b032(dateTime, new (0, $05031860ba2f881f$exports.GregorianCalendar)());
        // Don't use Date constructor here because two-digit years are interpreted in the 20th century.
        let date = new Date();
        let year = (0, $05031860ba2f881f$exports.getExtendedYear)(dateTime.era, dateTime.year);
        date.setFullYear(year, dateTime.month - 1, dateTime.day);
        date.setHours(dateTime.hour, dateTime.minute, dateTime.second, dateTime.millisecond);
        return date.getTime();
    }
    let ms = $e13115b3b86b9007$export$bd4fb2bc8bb06fb(dateTime);
    let offsetBefore = $e13115b3b86b9007$export$59c99f3515d3493f(ms - $e13115b3b86b9007$var$DAYMILLIS, timeZone);
    let offsetAfter = $e13115b3b86b9007$export$59c99f3515d3493f(ms + $e13115b3b86b9007$var$DAYMILLIS, timeZone);
    let valid = $e13115b3b86b9007$var$getValidWallTimes(dateTime, timeZone, ms - offsetBefore, ms - offsetAfter);
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
function $e13115b3b86b9007$export$e67a095c620b86fe(dateTime, timeZone, disambiguation = 'compatible') {
    return new Date($e13115b3b86b9007$export$5107c82f94518f5c(dateTime, timeZone, disambiguation));
}
function $e13115b3b86b9007$export$1b96692a1ba042ac(ms, timeZone) {
    let offset = $e13115b3b86b9007$export$59c99f3515d3493f(ms, timeZone);
    let date = new Date(ms + offset);
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    let day = date.getUTCDate();
    let hour = date.getUTCHours();
    let minute = date.getUTCMinutes();
    let second = date.getUTCSeconds();
    let millisecond = date.getUTCMilliseconds();
    return new (0, $c51b7e0106f45dea$exports.ZonedDateTime)(year < 1 ? 'BC' : 'AD', year < 1 ? -year + 1 : year, month, day, timeZone, offset, hour, minute, second, millisecond);
}
function $e13115b3b86b9007$export$e57ff100d91bd4b9(date, timeZone) {
    return $e13115b3b86b9007$export$1b96692a1ba042ac(date.getTime(), timeZone);
}
function $e13115b3b86b9007$export$d7f92bcd3596b086(date) {
    return $e13115b3b86b9007$export$e57ff100d91bd4b9(date, (0, $84a63d30beb0af0f$exports.getLocalTimeZone)());
}
function $e13115b3b86b9007$export$93522d1a439f3617(dateTime) {
    return new (0, $c51b7e0106f45dea$exports.CalendarDate)(dateTime.calendar, dateTime.era, dateTime.year, dateTime.month, dateTime.day);
}
function $e13115b3b86b9007$export$6f4d78149f3f53ac(date) {
    return {
        era: date.era,
        year: date.year,
        month: date.month,
        day: date.day
    };
}
function $e13115b3b86b9007$export$4d0393e732857be5(date) {
    return {
        hour: date.hour,
        minute: date.minute,
        second: date.second,
        millisecond: date.millisecond
    };
}
function $e13115b3b86b9007$export$b21e0b124e224484(date, time) {
    let hour = 0, minute = 0, second = 0, millisecond = 0;
    if ('timeZone' in date) ({ hour: hour, minute: minute, second: second, millisecond: millisecond } = date);
    else if ('hour' in date && !time) return date;
    if (time) ({ hour: hour, minute: minute, second: second, millisecond: millisecond } = time);
    return new (0, $c51b7e0106f45dea$exports.CalendarDateTime)(date.calendar, date.era, date.year, date.month, date.day, hour, minute, second, millisecond);
}
function $e13115b3b86b9007$export$d33f79e3ffc3dc83(dateTime) {
    return new (0, $c51b7e0106f45dea$exports.Time)(dateTime.hour, dateTime.minute, dateTime.second, dateTime.millisecond);
}
function $e13115b3b86b9007$export$b4a036af3fc0b032(date, calendar) {
    if ((0, $84a63d30beb0af0f$exports.isEqualCalendar)(date.calendar, calendar)) return date;
    let calendarDate = calendar.fromJulianDay(date.calendar.toJulianDay(date));
    let copy = date.copy();
    copy.calendar = calendar;
    copy.era = calendarDate.era;
    copy.year = calendarDate.year;
    copy.month = calendarDate.month;
    copy.day = calendarDate.day;
    (0, $19485913bea41f19$exports.constrain)(copy);
    return copy;
}
function $e13115b3b86b9007$export$84c95a83c799e074(date, timeZone, disambiguation) {
    if (date instanceof (0, $c51b7e0106f45dea$exports.ZonedDateTime)) {
        if (date.timeZone === timeZone) return date;
        return $e13115b3b86b9007$export$538b00033cc11c75(date, timeZone);
    }
    let ms = $e13115b3b86b9007$export$5107c82f94518f5c(date, timeZone, disambiguation);
    return $e13115b3b86b9007$export$1b96692a1ba042ac(ms, timeZone);
}
function $e13115b3b86b9007$export$83aac07b4c37b25(date) {
    let ms = $e13115b3b86b9007$export$bd4fb2bc8bb06fb(date) - date.offset;
    return new Date(ms);
}
function $e13115b3b86b9007$export$538b00033cc11c75(date, timeZone) {
    let ms = $e13115b3b86b9007$export$bd4fb2bc8bb06fb(date) - date.offset;
    return $e13115b3b86b9007$export$b4a036af3fc0b032($e13115b3b86b9007$export$1b96692a1ba042ac(ms, timeZone), date.calendar);
}
function $e13115b3b86b9007$export$d9b67bc93c097491(date) {
    return $e13115b3b86b9007$export$538b00033cc11c75(date, (0, $84a63d30beb0af0f$exports.getLocalTimeZone)());
}


//# sourceMappingURL=conversion.cjs.map
