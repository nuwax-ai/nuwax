import {CalendarDate as $kk9Xk$CalendarDate} from "@internationalized/date";

/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
class $79f9316e7c43839c$export$ae165b50d181e1ef {
    copy() {
        let res = new $79f9316e7c43839c$export$ae165b50d181e1ef(this.calendar, this.hourCycle);
        res.era = this.era;
        res.year = this.year;
        res.month = this.month;
        res.day = this.day;
        res.hour = this.hour;
        res.dayPeriod = this.dayPeriod;
        res.minute = this.minute;
        res.second = this.second;
        res.millisecond = this.millisecond;
        res.offset = this.offset;
        return res;
    }
    /** Checks whether all the specified segments have a value. */ isComplete(segments) {
        return segments.every((segment)=>this[segment] != null);
    }
    /** Checks whether the given date value matches this value for the specified segments. */ validate(dt, segments) {
        return segments.every((segment)=>{
            if ((segment === 'hour' || segment === 'dayPeriod') && 'hour' in dt) {
                let [dayPeriod, hour] = $79f9316e7c43839c$var$toHourCycle(dt.hour, this.hourCycle);
                return this.dayPeriod === dayPeriod && this.hour === hour;
            }
            return this[segment] === dt[segment];
        });
    }
    /** Checks if the date is empty (i.e. all specified segments are null). */ isCleared(segments) {
        return segments.every((segment)=>this[segment] === null);
    }
    /** Sets the given field. */ set(field, value, placeholder) {
        let result = this.copy();
        result[field] = value;
        if (field === 'hour' && result.dayPeriod == null && 'hour' in placeholder) result.dayPeriod = $79f9316e7c43839c$var$toHourCycle(placeholder.hour, this.hourCycle)[0];
        if (field === 'year' && result.era == null) result.era = placeholder.era;
        // clear offset when a date/time field changes since it may no longer be valid
        if (field !== 'second' && field !== 'literal' && field !== 'timeZoneName') result.offset = null;
        return result;
    }
    /** Sets the given field to null. */ clear(field) {
        let result = this.copy();
        // @ts-ignore
        result[field] = null;
        if (field === 'year') result.era = null;
        // clear offset when a field is cleared since it may no longer be valid
        result.offset = null;
        return result;
    }
    /**
   * Increments or decrements the given field. If it is null, then it is set to the placeholder
   * value.
   */ cycle(field, amount, placeholder, displaySegments) {
        let res = this.copy();
        // If field is null, default to placeholder.
        if (res[field] == null && field !== 'dayPeriod' && field !== 'era') {
            if (field === 'hour' && 'hour' in placeholder) {
                let [dayPeriod, hour] = $79f9316e7c43839c$var$toHourCycle(placeholder.hour, this.hourCycle);
                res.dayPeriod = dayPeriod;
                res.hour = hour;
            } else res[field] = placeholder[field];
            if (field === 'year' && res.era == null) res.era = placeholder.era;
            return res;
        }
        switch(field){
            case 'era':
                {
                    let eras = this.calendar.getEras();
                    let index = eras.indexOf(res.era);
                    index = $79f9316e7c43839c$var$cycleValue(index, amount, 0, eras.length - 1);
                    res.era = eras[index];
                    break;
                }
            case 'year':
                {
                    var _this_era, _this_year, _this_month, _this_day;
                    // Use CalendarDate to cycle so that we update the era when going between 1 AD and 1 BC.
                    let date = new (0, $kk9Xk$CalendarDate)(this.calendar, (_this_era = this.era) !== null && _this_era !== void 0 ? _this_era : placeholder.era, (_this_year = this.year) !== null && _this_year !== void 0 ? _this_year : placeholder.year, (_this_month = this.month) !== null && _this_month !== void 0 ? _this_month : 1, (_this_day = this.day) !== null && _this_day !== void 0 ? _this_day : 1);
                    date = date.cycle(field, amount, {
                        round: field === 'year'
                    });
                    res.era = date.era;
                    res.year = date.year;
                    break;
                }
            case 'month':
                var _res_month;
                res.month = $79f9316e7c43839c$var$cycleValue((_res_month = res.month) !== null && _res_month !== void 0 ? _res_month : 1, amount, 1, this.calendar.getMaximumMonthsInYear());
                break;
            case 'day':
                var _res_day;
                // Allow incrementing up to the maximum number of days in any month.
                res.day = $79f9316e7c43839c$var$cycleValue((_res_day = res.day) !== null && _res_day !== void 0 ? _res_day : 1, amount, 1, this.calendar.getMaximumDaysInMonth());
                break;
            case 'hour':
                {
                    // if date is fully defined or it is just a time field, and we have a time zone, use toValue to get a ZonedDateTime to cycle
                    // so DST fallback is properly handled
                    let hasDateSegements = displaySegments.some((s)=>[
                            'year',
                            'month',
                            'day'
                        ].includes(s));
                    if ('timeZone' in placeholder && (!hasDateSegements || res.year != null && res.month != null && res.day != null)) {
                        let date = this.toValue(placeholder);
                        date = date.cycle('hour', amount, {
                            hourCycle: this.hourCycle === 'h12' ? 12 : 24,
                            round: false
                        });
                        let [dayPeriod, adjustedHour] = $79f9316e7c43839c$var$toHourCycle(date.hour, this.hourCycle);
                        res.hour = adjustedHour;
                        res.dayPeriod = dayPeriod;
                        res.offset = date.offset;
                    } else {
                        var _res_hour;
                        let hours = (_res_hour = res.hour) !== null && _res_hour !== void 0 ? _res_hour : 0;
                        let limits = this.getSegmentLimits('hour');
                        res.hour = $79f9316e7c43839c$var$cycleValue(hours, amount, limits.minValue, limits.maxValue);
                        if (res.dayPeriod == null && 'hour' in placeholder) res.dayPeriod = $79f9316e7c43839c$var$toHourCycle(placeholder.hour, this.hourCycle)[0];
                    }
                    break;
                }
            case 'dayPeriod':
                var _res_dayPeriod;
                res.dayPeriod = $79f9316e7c43839c$var$cycleValue((_res_dayPeriod = res.dayPeriod) !== null && _res_dayPeriod !== void 0 ? _res_dayPeriod : 0, amount, 0, 1);
                break;
            case 'minute':
                var _res_minute;
                res.minute = $79f9316e7c43839c$var$cycleValue((_res_minute = res.minute) !== null && _res_minute !== void 0 ? _res_minute : 0, amount, 0, 59, true);
                break;
            case 'second':
                var _res_second;
                res.second = $79f9316e7c43839c$var$cycleValue((_res_second = res.second) !== null && _res_second !== void 0 ? _res_second : 0, amount, 0, 59, true);
                break;
        }
        return res;
    }
    /**
   * Converts the incomplete date to a full date value, using the provided value for any unset
   * fields.
   */ toValue(value) {
        var _this_era, _this_year, _this_month, _this_day;
        if ('hour' in value) {
            let hour = this.hour;
            var _this_dayPeriod;
            if (hour != null) hour = $79f9316e7c43839c$var$fromHourCycle(hour, (_this_dayPeriod = this.dayPeriod) !== null && _this_dayPeriod !== void 0 ? _this_dayPeriod : 0, this.hourCycle);
            else if (this.hourCycle === 'h12' || this.hourCycle === 'h11') hour = this.dayPeriod === 1 ? 12 : 0;
            var _this_era1, _this_year1, _this_month1, _this_day1, _this_minute, _this_second, _this_millisecond;
            let res = value.set({
                era: (_this_era1 = this.era) !== null && _this_era1 !== void 0 ? _this_era1 : value.era,
                year: (_this_year1 = this.year) !== null && _this_year1 !== void 0 ? _this_year1 : value.year,
                month: (_this_month1 = this.month) !== null && _this_month1 !== void 0 ? _this_month1 : value.month,
                day: (_this_day1 = this.day) !== null && _this_day1 !== void 0 ? _this_day1 : value.day,
                hour: hour !== null && hour !== void 0 ? hour : value.hour,
                minute: (_this_minute = this.minute) !== null && _this_minute !== void 0 ? _this_minute : value.minute,
                second: (_this_second = this.second) !== null && _this_second !== void 0 ? _this_second : value.second,
                millisecond: (_this_millisecond = this.millisecond) !== null && _this_millisecond !== void 0 ? _this_millisecond : value.millisecond
            });
            if ('offset' in res && this.offset != null && res.offset !== this.offset) res = res.add({
                milliseconds: res.offset - this.offset
            });
            return res;
        } else return value.set({
            era: (_this_era = this.era) !== null && _this_era !== void 0 ? _this_era : value.era,
            year: (_this_year = this.year) !== null && _this_year !== void 0 ? _this_year : value.year,
            month: (_this_month = this.month) !== null && _this_month !== void 0 ? _this_month : value.month,
            day: (_this_day = this.day) !== null && _this_day !== void 0 ? _this_day : value.day
        });
    }
    getSegmentLimits(type) {
        switch(type){
            case 'era':
                {
                    let eras = this.calendar.getEras();
                    return {
                        value: this.era != null ? eras.indexOf(this.era) : eras.length - 1,
                        minValue: 0,
                        maxValue: eras.length - 1
                    };
                }
            case 'year':
                return {
                    value: this.year,
                    minValue: 1,
                    maxValue: 9999
                };
            case 'month':
                return {
                    value: this.month,
                    minValue: 1,
                    maxValue: this.calendar.getMaximumMonthsInYear()
                };
            case 'day':
                return {
                    value: this.day,
                    minValue: 1,
                    maxValue: this.calendar.getMaximumDaysInMonth()
                };
            case 'dayPeriod':
                return {
                    value: this.dayPeriod,
                    minValue: 0,
                    maxValue: 1
                };
            case 'hour':
                {
                    let minValue = 0;
                    let maxValue = 23;
                    if (this.hourCycle === 'h12') {
                        minValue = 1;
                        maxValue = 12;
                    } else if (this.hourCycle === 'h11') {
                        minValue = 0;
                        maxValue = 11;
                    }
                    return {
                        value: this.hour,
                        minValue: minValue,
                        maxValue: maxValue
                    };
                }
            case 'minute':
                return {
                    value: this.minute,
                    minValue: 0,
                    maxValue: 59
                };
            case 'second':
                return {
                    value: this.second,
                    minValue: 0,
                    maxValue: 59
                };
        }
    }
    constructor(calendar, hourCycle, dateValue){
        var _dateValue_era;
        this.era = (_dateValue_era = dateValue === null || dateValue === void 0 ? void 0 : dateValue.era) !== null && _dateValue_era !== void 0 ? _dateValue_era : null;
        this.calendar = calendar;
        var _dateValue_year;
        this.year = (_dateValue_year = dateValue === null || dateValue === void 0 ? void 0 : dateValue.year) !== null && _dateValue_year !== void 0 ? _dateValue_year : null;
        var _dateValue_month;
        this.month = (_dateValue_month = dateValue === null || dateValue === void 0 ? void 0 : dateValue.month) !== null && _dateValue_month !== void 0 ? _dateValue_month : null;
        var _dateValue_day;
        this.day = (_dateValue_day = dateValue === null || dateValue === void 0 ? void 0 : dateValue.day) !== null && _dateValue_day !== void 0 ? _dateValue_day : null;
        var _dateValue_hour;
        this.hour = (_dateValue_hour = dateValue === null || dateValue === void 0 ? void 0 : dateValue.hour) !== null && _dateValue_hour !== void 0 ? _dateValue_hour : null;
        this.hourCycle = hourCycle;
        this.dayPeriod = null;
        var _dateValue_minute;
        this.minute = (_dateValue_minute = dateValue === null || dateValue === void 0 ? void 0 : dateValue.minute) !== null && _dateValue_minute !== void 0 ? _dateValue_minute : null;
        var _dateValue_second;
        this.second = (_dateValue_second = dateValue === null || dateValue === void 0 ? void 0 : dateValue.second) !== null && _dateValue_second !== void 0 ? _dateValue_second : null;
        var _dateValue_millisecond;
        this.millisecond = (_dateValue_millisecond = dateValue === null || dateValue === void 0 ? void 0 : dateValue.millisecond) !== null && _dateValue_millisecond !== void 0 ? _dateValue_millisecond : null;
        this.offset = 'offset' in (dateValue !== null && dateValue !== void 0 ? dateValue : {}) ? dateValue.offset : null;
        // Convert the hour from 24 hour time to the given hour cycle.
        if (this.hour != null) {
            let [dayPeriod, hour] = $79f9316e7c43839c$var$toHourCycle(this.hour, hourCycle);
            this.dayPeriod = dayPeriod;
            this.hour = hour;
        }
    }
}
function $79f9316e7c43839c$var$cycleValue(value, amount, min, max, round = false) {
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
function $79f9316e7c43839c$var$toHourCycle(hour, hourCycle) {
    let dayPeriod = hour >= 12 ? 1 : 0;
    switch(hourCycle){
        case 'h11':
            // Hours are numbered from 0 to 11. Used in Japan.
            if (hour >= 12) hour -= 12;
            break;
        case 'h12':
            // Hours are numbered from 12 (representing 0) to 11.
            if (hour === 0) hour = 12;
            else if (hour > 12) hour -= 12;
            break;
        case 'h23':
            // 24 hour time, numbered 0 to 23.
            dayPeriod = null;
            break;
        case 'h24':
            // 24 hour time numbered 24 to 23. Unused but supported by Intl.DateTimeFormat.
            hour += 1;
            dayPeriod = null;
    }
    return [
        dayPeriod,
        hour
    ];
}
function $79f9316e7c43839c$var$fromHourCycle(hour, dayPeriod, hourCycle) {
    switch(hourCycle){
        case 'h11':
            if (dayPeriod === 1) hour += 12;
            break;
        case 'h12':
            if (hour === 12) hour = 0;
            if (dayPeriod === 1) hour += 12;
            break;
        case 'h24':
            hour -= 1;
            break;
    }
    return hour;
}


export {$79f9316e7c43839c$export$ae165b50d181e1ef as IncompleteDate};
//# sourceMappingURL=IncompleteDate.js.map
