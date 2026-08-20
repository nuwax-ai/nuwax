import {startOfYear as $ijDZM$startOfYear, startOfMonth as $ijDZM$startOfMonth, startOfWeek as $ijDZM$startOfWeek, maxDate as $ijDZM$maxDate, toCalendarDate as $ijDZM$toCalendarDate, minDate as $ijDZM$minDate} from "@internationalized/date";

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
function $dd602d3c757202f2$export$eac50920cf2fd59a(date, minValue, maxValue) {
    return minValue != null && date.compare(minValue) < 0 || maxValue != null && date.compare(maxValue) > 0;
}
function $dd602d3c757202f2$export$f4a51ff076cc9a09(date, duration, locale, minValue, maxValue) {
    let halfDuration = {};
    for(let key in duration){
        halfDuration[key] = Math.floor(duration[key] / 2);
        if (halfDuration[key] > 0 && duration[key] % 2 === 0) halfDuration[key]--;
    }
    let aligned = $dd602d3c757202f2$export$144a00ba6044eb9(date, duration, locale).subtract(halfDuration);
    return $dd602d3c757202f2$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $dd602d3c757202f2$export$144a00ba6044eb9(date, duration, locale, minValue, maxValue) {
    // align to the start of the largest unit
    let aligned = date;
    if (duration.years) aligned = (0, $ijDZM$startOfYear)(date);
    else if (duration.months) aligned = (0, $ijDZM$startOfMonth)(date);
    else if (duration.weeks || duration.days && duration.days > 7) aligned = (0, $ijDZM$startOfWeek)(date, locale);
    return $dd602d3c757202f2$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $dd602d3c757202f2$export$530edbfc915b2b04(date, duration, locale, minValue, maxValue) {
    let d = {
        ...duration
    };
    // subtract 1 from the smallest unit
    if (d.days) d.days--;
    else if (d.weeks) d.weeks--;
    else if (d.months) d.months--;
    else if (d.years) d.years--;
    let aligned = $dd602d3c757202f2$export$144a00ba6044eb9(date, duration, locale).subtract(d);
    return $dd602d3c757202f2$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $dd602d3c757202f2$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue) {
    if (minValue && date.compare(minValue) >= 0) {
        let newDate = (0, $ijDZM$maxDate)(aligned, $dd602d3c757202f2$export$144a00ba6044eb9((0, $ijDZM$toCalendarDate)(minValue), duration, locale));
        if (newDate) aligned = newDate;
    }
    if (maxValue && date.compare(maxValue) <= 0) {
        let newDate = (0, $ijDZM$minDate)(aligned, $dd602d3c757202f2$export$530edbfc915b2b04((0, $ijDZM$toCalendarDate)(maxValue), duration, locale));
        if (newDate) aligned = newDate;
    }
    return aligned;
}
function $dd602d3c757202f2$export$4f5203c0d889109e(date, minValue, maxValue) {
    if (minValue) {
        let newDate = (0, $ijDZM$maxDate)(date, (0, $ijDZM$toCalendarDate)(minValue));
        if (newDate) date = newDate;
    }
    if (maxValue) {
        let newDate = (0, $ijDZM$minDate)(date, (0, $ijDZM$toCalendarDate)(maxValue));
        if (newDate) date = newDate;
    }
    return date;
}
function $dd602d3c757202f2$export$a1d3911297b952d7(date, minValue, isDateUnavailable) {
    if (!isDateUnavailable) return date;
    while(date.compare(minValue) >= 0 && isDateUnavailable(date))date = date.subtract({
        days: 1
    });
    if (date.compare(minValue) >= 0) return date;
    return null;
}
function $dd602d3c757202f2$export$6595e603c409b4b8(a, b) {
    if (a === b) return true;
    return a.days === b.days && a.weeks === b.weeks && a.months === b.months && a.years === b.years;
}


export {$dd602d3c757202f2$export$eac50920cf2fd59a as isInvalid, $dd602d3c757202f2$export$f4a51ff076cc9a09 as alignCenter, $dd602d3c757202f2$export$144a00ba6044eb9 as alignStart, $dd602d3c757202f2$export$5bb865b12696a77d as constrainStart, $dd602d3c757202f2$export$530edbfc915b2b04 as alignEnd, $dd602d3c757202f2$export$4f5203c0d889109e as constrainValue, $dd602d3c757202f2$export$a1d3911297b952d7 as previousAvailableDate, $dd602d3c757202f2$export$6595e603c409b4b8 as isEqualDuration};
//# sourceMappingURL=utils.mjs.map
