var $19485913bea41f19$exports = require("./manipulation.cjs");
var $84a63d30beb0af0f$exports = require("./queries.cjs");
var $1b358053f79e3a77$exports = require("./string.cjs");
var $05031860ba2f881f$exports = require("./calendars/GregorianCalendar.cjs");
var $e13115b3b86b9007$exports = require("./conversion.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "CalendarDate", function () { return $c51b7e0106f45dea$export$99faa760c7908e4f; });
$parcel$export(module.exports, "Time", function () { return $c51b7e0106f45dea$export$680ea196effce5f; });
$parcel$export(module.exports, "CalendarDateTime", function () { return $c51b7e0106f45dea$export$ca871e8dbb80966f; });
$parcel$export(module.exports, "ZonedDateTime", function () { return $c51b7e0106f45dea$export$d3b7288e7994edea; });
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




function $c51b7e0106f45dea$var$shiftArgs(args) {
    let calendar = typeof args[0] === 'object' ? args.shift() : new (0, $05031860ba2f881f$exports.GregorianCalendar)();
    let era;
    if (typeof args[0] === 'string') era = args.shift();
    else {
        let eras = calendar.getEras();
        era = eras[eras.length - 1];
    }
    let year = args.shift();
    let month = args.shift();
    let day = args.shift();
    return [
        calendar,
        era,
        year,
        month,
        day
    ];
}
class $c51b7e0106f45dea$export$99faa760c7908e4f {
    // This prevents TypeScript from allowing other types with the same fields to match.
    // i.e. a ZonedDateTime should not be be passable to a parameter that expects CalendarDate.
    // If that behavior is desired, use the AnyCalendarDate interface instead.
    // @ts-ignore
    #type;
    constructor(...args){
        let [calendar, era, year, month, day] = $c51b7e0106f45dea$var$shiftArgs(args);
        this.calendar = calendar;
        this.era = era;
        this.year = year;
        this.month = month;
        this.day = day;
        (0, $19485913bea41f19$exports.constrain)(this);
    }
    /** Returns a copy of this date. */ copy() {
        if (this.era) return new $c51b7e0106f45dea$export$99faa760c7908e4f(this.calendar, this.era, this.year, this.month, this.day);
        else return new $c51b7e0106f45dea$export$99faa760c7908e4f(this.calendar, this.year, this.month, this.day);
    }
    /** Returns a new `CalendarDate` with the given duration added to it. */ add(duration) {
        return (0, $19485913bea41f19$exports.add)(this, duration);
    }
    /** Returns a new `CalendarDate` with the given duration subtracted from it. */ subtract(duration) {
        return (0, $19485913bea41f19$exports.subtract)(this, duration);
    }
    /**
   * Returns a new `CalendarDate` with the given fields set to the provided values. Other fields
   * will be constrained accordingly.
   */ set(fields) {
        return (0, $19485913bea41f19$exports.set)(this, fields);
    }
    /**
   * Returns a new `CalendarDate` with the given field adjusted by a specified amount.
   * When the resulting value reaches the limits of the field, it wraps around.
   */ cycle(field, amount, options) {
        return (0, $19485913bea41f19$exports.cycleDate)(this, field, amount, options);
    }
    /**
   * Converts the date to a native JavaScript Date object, with the time set to midnight in the
   * given time zone.
   */ toDate(timeZone) {
        return (0, $e13115b3b86b9007$exports.toDate)(this, timeZone);
    }
    /** Converts the date to an ISO 8601 formatted string. */ toString() {
        return (0, $1b358053f79e3a77$exports.dateToString)(this);
    }
    /**
   * Compares this date with another. A negative result indicates that this date is before the given
   * one, and a positive date indicates that it is after.
   */ compare(b) {
        return (0, $84a63d30beb0af0f$exports.compareDate)(this, b);
    }
}
class $c51b7e0106f45dea$export$680ea196effce5f {
    // This prevents TypeScript from allowing other types with the same fields to match.
    // @ts-ignore
    #type;
    constructor(hour = 0, minute = 0, second = 0, millisecond = 0){
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millisecond = millisecond;
        (0, $19485913bea41f19$exports.constrainTime)(this);
    }
    /** Returns a copy of this time. */ copy() {
        return new $c51b7e0106f45dea$export$680ea196effce5f(this.hour, this.minute, this.second, this.millisecond);
    }
    /** Returns a new `Time` with the given duration added to it. */ add(duration) {
        return (0, $19485913bea41f19$exports.addTime)(this, duration);
    }
    /** Returns a new `Time` with the given duration subtracted from it. */ subtract(duration) {
        return (0, $19485913bea41f19$exports.subtractTime)(this, duration);
    }
    /**
   * Returns a new `Time` with the given fields set to the provided values. Other fields will be
   * constrained accordingly.
   */ set(fields) {
        return (0, $19485913bea41f19$exports.setTime)(this, fields);
    }
    /**
   * Returns a new `Time` with the given field adjusted by a specified amount.
   * When the resulting value reaches the limits of the field, it wraps around.
   */ cycle(field, amount, options) {
        return (0, $19485913bea41f19$exports.cycleTime)(this, field, amount, options);
    }
    /** Converts the time to an ISO 8601 formatted string. */ toString() {
        return (0, $1b358053f79e3a77$exports.timeToString)(this);
    }
    /**
   * Compares this time with another. A negative result indicates that this time is before the given
   * one, and a positive time indicates that it is after.
   */ compare(b) {
        return (0, $84a63d30beb0af0f$exports.compareTime)(this, b);
    }
}
class $c51b7e0106f45dea$export$ca871e8dbb80966f {
    // This prevents TypeScript from allowing other types with the same fields to match.
    // @ts-ignore
    #type;
    constructor(...args){
        let [calendar, era, year, month, day] = $c51b7e0106f45dea$var$shiftArgs(args);
        this.calendar = calendar;
        this.era = era;
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = args.shift() || 0;
        this.minute = args.shift() || 0;
        this.second = args.shift() || 0;
        this.millisecond = args.shift() || 0;
        (0, $19485913bea41f19$exports.constrain)(this);
    }
    /** Returns a copy of this date. */ copy() {
        if (this.era) return new $c51b7e0106f45dea$export$ca871e8dbb80966f(this.calendar, this.era, this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
        else return new $c51b7e0106f45dea$export$ca871e8dbb80966f(this.calendar, this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
    }
    /** Returns a new `CalendarDateTime` with the given duration added to it. */ add(duration) {
        return (0, $19485913bea41f19$exports.add)(this, duration);
    }
    /** Returns a new `CalendarDateTime` with the given duration subtracted from it. */ subtract(duration) {
        return (0, $19485913bea41f19$exports.subtract)(this, duration);
    }
    /**
   * Returns a new `CalendarDateTime` with the given fields set to the provided values. Other fields
   * will be constrained accordingly.
   */ set(fields) {
        return (0, $19485913bea41f19$exports.set)((0, $19485913bea41f19$exports.setTime)(this, fields), fields);
    }
    /**
   * Returns a new `CalendarDateTime` with the given field adjusted by a specified amount.
   * When the resulting value reaches the limits of the field, it wraps around.
   */ cycle(field, amount, options) {
        switch(field){
            case 'era':
            case 'year':
            case 'month':
            case 'day':
                return (0, $19485913bea41f19$exports.cycleDate)(this, field, amount, options);
            default:
                return (0, $19485913bea41f19$exports.cycleTime)(this, field, amount, options);
        }
    }
    /** Converts the date to a native JavaScript Date object in the given time zone. */ toDate(timeZone, disambiguation) {
        return (0, $e13115b3b86b9007$exports.toDate)(this, timeZone, disambiguation);
    }
    /** Converts the date to an ISO 8601 formatted string. */ toString() {
        return (0, $1b358053f79e3a77$exports.dateTimeToString)(this);
    }
    /**
   * Compares this date with another. A negative result indicates that this date is before the given
   * one, and a positive date indicates that it is after.
   */ compare(b) {
        let res = (0, $84a63d30beb0af0f$exports.compareDate)(this, b);
        if (res === 0) return (0, $84a63d30beb0af0f$exports.compareTime)(this, (0, $e13115b3b86b9007$exports.toCalendarDateTime)(b));
        return res;
    }
}
class $c51b7e0106f45dea$export$d3b7288e7994edea {
    // This prevents TypeScript from allowing other types with the same fields to match.
    // @ts-ignore
    #type;
    constructor(...args){
        let [calendar, era, year, month, day] = $c51b7e0106f45dea$var$shiftArgs(args);
        let timeZone = args.shift();
        let offset = args.shift();
        this.calendar = calendar;
        this.era = era;
        this.year = year;
        this.month = month;
        this.day = day;
        this.timeZone = timeZone;
        this.offset = offset;
        this.hour = args.shift() || 0;
        this.minute = args.shift() || 0;
        this.second = args.shift() || 0;
        this.millisecond = args.shift() || 0;
        (0, $19485913bea41f19$exports.constrain)(this);
    }
    /** Returns a copy of this date. */ copy() {
        if (this.era) return new $c51b7e0106f45dea$export$d3b7288e7994edea(this.calendar, this.era, this.year, this.month, this.day, this.timeZone, this.offset, this.hour, this.minute, this.second, this.millisecond);
        else return new $c51b7e0106f45dea$export$d3b7288e7994edea(this.calendar, this.year, this.month, this.day, this.timeZone, this.offset, this.hour, this.minute, this.second, this.millisecond);
    }
    /** Returns a new `ZonedDateTime` with the given duration added to it. */ add(duration) {
        return (0, $19485913bea41f19$exports.addZoned)(this, duration);
    }
    /** Returns a new `ZonedDateTime` with the given duration subtracted from it. */ subtract(duration) {
        return (0, $19485913bea41f19$exports.subtractZoned)(this, duration);
    }
    /**
   * Returns a new `ZonedDateTime` with the given fields set to the provided values. Other fields
   * will be constrained accordingly.
   */ set(fields, disambiguation) {
        return (0, $19485913bea41f19$exports.setZoned)(this, fields, disambiguation);
    }
    /**
   * Returns a new `ZonedDateTime` with the given field adjusted by a specified amount.
   * When the resulting value reaches the limits of the field, it wraps around.
   */ cycle(field, amount, options) {
        return (0, $19485913bea41f19$exports.cycleZoned)(this, field, amount, options);
    }
    /** Converts the date to a native JavaScript Date object. */ toDate() {
        return (0, $e13115b3b86b9007$exports.zonedToDate)(this);
    }
    /**
   * Converts the date to an ISO 8601 formatted string, including the UTC offset and time zone
   * identifier.
   */ toString() {
        return (0, $1b358053f79e3a77$exports.zonedDateTimeToString)(this);
    }
    /** Converts the date to an ISO 8601 formatted string in UTC. */ toAbsoluteString() {
        return this.toDate().toISOString();
    }
    /**
   * Compares this date with another. A negative result indicates that this date is before the given
   * one, and a positive date indicates that it is after.
   */ compare(b) {
        // TODO: Is this a bad idea??
        return this.toDate().getTime() - (0, $e13115b3b86b9007$exports.toZoned)(b, this.timeZone).toDate().getTime();
    }
}


//# sourceMappingURL=CalendarDate.cjs.map
