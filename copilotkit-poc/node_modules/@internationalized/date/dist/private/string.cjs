var $c51b7e0106f45dea$exports = require("./CalendarDate.cjs");
var $e13115b3b86b9007$exports = require("./conversion.cjs");
var $84a63d30beb0af0f$exports = require("./queries.cjs");
var $05031860ba2f881f$exports = require("./calendars/GregorianCalendar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "parseTime", function () { return $1b358053f79e3a77$export$c9698ec7f05a07e1; });
$parcel$export(module.exports, "parseDate", function () { return $1b358053f79e3a77$export$6b862160d295c8e; });
$parcel$export(module.exports, "parseDateTime", function () { return $1b358053f79e3a77$export$588937bcd60ade55; });
$parcel$export(module.exports, "parseZonedDateTime", function () { return $1b358053f79e3a77$export$fd7893f06e92a6a4; });
$parcel$export(module.exports, "dateTimeToString", function () { return $1b358053f79e3a77$export$4223de14708adc63; });
$parcel$export(module.exports, "parseAbsolute", function () { return $1b358053f79e3a77$export$5adfdab05168c219; });
$parcel$export(module.exports, "parseAbsoluteToLocal", function () { return $1b358053f79e3a77$export$8e384432362ed0f0; });
$parcel$export(module.exports, "timeToString", function () { return $1b358053f79e3a77$export$f59dee82248f5ad4; });
$parcel$export(module.exports, "dateToString", function () { return $1b358053f79e3a77$export$60dfd74aa96791bd; });
$parcel$export(module.exports, "zonedDateTimeToString", function () { return $1b358053f79e3a77$export$bf79f1ebf4b18792; });
$parcel$export(module.exports, "parseDuration", function () { return $1b358053f79e3a77$export$ecae829bb3747ea6; });
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



const $1b358053f79e3a77$var$TIME_RE = /^(\d{2})(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $1b358053f79e3a77$var$DATE_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})$/;
const $1b358053f79e3a77$var$DATE_TIME_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $1b358053f79e3a77$var$ZONED_DATE_TIME_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:([+-]\d{2})(?::?(\d{2}))?(?::?(\d{2}))?)?\[(.*?)\]$/;
const $1b358053f79e3a77$var$ABSOLUTE_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:(?:([+-]\d{2})(?::?(\d{2}))?)|Z)$/;
const $1b358053f79e3a77$var$DATE_TIME_DURATION_RE = /^((?<negative>-)|\+)?P((?<years>\d*)Y)?((?<months>\d*)M)?((?<weeks>\d*)W)?((?<days>\d*)D)?((?<time>T)((?<hours>\d*[.,]?\d{1,9})H)?((?<minutes>\d*[.,]?\d{1,9})M)?((?<seconds>\d*[.,]?\d{1,9})S)?)?$/;
const $1b358053f79e3a77$var$requiredDurationTimeGroups = [
    'hours',
    'minutes',
    'seconds'
];
const $1b358053f79e3a77$var$requiredDurationGroups = [
    'years',
    'months',
    'weeks',
    'days',
    ...$1b358053f79e3a77$var$requiredDurationTimeGroups
];
function $1b358053f79e3a77$export$c9698ec7f05a07e1(value) {
    let m = value.match($1b358053f79e3a77$var$TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 time string: ' + value);
    return new (0, $c51b7e0106f45dea$exports.Time)($1b358053f79e3a77$var$parseNumber(m[1], 0, 23), m[2] ? $1b358053f79e3a77$var$parseNumber(m[2], 0, 59) : 0, m[3] ? $1b358053f79e3a77$var$parseNumber(m[3], 0, 59) : 0, m[4] ? $1b358053f79e3a77$var$parseNumber(m[4], 0, Infinity) * 1000 : 0);
}
function $1b358053f79e3a77$export$6b862160d295c8e(value) {
    let m = value.match($1b358053f79e3a77$var$DATE_RE);
    if (!m) {
        if ($1b358053f79e3a77$var$ABSOLUTE_RE.test(value)) throw new Error(`Invalid ISO 8601 date string: ${value}. Use parseAbsolute() instead.`);
        throw new Error('Invalid ISO 8601 date string: ' + value);
    }
    let date = new (0, $c51b7e0106f45dea$exports.CalendarDate)($1b358053f79e3a77$var$parseNumber(m[1], 0, 9999), $1b358053f79e3a77$var$parseNumber(m[2], 1, 12), 1);
    date.day = $1b358053f79e3a77$var$parseNumber(m[3], 1, date.calendar.getDaysInMonth(date));
    return date;
}
function $1b358053f79e3a77$export$588937bcd60ade55(value) {
    let m = value.match($1b358053f79e3a77$var$DATE_TIME_RE);
    if (!m) {
        if ($1b358053f79e3a77$var$ABSOLUTE_RE.test(value)) throw new Error(`Invalid ISO 8601 date time string: ${value}. Use parseAbsolute() instead.`);
        throw new Error('Invalid ISO 8601 date time string: ' + value);
    }
    let year = $1b358053f79e3a77$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $c51b7e0106f45dea$exports.CalendarDateTime)(era, year < 1 ? -year + 1 : year, $1b358053f79e3a77$var$parseNumber(m[2], 1, 12), 1, m[4] ? $1b358053f79e3a77$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $1b358053f79e3a77$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $1b358053f79e3a77$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $1b358053f79e3a77$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $1b358053f79e3a77$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    return date;
}
function $1b358053f79e3a77$export$fd7893f06e92a6a4(value, disambiguation) {
    let m = value.match($1b358053f79e3a77$var$ZONED_DATE_TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let year = $1b358053f79e3a77$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $c51b7e0106f45dea$exports.ZonedDateTime)(era, year < 1 ? -year + 1 : year, $1b358053f79e3a77$var$parseNumber(m[2], 1, 12), 1, m[11], 0, m[4] ? $1b358053f79e3a77$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $1b358053f79e3a77$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $1b358053f79e3a77$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $1b358053f79e3a77$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $1b358053f79e3a77$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    let plainDateTime = (0, $e13115b3b86b9007$exports.toCalendarDateTime)(date);
    let ms;
    if (m[8]) {
        let hourOffset = $1b358053f79e3a77$var$parseNumber(m[8], -23, 23);
        date.offset = Math.sign(hourOffset) * (Math.abs(hourOffset) * 3600000 + $1b358053f79e3a77$var$parseNumber(m[9] ?? '0', 0, 59) * 60000 + $1b358053f79e3a77$var$parseNumber(m[10] ?? '0', 0, 59) * 1000);
        ms = (0, $e13115b3b86b9007$exports.epochFromDate)(date) - date.offset;
        // Validate offset against parsed date.
        let absolutes = (0, $e13115b3b86b9007$exports.possibleAbsolutes)(plainDateTime, date.timeZone);
        if (!absolutes.includes(ms)) throw new Error(`Offset ${$1b358053f79e3a77$var$offsetToString(date.offset)} is invalid for ${$1b358053f79e3a77$export$4223de14708adc63(date)} in ${date.timeZone}`);
    } else // Convert to absolute and back to fix invalid times due to DST.
    ms = (0, $e13115b3b86b9007$exports.toAbsolute)((0, $e13115b3b86b9007$exports.toCalendarDateTime)(plainDateTime), date.timeZone, disambiguation);
    return (0, $e13115b3b86b9007$exports.fromAbsolute)(ms, date.timeZone);
}
function $1b358053f79e3a77$export$5adfdab05168c219(value, timeZone) {
    let m = value.match($1b358053f79e3a77$var$ABSOLUTE_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let year = $1b358053f79e3a77$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $c51b7e0106f45dea$exports.ZonedDateTime)(era, year < 1 ? -year + 1 : year, $1b358053f79e3a77$var$parseNumber(m[2], 1, 12), 1, timeZone, 0, m[4] ? $1b358053f79e3a77$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $1b358053f79e3a77$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $1b358053f79e3a77$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $1b358053f79e3a77$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $1b358053f79e3a77$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    if (m[8]) date.offset = $1b358053f79e3a77$var$parseNumber(m[8], -23, 23) * 3600000 + $1b358053f79e3a77$var$parseNumber(m[9] ?? '0', 0, 59) * 60000;
    return (0, $e13115b3b86b9007$exports.toTimeZone)(date, timeZone);
}
function $1b358053f79e3a77$export$8e384432362ed0f0(value) {
    return $1b358053f79e3a77$export$5adfdab05168c219(value, (0, $84a63d30beb0af0f$exports.getLocalTimeZone)());
}
function $1b358053f79e3a77$var$parseNumber(value, min, max) {
    let val = Number(value);
    if (val < min || val > max) throw new RangeError(`Value out of range: ${min} <= ${val} <= ${max}`);
    return val;
}
function $1b358053f79e3a77$export$f59dee82248f5ad4(time) {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}${time.millisecond ? String(time.millisecond / 1000).slice(1) : ''}`;
}
function $1b358053f79e3a77$export$60dfd74aa96791bd(date) {
    let gregorianDate = (0, $e13115b3b86b9007$exports.toCalendar)(date, new (0, $05031860ba2f881f$exports.GregorianCalendar)());
    let year;
    if (gregorianDate.era === 'BC') year = gregorianDate.year === 1 ? '0000' : '-' + String(Math.abs(1 - gregorianDate.year)).padStart(6, '00');
    else year = String(gregorianDate.year).padStart(4, '0');
    return `${year}-${String(gregorianDate.month).padStart(2, '0')}-${String(gregorianDate.day).padStart(2, '0')}`;
}
function $1b358053f79e3a77$export$4223de14708adc63(date) {
    // @ts-ignore
    return `${$1b358053f79e3a77$export$60dfd74aa96791bd(date)}T${$1b358053f79e3a77$export$f59dee82248f5ad4(date)}`;
}
function $1b358053f79e3a77$var$offsetToString(offset) {
    let sign = Math.sign(offset) < 0 ? '-' : '+';
    offset = Math.abs(offset);
    let offsetHours = Math.floor(offset / 3600000);
    let offsetMinutes = Math.floor(offset % 3600000 / 60000);
    let offsetSeconds = Math.floor(offset % 3600000 % 60000 / 1000);
    let stringOffset = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    if (offsetSeconds !== 0) stringOffset += `:${String(offsetSeconds).padStart(2, '0')}`;
    return stringOffset;
}
function $1b358053f79e3a77$export$bf79f1ebf4b18792(date) {
    return `${$1b358053f79e3a77$export$4223de14708adc63(date)}${$1b358053f79e3a77$var$offsetToString(date.offset)}[${date.timeZone}]`;
}
function $1b358053f79e3a77$export$ecae829bb3747ea6(value) {
    const match = value.match($1b358053f79e3a77$var$DATE_TIME_DURATION_RE);
    if (!match) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    const parseDurationGroup = (group, isNegative)=>{
        if (!group) return 0;
        try {
            const sign = isNegative ? -1 : 1;
            return sign * Number(group.replace(',', '.'));
        } catch  {
            throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
        }
    };
    const isNegative = !!match.groups?.negative;
    const hasRequiredGroups = $1b358053f79e3a77$var$requiredDurationGroups.some((group)=>match.groups?.[group]);
    if (!hasRequiredGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    const durationStringIncludesTime = match.groups?.time;
    if (durationStringIncludesTime) {
        const hasRequiredDurationTimeGroups = $1b358053f79e3a77$var$requiredDurationTimeGroups.some((group)=>match.groups?.[group]);
        if (!hasRequiredDurationTimeGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    }
    const duration = {
        years: parseDurationGroup(match.groups?.years, isNegative),
        months: parseDurationGroup(match.groups?.months, isNegative),
        weeks: parseDurationGroup(match.groups?.weeks, isNegative),
        days: parseDurationGroup(match.groups?.days, isNegative),
        hours: parseDurationGroup(match.groups?.hours, isNegative),
        minutes: parseDurationGroup(match.groups?.minutes, isNegative),
        seconds: parseDurationGroup(match.groups?.seconds, isNegative)
    };
    if (duration.hours !== undefined && duration.hours % 1 !== 0 && (duration.minutes || duration.seconds)) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    if (duration.minutes !== undefined && duration.minutes % 1 !== 0 && duration.seconds) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    return duration;
}


//# sourceMappingURL=string.cjs.map
