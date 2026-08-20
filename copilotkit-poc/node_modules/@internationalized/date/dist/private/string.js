import {CalendarDate as $9a4e222e1bd2b190$export$99faa760c7908e4f, CalendarDateTime as $9a4e222e1bd2b190$export$ca871e8dbb80966f, Time as $9a4e222e1bd2b190$export$680ea196effce5f, ZonedDateTime as $9a4e222e1bd2b190$export$d3b7288e7994edea} from "./CalendarDate.js";
import {epochFromDate as $e83297bd1a9e3ddc$export$bd4fb2bc8bb06fb, fromAbsolute as $e83297bd1a9e3ddc$export$1b96692a1ba042ac, possibleAbsolutes as $e83297bd1a9e3ddc$export$136f38efe7caf549, toAbsolute as $e83297bd1a9e3ddc$export$5107c82f94518f5c, toCalendar as $e83297bd1a9e3ddc$export$b4a036af3fc0b032, toCalendarDateTime as $e83297bd1a9e3ddc$export$b21e0b124e224484, toTimeZone as $e83297bd1a9e3ddc$export$538b00033cc11c75} from "./conversion.js";
import {getLocalTimeZone as $8daeb11568269f24$export$aa8b41735afcabd2} from "./queries.js";
import {GregorianCalendar as $f25df78da1f6b40f$export$80ee6245ec4f29ec} from "./calendars/GregorianCalendar.js";

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



const $7dccf15509582627$var$TIME_RE = /^(\d{2})(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $7dccf15509582627$var$DATE_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})$/;
const $7dccf15509582627$var$DATE_TIME_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $7dccf15509582627$var$ZONED_DATE_TIME_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:([+-]\d{2})(?::?(\d{2}))?(?::?(\d{2}))?)?\[(.*?)\]$/;
const $7dccf15509582627$var$ABSOLUTE_RE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:(?:([+-]\d{2})(?::?(\d{2}))?)|Z)$/;
const $7dccf15509582627$var$DATE_TIME_DURATION_RE = /^((?<negative>-)|\+)?P((?<years>\d*)Y)?((?<months>\d*)M)?((?<weeks>\d*)W)?((?<days>\d*)D)?((?<time>T)((?<hours>\d*[.,]?\d{1,9})H)?((?<minutes>\d*[.,]?\d{1,9})M)?((?<seconds>\d*[.,]?\d{1,9})S)?)?$/;
const $7dccf15509582627$var$requiredDurationTimeGroups = [
    'hours',
    'minutes',
    'seconds'
];
const $7dccf15509582627$var$requiredDurationGroups = [
    'years',
    'months',
    'weeks',
    'days',
    ...$7dccf15509582627$var$requiredDurationTimeGroups
];
function $7dccf15509582627$export$c9698ec7f05a07e1(value) {
    let m = value.match($7dccf15509582627$var$TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 time string: ' + value);
    return new (0, $9a4e222e1bd2b190$export$680ea196effce5f)($7dccf15509582627$var$parseNumber(m[1], 0, 23), m[2] ? $7dccf15509582627$var$parseNumber(m[2], 0, 59) : 0, m[3] ? $7dccf15509582627$var$parseNumber(m[3], 0, 59) : 0, m[4] ? $7dccf15509582627$var$parseNumber(m[4], 0, Infinity) * 1000 : 0);
}
function $7dccf15509582627$export$6b862160d295c8e(value) {
    let m = value.match($7dccf15509582627$var$DATE_RE);
    if (!m) {
        if ($7dccf15509582627$var$ABSOLUTE_RE.test(value)) throw new Error(`Invalid ISO 8601 date string: ${value}. Use parseAbsolute() instead.`);
        throw new Error('Invalid ISO 8601 date string: ' + value);
    }
    let date = new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)($7dccf15509582627$var$parseNumber(m[1], 0, 9999), $7dccf15509582627$var$parseNumber(m[2], 1, 12), 1);
    date.day = $7dccf15509582627$var$parseNumber(m[3], 1, date.calendar.getDaysInMonth(date));
    return date;
}
function $7dccf15509582627$export$588937bcd60ade55(value) {
    let m = value.match($7dccf15509582627$var$DATE_TIME_RE);
    if (!m) {
        if ($7dccf15509582627$var$ABSOLUTE_RE.test(value)) throw new Error(`Invalid ISO 8601 date time string: ${value}. Use parseAbsolute() instead.`);
        throw new Error('Invalid ISO 8601 date time string: ' + value);
    }
    let year = $7dccf15509582627$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $9a4e222e1bd2b190$export$ca871e8dbb80966f)(era, year < 1 ? -year + 1 : year, $7dccf15509582627$var$parseNumber(m[2], 1, 12), 1, m[4] ? $7dccf15509582627$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $7dccf15509582627$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $7dccf15509582627$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $7dccf15509582627$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $7dccf15509582627$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    return date;
}
function $7dccf15509582627$export$fd7893f06e92a6a4(value, disambiguation) {
    let m = value.match($7dccf15509582627$var$ZONED_DATE_TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let year = $7dccf15509582627$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $9a4e222e1bd2b190$export$d3b7288e7994edea)(era, year < 1 ? -year + 1 : year, $7dccf15509582627$var$parseNumber(m[2], 1, 12), 1, m[11], 0, m[4] ? $7dccf15509582627$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $7dccf15509582627$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $7dccf15509582627$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $7dccf15509582627$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $7dccf15509582627$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    let plainDateTime = (0, $e83297bd1a9e3ddc$export$b21e0b124e224484)(date);
    let ms;
    if (m[8]) {
        let hourOffset = $7dccf15509582627$var$parseNumber(m[8], -23, 23);
        var _m_, _m_1;
        date.offset = Math.sign(hourOffset) * (Math.abs(hourOffset) * 3600000 + $7dccf15509582627$var$parseNumber((_m_ = m[9]) !== null && _m_ !== void 0 ? _m_ : '0', 0, 59) * 60000 + $7dccf15509582627$var$parseNumber((_m_1 = m[10]) !== null && _m_1 !== void 0 ? _m_1 : '0', 0, 59) * 1000);
        ms = (0, $e83297bd1a9e3ddc$export$bd4fb2bc8bb06fb)(date) - date.offset;
        // Validate offset against parsed date.
        let absolutes = (0, $e83297bd1a9e3ddc$export$136f38efe7caf549)(plainDateTime, date.timeZone);
        if (!absolutes.includes(ms)) throw new Error(`Offset ${$7dccf15509582627$var$offsetToString(date.offset)} is invalid for ${$7dccf15509582627$export$4223de14708adc63(date)} in ${date.timeZone}`);
    } else // Convert to absolute and back to fix invalid times due to DST.
    ms = (0, $e83297bd1a9e3ddc$export$5107c82f94518f5c)((0, $e83297bd1a9e3ddc$export$b21e0b124e224484)(plainDateTime), date.timeZone, disambiguation);
    return (0, $e83297bd1a9e3ddc$export$1b96692a1ba042ac)(ms, date.timeZone);
}
function $7dccf15509582627$export$5adfdab05168c219(value, timeZone) {
    let m = value.match($7dccf15509582627$var$ABSOLUTE_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let year = $7dccf15509582627$var$parseNumber(m[1], -9999, 9999);
    let era = year < 1 ? 'BC' : 'AD';
    let date = new (0, $9a4e222e1bd2b190$export$d3b7288e7994edea)(era, year < 1 ? -year + 1 : year, $7dccf15509582627$var$parseNumber(m[2], 1, 12), 1, timeZone, 0, m[4] ? $7dccf15509582627$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $7dccf15509582627$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $7dccf15509582627$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $7dccf15509582627$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $7dccf15509582627$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    var _m_;
    if (m[8]) date.offset = $7dccf15509582627$var$parseNumber(m[8], -23, 23) * 3600000 + $7dccf15509582627$var$parseNumber((_m_ = m[9]) !== null && _m_ !== void 0 ? _m_ : '0', 0, 59) * 60000;
    return (0, $e83297bd1a9e3ddc$export$538b00033cc11c75)(date, timeZone);
}
function $7dccf15509582627$export$8e384432362ed0f0(value) {
    return $7dccf15509582627$export$5adfdab05168c219(value, (0, $8daeb11568269f24$export$aa8b41735afcabd2)());
}
function $7dccf15509582627$var$parseNumber(value, min, max) {
    let val = Number(value);
    if (val < min || val > max) throw new RangeError(`Value out of range: ${min} <= ${val} <= ${max}`);
    return val;
}
function $7dccf15509582627$export$f59dee82248f5ad4(time) {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}${time.millisecond ? String(time.millisecond / 1000).slice(1) : ''}`;
}
function $7dccf15509582627$export$60dfd74aa96791bd(date) {
    let gregorianDate = (0, $e83297bd1a9e3ddc$export$b4a036af3fc0b032)(date, new (0, $f25df78da1f6b40f$export$80ee6245ec4f29ec)());
    let year;
    if (gregorianDate.era === 'BC') year = gregorianDate.year === 1 ? '0000' : '-' + String(Math.abs(1 - gregorianDate.year)).padStart(6, '00');
    else year = String(gregorianDate.year).padStart(4, '0');
    return `${year}-${String(gregorianDate.month).padStart(2, '0')}-${String(gregorianDate.day).padStart(2, '0')}`;
}
function $7dccf15509582627$export$4223de14708adc63(date) {
    // @ts-ignore
    return `${$7dccf15509582627$export$60dfd74aa96791bd(date)}T${$7dccf15509582627$export$f59dee82248f5ad4(date)}`;
}
function $7dccf15509582627$var$offsetToString(offset) {
    let sign = Math.sign(offset) < 0 ? '-' : '+';
    offset = Math.abs(offset);
    let offsetHours = Math.floor(offset / 3600000);
    let offsetMinutes = Math.floor(offset % 3600000 / 60000);
    let offsetSeconds = Math.floor(offset % 3600000 % 60000 / 1000);
    let stringOffset = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    if (offsetSeconds !== 0) stringOffset += `:${String(offsetSeconds).padStart(2, '0')}`;
    return stringOffset;
}
function $7dccf15509582627$export$bf79f1ebf4b18792(date) {
    return `${$7dccf15509582627$export$4223de14708adc63(date)}${$7dccf15509582627$var$offsetToString(date.offset)}[${date.timeZone}]`;
}
function $7dccf15509582627$export$ecae829bb3747ea6(value) {
    var _match_groups, _match_groups1, _match_groups2, _match_groups3, _match_groups4, _match_groups5, _match_groups6, _match_groups7, _match_groups8;
    const match = value.match($7dccf15509582627$var$DATE_TIME_DURATION_RE);
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
    const isNegative = !!((_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups.negative);
    const hasRequiredGroups = $7dccf15509582627$var$requiredDurationGroups.some((group)=>{
        var _match_groups;
        return (_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups[group];
    });
    if (!hasRequiredGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    const durationStringIncludesTime = (_match_groups1 = match.groups) === null || _match_groups1 === void 0 ? void 0 : _match_groups1.time;
    if (durationStringIncludesTime) {
        const hasRequiredDurationTimeGroups = $7dccf15509582627$var$requiredDurationTimeGroups.some((group)=>{
            var _match_groups;
            return (_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups[group];
        });
        if (!hasRequiredDurationTimeGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    }
    const duration = {
        years: parseDurationGroup((_match_groups2 = match.groups) === null || _match_groups2 === void 0 ? void 0 : _match_groups2.years, isNegative),
        months: parseDurationGroup((_match_groups3 = match.groups) === null || _match_groups3 === void 0 ? void 0 : _match_groups3.months, isNegative),
        weeks: parseDurationGroup((_match_groups4 = match.groups) === null || _match_groups4 === void 0 ? void 0 : _match_groups4.weeks, isNegative),
        days: parseDurationGroup((_match_groups5 = match.groups) === null || _match_groups5 === void 0 ? void 0 : _match_groups5.days, isNegative),
        hours: parseDurationGroup((_match_groups6 = match.groups) === null || _match_groups6 === void 0 ? void 0 : _match_groups6.hours, isNegative),
        minutes: parseDurationGroup((_match_groups7 = match.groups) === null || _match_groups7 === void 0 ? void 0 : _match_groups7.minutes, isNegative),
        seconds: parseDurationGroup((_match_groups8 = match.groups) === null || _match_groups8 === void 0 ? void 0 : _match_groups8.seconds, isNegative)
    };
    if (duration.hours !== undefined && duration.hours % 1 !== 0 && (duration.minutes || duration.seconds)) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    if (duration.minutes !== undefined && duration.minutes % 1 !== 0 && duration.seconds) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    return duration;
}


export {$7dccf15509582627$export$c9698ec7f05a07e1 as parseTime, $7dccf15509582627$export$6b862160d295c8e as parseDate, $7dccf15509582627$export$588937bcd60ade55 as parseDateTime, $7dccf15509582627$export$fd7893f06e92a6a4 as parseZonedDateTime, $7dccf15509582627$export$4223de14708adc63 as dateTimeToString, $7dccf15509582627$export$5adfdab05168c219 as parseAbsolute, $7dccf15509582627$export$8e384432362ed0f0 as parseAbsoluteToLocal, $7dccf15509582627$export$f59dee82248f5ad4 as timeToString, $7dccf15509582627$export$60dfd74aa96791bd as dateToString, $7dccf15509582627$export$bf79f1ebf4b18792 as zonedDateTimeToString, $7dccf15509582627$export$ecae829bb3747ea6 as parseDuration};
//# sourceMappingURL=string.js.map
