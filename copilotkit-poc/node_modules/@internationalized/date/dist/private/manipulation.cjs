var $e13115b3b86b9007$exports = require("./conversion.cjs");
var $05031860ba2f881f$exports = require("./calendars/GregorianCalendar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "add", function () { return $19485913bea41f19$export$e16d8520af44a096; });
$parcel$export(module.exports, "constrain", function () { return $19485913bea41f19$export$c4e2ecac49351ef2; });
$parcel$export(module.exports, "subtract", function () { return $19485913bea41f19$export$4e2d2ead65e5f7e3; });
$parcel$export(module.exports, "set", function () { return $19485913bea41f19$export$adaa4cf7ef1b65be; });
$parcel$export(module.exports, "setTime", function () { return $19485913bea41f19$export$e5d5e1c1822b6e56; });
$parcel$export(module.exports, "constrainTime", function () { return $19485913bea41f19$export$7555de1e070510cb; });
$parcel$export(module.exports, "addTime", function () { return $19485913bea41f19$export$7ed87b6bc2506470; });
$parcel$export(module.exports, "subtractTime", function () { return $19485913bea41f19$export$fe34d3a381cd7501; });
$parcel$export(module.exports, "cycleDate", function () { return $19485913bea41f19$export$d52ced6badfb9a4c; });
$parcel$export(module.exports, "cycleTime", function () { return $19485913bea41f19$export$dd02b3e0007dfe28; });
$parcel$export(module.exports, "addZoned", function () { return $19485913bea41f19$export$96b1d28349274637; });
$parcel$export(module.exports, "subtractZoned", function () { return $19485913bea41f19$export$6814caac34ca03c7; });
$parcel$export(module.exports, "cycleZoned", function () { return $19485913bea41f19$export$9a297d111fc86b79; });
$parcel$export(module.exports, "setZoned", function () { return $19485913bea41f19$export$31b5430eb18be4f8; });
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

const $19485913bea41f19$var$ONE_HOUR = 3600000;
function $19485913bea41f19$export$e16d8520af44a096(date, duration) {
    let mutableDate = date.copy();
    let days = 'hour' in mutableDate ? $19485913bea41f19$var$addTimeFields(mutableDate, duration) : 0;
    $19485913bea41f19$var$addYears(mutableDate, duration.years || 0);
    if (mutableDate.calendar.balanceYearMonth) mutableDate.calendar.balanceYearMonth(mutableDate, date);
    mutableDate.month += duration.months || 0;
    $19485913bea41f19$var$balanceYearMonth(mutableDate);
    $19485913bea41f19$var$constrainMonthDay(mutableDate);
    mutableDate.day += (duration.weeks || 0) * 7;
    mutableDate.day += duration.days || 0;
    mutableDate.day += days;
    $19485913bea41f19$var$balanceDay(mutableDate);
    if (mutableDate.calendar.balanceDate) mutableDate.calendar.balanceDate(mutableDate);
    // Constrain in case adding ended up with a date outside the valid range for the calendar system.
    // The behavior here is slightly different than when constraining in the `set` function in that
    // we adjust smaller fields to their minimum/maximum values rather than constraining each field
    // individually. This matches the general behavior of `add` vs `set` regarding how fields are balanced.
    if (mutableDate.year < 1) {
        mutableDate.year = 1;
        mutableDate.month = 1;
        mutableDate.day = 1;
    }
    let maxYear = mutableDate.calendar.getYearsInEra(mutableDate);
    if (mutableDate.year > maxYear) {
        let isInverseEra = mutableDate.calendar.isInverseEra?.(mutableDate);
        mutableDate.year = maxYear;
        mutableDate.month = isInverseEra ? 1 : mutableDate.calendar.getMonthsInYear(mutableDate);
        mutableDate.day = isInverseEra ? 1 : mutableDate.calendar.getDaysInMonth(mutableDate);
    }
    if (mutableDate.month < 1) {
        mutableDate.month = 1;
        mutableDate.day = 1;
    }
    let maxMonth = mutableDate.calendar.getMonthsInYear(mutableDate);
    if (mutableDate.month > maxMonth) {
        mutableDate.month = maxMonth;
        mutableDate.day = mutableDate.calendar.getDaysInMonth(mutableDate);
    }
    mutableDate.day = Math.max(1, Math.min(mutableDate.calendar.getDaysInMonth(mutableDate), mutableDate.day));
    return mutableDate;
}
function $19485913bea41f19$var$addYears(date, years) {
    if (date.calendar.isInverseEra?.(date)) years = -years;
    date.year += years;
}
function $19485913bea41f19$var$balanceYearMonth(date) {
    while(date.month < 1){
        $19485913bea41f19$var$addYears(date, -1);
        date.month += date.calendar.getMonthsInYear(date);
    }
    let monthsInYear = 0;
    while(date.month > (monthsInYear = date.calendar.getMonthsInYear(date))){
        date.month -= monthsInYear;
        $19485913bea41f19$var$addYears(date, 1);
    }
}
function $19485913bea41f19$var$balanceDay(date) {
    while(date.day < 1){
        date.month--;
        $19485913bea41f19$var$balanceYearMonth(date);
        date.day += date.calendar.getDaysInMonth(date);
    }
    while(date.day > date.calendar.getDaysInMonth(date)){
        date.day -= date.calendar.getDaysInMonth(date);
        date.month++;
        $19485913bea41f19$var$balanceYearMonth(date);
    }
}
function $19485913bea41f19$var$constrainMonthDay(date) {
    date.month = Math.max(1, Math.min(date.calendar.getMonthsInYear(date), date.month));
    date.day = Math.max(1, Math.min(date.calendar.getDaysInMonth(date), date.day));
}
function $19485913bea41f19$export$c4e2ecac49351ef2(date) {
    if (date.calendar.constrainDate) date.calendar.constrainDate(date);
    date.year = Math.max(1, Math.min(date.calendar.getYearsInEra(date), date.year));
    $19485913bea41f19$var$constrainMonthDay(date);
}
function $19485913bea41f19$export$3e2544e88a25bff8(duration) {
    let inverseDuration = {};
    for(let key in duration)if (typeof duration[key] === 'number') inverseDuration[key] = -duration[key];
    return inverseDuration;
}
function $19485913bea41f19$export$4e2d2ead65e5f7e3(date, duration) {
    return $19485913bea41f19$export$e16d8520af44a096(date, $19485913bea41f19$export$3e2544e88a25bff8(duration));
}
function $19485913bea41f19$export$adaa4cf7ef1b65be(date, fields) {
    let mutableDate = date.copy();
    if (fields.era != null) mutableDate.era = fields.era;
    if (fields.year != null) mutableDate.year = fields.year;
    if (fields.month != null) mutableDate.month = fields.month;
    if (fields.day != null) mutableDate.day = fields.day;
    $19485913bea41f19$export$c4e2ecac49351ef2(mutableDate);
    return mutableDate;
}
function $19485913bea41f19$export$e5d5e1c1822b6e56(value, fields) {
    let mutableValue = value.copy();
    if (fields.hour != null) mutableValue.hour = fields.hour;
    if (fields.minute != null) mutableValue.minute = fields.minute;
    if (fields.second != null) mutableValue.second = fields.second;
    if (fields.millisecond != null) mutableValue.millisecond = fields.millisecond;
    $19485913bea41f19$export$7555de1e070510cb(mutableValue);
    return mutableValue;
}
function $19485913bea41f19$var$balanceTime(time) {
    time.second += Math.floor(time.millisecond / 1000);
    time.millisecond = $19485913bea41f19$var$nonNegativeMod(time.millisecond, 1000);
    time.minute += Math.floor(time.second / 60);
    time.second = $19485913bea41f19$var$nonNegativeMod(time.second, 60);
    time.hour += Math.floor(time.minute / 60);
    time.minute = $19485913bea41f19$var$nonNegativeMod(time.minute, 60);
    let days = Math.floor(time.hour / 24);
    time.hour = $19485913bea41f19$var$nonNegativeMod(time.hour, 24);
    return days;
}
function $19485913bea41f19$export$7555de1e070510cb(time) {
    time.millisecond = Math.max(0, Math.min(time.millisecond, 1000));
    time.second = Math.max(0, Math.min(time.second, 59));
    time.minute = Math.max(0, Math.min(time.minute, 59));
    time.hour = Math.max(0, Math.min(time.hour, 23));
}
function $19485913bea41f19$var$nonNegativeMod(a, b) {
    let result = a % b;
    if (result < 0) result += b;
    return result;
}
function $19485913bea41f19$var$addTimeFields(time, duration) {
    time.hour += duration.hours || 0;
    time.minute += duration.minutes || 0;
    time.second += duration.seconds || 0;
    time.millisecond += duration.milliseconds || 0;
    return $19485913bea41f19$var$balanceTime(time);
}
function $19485913bea41f19$export$7ed87b6bc2506470(time, duration) {
    let res = time.copy();
    $19485913bea41f19$var$addTimeFields(res, duration);
    return res;
}
function $19485913bea41f19$export$fe34d3a381cd7501(time, duration) {
    return $19485913bea41f19$export$7ed87b6bc2506470(time, $19485913bea41f19$export$3e2544e88a25bff8(duration));
}
function $19485913bea41f19$export$d52ced6badfb9a4c(value, field, amount, options) {
    let mutable = value.copy();
    switch(field){
        case 'era':
            {
                let eras = value.calendar.getEras();
                let eraIndex = eras.indexOf(value.era);
                if (eraIndex < 0) throw new Error('Invalid era: ' + value.era);
                eraIndex = $19485913bea41f19$var$cycleValue(eraIndex, amount, 0, eras.length - 1, options?.round);
                mutable.era = eras[eraIndex];
                // Constrain the year and other fields within the era, so the era doesn't change when we balance below.
                $19485913bea41f19$export$c4e2ecac49351ef2(mutable);
                break;
            }
        case 'year':
            if (mutable.calendar.isInverseEra?.(mutable)) amount = -amount;
            // The year field should not cycle within the era as that can cause weird behavior affecting other fields.
            // We need to also allow values < 1 so that decrementing goes to the previous era. If we get -Infinity back
            // we know we wrapped around after reaching 9999 (the maximum), so set the year back to 1.
            mutable.year = $19485913bea41f19$var$cycleValue(value.year, amount, -Infinity, 9999, options?.round);
            if (mutable.year === -Infinity) mutable.year = 1;
            if (mutable.calendar.balanceYearMonth) mutable.calendar.balanceYearMonth(mutable, value);
            break;
        case 'month':
            mutable.month = $19485913bea41f19$var$cycleValue(value.month, amount, 1, value.calendar.getMonthsInYear(value), options?.round);
            break;
        case 'day':
            mutable.day = $19485913bea41f19$var$cycleValue(value.day, amount, 1, value.calendar.getDaysInMonth(value), options?.round);
            break;
        default:
            throw new Error('Unsupported field ' + field);
    }
    if (value.calendar.balanceDate) value.calendar.balanceDate(mutable);
    $19485913bea41f19$export$c4e2ecac49351ef2(mutable);
    return mutable;
}
function $19485913bea41f19$export$dd02b3e0007dfe28(value, field, amount, options) {
    let mutable = value.copy();
    switch(field){
        case 'hour':
            {
                let hours = value.hour;
                let min = 0;
                let max = 23;
                if (options?.hourCycle === 12) {
                    let isPM = hours >= 12;
                    min = isPM ? 12 : 0;
                    max = isPM ? 23 : 11;
                }
                mutable.hour = $19485913bea41f19$var$cycleValue(hours, amount, min, max, options?.round);
                break;
            }
        case 'minute':
            mutable.minute = $19485913bea41f19$var$cycleValue(value.minute, amount, 0, 59, options?.round);
            break;
        case 'second':
            mutable.second = $19485913bea41f19$var$cycleValue(value.second, amount, 0, 59, options?.round);
            break;
        case 'millisecond':
            mutable.millisecond = $19485913bea41f19$var$cycleValue(value.millisecond, amount, 0, 999, options?.round);
            break;
        default:
            throw new Error('Unsupported field ' + field);
    }
    return mutable;
}
function $19485913bea41f19$var$cycleValue(value, amount, min, max, round = false) {
    if (round) {
        value += Math.sign(amount);
        if (value < min) value = max;
        let div = Math.abs(amount);
        if (amount > 0) value = Math.ceil(value / div) * div;
        else value = Math.floor(value / div) * div;
        if (value > max) value = min;
    } else {
        value += amount;
        if (value < min) value = max - (min - value - 1);
        else if (value > max) value = min + (value - max - 1);
    }
    return value;
}
function $19485913bea41f19$export$96b1d28349274637(dateTime, duration) {
    let ms;
    if (duration.years != null && duration.years !== 0 || duration.months != null && duration.months !== 0 || duration.weeks != null && duration.weeks !== 0 || duration.days != null && duration.days !== 0) {
        let res = $19485913bea41f19$export$e16d8520af44a096((0, $e13115b3b86b9007$exports.toCalendarDateTime)(dateTime), {
            years: duration.years,
            months: duration.months,
            weeks: duration.weeks,
            days: duration.days
        });
        // Changing the date may change the timezone offset, so we need to recompute
        // using the 'compatible' disambiguation.
        ms = (0, $e13115b3b86b9007$exports.toAbsolute)(res, dateTime.timeZone);
    } else // Otherwise, preserve the offset of the original date.
    ms = (0, $e13115b3b86b9007$exports.epochFromDate)(dateTime) - dateTime.offset;
    // Perform time manipulation in milliseconds rather than on the original time fields to account for DST.
    // For example, adding one hour during a DST transition may result in the hour field staying the same or
    // skipping an hour. This results in the offset field changing value instead of the specified field.
    ms += duration.milliseconds || 0;
    ms += (duration.seconds || 0) * 1000;
    ms += (duration.minutes || 0) * 60000;
    ms += (duration.hours || 0) * 3600000;
    let res = (0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone);
    return (0, $e13115b3b86b9007$exports.toCalendar)(res, dateTime.calendar);
}
function $19485913bea41f19$export$6814caac34ca03c7(dateTime, duration) {
    return $19485913bea41f19$export$96b1d28349274637(dateTime, $19485913bea41f19$export$3e2544e88a25bff8(duration));
}
function $19485913bea41f19$export$9a297d111fc86b79(dateTime, field, amount, options) {
    // For date fields, we want the time to remain consistent and the UTC offset to potentially change to account for DST changes.
    // For time fields, we want the time to change by the amount given. This may result in the hour field staying the same, but the UTC
    // offset changing in the case of a backward DST transition, or skipping an hour in the case of a forward DST transition.
    switch(field){
        case 'hour':
            {
                let min = 0;
                let max = 23;
                if (options?.hourCycle === 12) {
                    let isPM = dateTime.hour >= 12;
                    min = isPM ? 12 : 0;
                    max = isPM ? 23 : 11;
                }
                // The minimum and maximum hour may be affected by daylight saving time.
                // For example, it might jump forward at midnight, and skip 1am.
                // Or it might end at midnight and repeat the 11pm hour. To handle this, we get
                // the possible absolute times for the min and max, and find the maximum range
                // that is within the current day.
                let plainDateTime = (0, $e13115b3b86b9007$exports.toCalendarDateTime)(dateTime);
                let minDate = (0, $e13115b3b86b9007$exports.toCalendar)($19485913bea41f19$export$e5d5e1c1822b6e56(plainDateTime, {
                    hour: min
                }), new (0, $05031860ba2f881f$exports.GregorianCalendar)());
                let minAbsolute = [
                    (0, $e13115b3b86b9007$exports.toAbsolute)(minDate, dateTime.timeZone, 'earlier'),
                    (0, $e13115b3b86b9007$exports.toAbsolute)(minDate, dateTime.timeZone, 'later')
                ].filter((ms)=>(0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone).day === minDate.day)[0];
                let maxDate = (0, $e13115b3b86b9007$exports.toCalendar)($19485913bea41f19$export$e5d5e1c1822b6e56(plainDateTime, {
                    hour: max
                }), new (0, $05031860ba2f881f$exports.GregorianCalendar)());
                let maxAbsolute = [
                    (0, $e13115b3b86b9007$exports.toAbsolute)(maxDate, dateTime.timeZone, 'earlier'),
                    (0, $e13115b3b86b9007$exports.toAbsolute)(maxDate, dateTime.timeZone, 'later')
                ].filter((ms)=>(0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone).day === maxDate.day).pop();
                // Since hours may repeat, we need to operate on the absolute time in milliseconds.
                // This is done in hours from the Unix epoch so that cycleValue works correctly,
                // and then converted back to milliseconds.
                let ms = (0, $e13115b3b86b9007$exports.epochFromDate)(dateTime) - dateTime.offset;
                let hours = Math.floor(ms / $19485913bea41f19$var$ONE_HOUR);
                let remainder = ms % $19485913bea41f19$var$ONE_HOUR;
                ms = $19485913bea41f19$var$cycleValue(hours, amount, Math.floor(minAbsolute / $19485913bea41f19$var$ONE_HOUR), Math.floor(maxAbsolute / $19485913bea41f19$var$ONE_HOUR), options?.round) * $19485913bea41f19$var$ONE_HOUR + remainder;
                // Now compute the new timezone offset, and convert the absolute time back to local time.
                return (0, $e13115b3b86b9007$exports.toCalendar)((0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone), dateTime.calendar);
            }
        case 'minute':
        case 'second':
        case 'millisecond':
            // @ts-ignore
            return $19485913bea41f19$export$dd02b3e0007dfe28(dateTime, field, amount, options);
        case 'era':
        case 'year':
        case 'month':
        case 'day':
            {
                let res = $19485913bea41f19$export$d52ced6badfb9a4c((0, $e13115b3b86b9007$exports.toCalendarDateTime)(dateTime), field, amount, options);
                let ms = (0, $e13115b3b86b9007$exports.toAbsolute)(res, dateTime.timeZone);
                return (0, $e13115b3b86b9007$exports.toCalendar)((0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone), dateTime.calendar);
            }
        default:
            throw new Error('Unsupported field ' + field);
    }
}
function $19485913bea41f19$export$31b5430eb18be4f8(dateTime, fields, disambiguation) {
    // Set the date/time fields, and recompute the UTC offset to account for DST changes.
    // We also need to validate by converting back to a local time in case hours are skipped during forward DST transitions.
    let plainDateTime = (0, $e13115b3b86b9007$exports.toCalendarDateTime)(dateTime);
    let res = $19485913bea41f19$export$e5d5e1c1822b6e56($19485913bea41f19$export$adaa4cf7ef1b65be(plainDateTime, fields), fields);
    // If the resulting plain date time values are equal, return the original time.
    // We don't want to change the offset when setting the time to the same value.
    if (res.compare(plainDateTime) === 0) return dateTime;
    let ms = (0, $e13115b3b86b9007$exports.toAbsolute)(res, dateTime.timeZone, disambiguation);
    return (0, $e13115b3b86b9007$exports.toCalendar)((0, $e13115b3b86b9007$exports.fromAbsolute)(ms, dateTime.timeZone), dateTime.calendar);
}


//# sourceMappingURL=manipulation.cjs.map
