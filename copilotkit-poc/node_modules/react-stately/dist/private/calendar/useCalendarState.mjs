import {alignCenter as $dd602d3c757202f2$export$f4a51ff076cc9a09, alignEnd as $dd602d3c757202f2$export$530edbfc915b2b04, alignStart as $dd602d3c757202f2$export$144a00ba6044eb9, constrainStart as $dd602d3c757202f2$export$5bb865b12696a77d, constrainValue as $dd602d3c757202f2$export$4f5203c0d889109e, isEqualDuration as $dd602d3c757202f2$export$6595e603c409b4b8, isInvalid as $dd602d3c757202f2$export$eac50920cf2fd59a, previousAvailableDate as $dd602d3c757202f2$export$a1d3911297b952d7} from "./utils.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {DateFormatter as $aoVcW$DateFormatter, toCalendar as $aoVcW$toCalendar, toCalendarDate as $aoVcW$toCalendarDate, today as $aoVcW$today, isEqualCalendar as $aoVcW$isEqualCalendar, GregorianCalendar as $aoVcW$GregorianCalendar, startOfWeek as $aoVcW$startOfWeek, startOfMonth as $aoVcW$startOfMonth, endOfWeek as $aoVcW$endOfWeek, endOfMonth as $aoVcW$endOfMonth, isSameDay as $aoVcW$isSameDay, getDayOfWeek as $aoVcW$getDayOfWeek, getWeeksInMonth as $aoVcW$getWeeksInMonth} from "@internationalized/date";
import {useMemo as $aoVcW$useMemo, useState as $aoVcW$useState} from "react";

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



function $ea0ea6e62ae0d7ca$export$6d095e787d2b5e1f(props) {
    let defaultFormatter = (0, $aoVcW$useMemo)(()=>new (0, $aoVcW$DateFormatter)(props.locale), [
        props.locale
    ]);
    let resolvedOptions = (0, $aoVcW$useMemo)(()=>defaultFormatter.resolvedOptions(), [
        defaultFormatter
    ]);
    let { locale: locale, createCalendar: createCalendar, visibleDuration: visibleDuration = {
        months: 1
    }, minValue: minValue, maxValue: maxValue, selectionAlignment: selectionAlignment, isDateUnavailable: isDateUnavailable, pageBehavior: pageBehavior = 'visible', selectionMode: selectionMode = 'single', firstDayOfWeek: firstDayOfWeek, weeksInMonth: weeksInMonth } = props;
    let calendar = (0, $aoVcW$useMemo)(()=>createCalendar(resolvedOptions.calendar), [
        createCalendar,
        resolvedOptions.calendar
    ]);
    let [value, setControlledValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.value, props.defaultValue ?? null, props.onChange);
    let calendarDateValue = (0, $aoVcW$useMemo)(()=>{
        if (Array.isArray(value)) return value.map((value)=>(0, $aoVcW$toCalendar)((0, $aoVcW$toCalendarDate)(value), calendar));
        else return value ? (0, $aoVcW$toCalendar)((0, $aoVcW$toCalendarDate)(value), calendar) : null;
    }, [
        value,
        calendar
    ]);
    let timeZone = (0, $aoVcW$useMemo)(()=>{
        let val = Array.isArray(value) ? value[0] : value;
        return val && 'timeZone' in val ? val.timeZone : resolvedOptions.timeZone;
    }, [
        value,
        resolvedOptions.timeZone
    ]);
    let focusedCalendarDate = (0, $aoVcW$useMemo)(()=>props.focusedValue ? (0, $dd602d3c757202f2$export$4f5203c0d889109e)((0, $aoVcW$toCalendar)((0, $aoVcW$toCalendarDate)(props.focusedValue), calendar), minValue, maxValue) : undefined, [
        props.focusedValue,
        calendar,
        minValue,
        maxValue
    ]);
    let defaultFocusedCalendarDate = (0, $aoVcW$useMemo)(()=>{
        if (props.defaultFocusedValue) return (0, $dd602d3c757202f2$export$4f5203c0d889109e)((0, $aoVcW$toCalendar)((0, $aoVcW$toCalendarDate)(props.defaultFocusedValue), calendar), minValue, maxValue);
        if (calendarDateValue) return (0, $dd602d3c757202f2$export$4f5203c0d889109e)(Array.isArray(calendarDateValue) ? calendarDateValue[0] : calendarDateValue, minValue, maxValue);
        return (0, $dd602d3c757202f2$export$4f5203c0d889109e)((0, $aoVcW$toCalendar)((0, $aoVcW$today)(timeZone), calendar), minValue, maxValue);
    }, [
        props.defaultFocusedValue,
        calendarDateValue,
        timeZone,
        calendar,
        minValue,
        maxValue
    ]);
    let [focusedDate, setFocusedDate] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(focusedCalendarDate, defaultFocusedCalendarDate, props.onFocusChange);
    let getStartDate = ()=>{
        switch(selectionAlignment){
            case 'start':
                return (0, $dd602d3c757202f2$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case 'end':
                return (0, $dd602d3c757202f2$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case 'center':
            default:
                return (0, $dd602d3c757202f2$export$f4a51ff076cc9a09)(focusedDate, visibleDuration, locale, minValue, maxValue);
        }
    };
    let [startDate, setStartDate] = (0, $aoVcW$useState)(getStartDate);
    let [isFocused, setFocused] = (0, $aoVcW$useState)(props.autoFocus || false);
    let [lastVisibleDuration, setLastVisibleDuration] = (0, $aoVcW$useState)(visibleDuration);
    if (!(0, $dd602d3c757202f2$export$6595e603c409b4b8)(visibleDuration, lastVisibleDuration)) {
        setLastVisibleDuration(visibleDuration);
        setStartDate(getStartDate());
    }
    let endDate = (0, $aoVcW$useMemo)(()=>{
        let duration = {
            ...visibleDuration
        };
        if (duration.days) duration.days--;
        else duration.days = -1;
        return startDate.add(duration);
    }, [
        startDate,
        visibleDuration
    ]);
    // Reset focused date and visible range when calendar changes.
    let [lastCalendar, setLastCalendar] = (0, $aoVcW$useState)(calendar);
    if (!(0, $aoVcW$isEqualCalendar)(calendar, lastCalendar)) {
        let newFocusedDate = (0, $aoVcW$toCalendar)(focusedDate, calendar);
        setStartDate((0, $dd602d3c757202f2$export$f4a51ff076cc9a09)(newFocusedDate, visibleDuration, locale, minValue, maxValue));
        setFocusedDate(newFocusedDate);
        setLastCalendar(calendar);
    }
    if ((0, $dd602d3c757202f2$export$eac50920cf2fd59a)(focusedDate, minValue, maxValue)) // If the focused date was moved to an invalid value, it can't be focused, so constrain it.
    setFocusedDate((0, $dd602d3c757202f2$export$4f5203c0d889109e)(focusedDate, minValue, maxValue));
    else if (focusedDate.compare(startDate) < 0) setStartDate((0, $dd602d3c757202f2$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue));
    else if (focusedDate.compare(endDate) > 0) setStartDate((0, $dd602d3c757202f2$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue));
    // Sets focus to a specific cell date
    function focusCell(date) {
        date = (0, $dd602d3c757202f2$export$4f5203c0d889109e)(date, minValue, maxValue);
        setFocusedDate(date);
    }
    function normalizeValue(newValue) {
        let constrained = (0, $dd602d3c757202f2$export$4f5203c0d889109e)(newValue, minValue, maxValue);
        let prev = (0, $dd602d3c757202f2$export$a1d3911297b952d7)(constrained, startDate, isDateUnavailable);
        if (!prev) return null;
        // The display calendar should not have any effect on the emitted value.
        // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
        let baseValue = Array.isArray(value) ? value[0] : value;
        let calendarValue = (0, $aoVcW$toCalendar)(prev, baseValue?.calendar || new (0, $aoVcW$GregorianCalendar)());
        // Preserve time if the input value had one.
        if (baseValue && 'hour' in baseValue) return baseValue.set(calendarValue);
        return calendarValue;
    }
    function setValue(newValue) {
        if (!props.isDisabled && !props.isReadOnly) {
            if (newValue === null) {
                setControlledValue(selectionMode === 'multiple' ? [] : null);
                return;
            }
            if (Array.isArray(newValue)) setControlledValue(newValue.map(normalizeValue).filter(Boolean));
            else {
                let localValue = normalizeValue(newValue);
                if (localValue) setControlledValue(localValue);
            }
        }
    }
    let isUnavailable = (0, $aoVcW$useMemo)(()=>{
        if (!calendarDateValue) return false;
        if (Array.isArray(calendarDateValue)) return calendarDateValue.some((date)=>isDateUnavailable?.(date) || (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(date, minValue, maxValue));
        return isDateUnavailable?.(calendarDateValue) || (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(calendarDateValue, minValue, maxValue);
    }, [
        calendarDateValue,
        isDateUnavailable,
        minValue,
        maxValue
    ]);
    let isValueInvalid = props.isInvalid || props.validationState === 'invalid' || isUnavailable;
    let validationState = isValueInvalid ? 'invalid' : null;
    let pageDuration = (0, $aoVcW$useMemo)(()=>{
        if (pageBehavior === 'visible') return visibleDuration;
        return $ea0ea6e62ae0d7ca$var$unitDuration(visibleDuration);
    }, [
        pageBehavior,
        visibleDuration
    ]);
    return {
        isDisabled: props.isDisabled ?? false,
        isReadOnly: props.isReadOnly ?? false,
        value: calendarDateValue,
        setValue: setValue,
        selectionMode: selectionMode,
        visibleDuration: visibleDuration,
        visibleRange: {
            start: startDate,
            end: endDate
        },
        minValue: minValue,
        maxValue: maxValue,
        focusedDate: focusedDate,
        timeZone: timeZone,
        validationState: validationState,
        isValueInvalid: isValueInvalid,
        setFocusedDate (date) {
            focusCell(date);
        },
        focusNextDay () {
            focusCell(focusedDate.add({
                days: 1
            }));
        },
        focusPreviousDay () {
            focusCell(focusedDate.subtract({
                days: 1
            }));
        },
        focusNextRow () {
            if (visibleDuration.days) this.focusNextPage();
            else if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) focusCell(focusedDate.add({
                weeks: 1
            }));
        },
        focusPreviousRow () {
            if (visibleDuration.days) this.focusPreviousPage();
            else if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) focusCell(focusedDate.subtract({
                weeks: 1
            }));
        },
        focusNextPage () {
            let start = startDate.add(pageDuration);
            setFocusedDate((0, $dd602d3c757202f2$export$4f5203c0d889109e)(focusedDate.add(pageDuration), minValue, maxValue));
            setStartDate((0, $dd602d3c757202f2$export$144a00ba6044eb9)((0, $dd602d3c757202f2$export$5bb865b12696a77d)(focusedDate, start, pageDuration, locale, minValue, maxValue), pageDuration, locale));
        },
        focusPreviousPage () {
            let start = startDate.subtract(pageDuration);
            setFocusedDate((0, $dd602d3c757202f2$export$4f5203c0d889109e)(focusedDate.subtract(pageDuration), minValue, maxValue));
            setStartDate((0, $dd602d3c757202f2$export$144a00ba6044eb9)((0, $dd602d3c757202f2$export$5bb865b12696a77d)(focusedDate, start, pageDuration, locale, minValue, maxValue), pageDuration, locale));
        },
        focusSectionStart () {
            if (visibleDuration.days) focusCell(startDate);
            else if (visibleDuration.weeks) focusCell((0, $aoVcW$startOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $aoVcW$startOfMonth)(focusedDate));
        },
        focusSectionEnd () {
            if (visibleDuration.days) focusCell(endDate);
            else if (visibleDuration.weeks) focusCell((0, $aoVcW$endOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $aoVcW$endOfMonth)(focusedDate));
        },
        focusNextSection (larger) {
            if (!larger && !visibleDuration.days) {
                focusCell(focusedDate.add($ea0ea6e62ae0d7ca$var$unitDuration(visibleDuration)));
                return;
            }
            if (visibleDuration.days) this.focusNextPage();
            else if (visibleDuration.weeks) focusCell(focusedDate.add({
                months: 1
            }));
            else if (visibleDuration.months || visibleDuration.years) focusCell(focusedDate.add({
                years: 1
            }));
        },
        focusPreviousSection (larger) {
            if (!larger && !visibleDuration.days) {
                focusCell(focusedDate.subtract($ea0ea6e62ae0d7ca$var$unitDuration(visibleDuration)));
                return;
            }
            if (visibleDuration.days) this.focusPreviousPage();
            else if (visibleDuration.weeks) focusCell(focusedDate.subtract({
                months: 1
            }));
            else if (visibleDuration.months || visibleDuration.years) focusCell(focusedDate.subtract({
                years: 1
            }));
        },
        selectFocusedDate () {
            if (!(isDateUnavailable && isDateUnavailable(focusedDate))) this.selectDate(focusedDate);
        },
        selectDate (date) {
            if (props.isDisabled || props.isReadOnly) return;
            if (selectionMode === 'multiple' && date != null) {
                let newDate = normalizeValue(date);
                if (!newDate) return;
                let baseValue = [];
                if (Array.isArray(value)) baseValue = value;
                else if (value != null) baseValue = [
                    value
                ];
                let index = baseValue.findIndex((value)=>(0, $aoVcW$isSameDay)(value, newDate));
                let newValue = index >= 0 ? baseValue.slice(0, index).concat(baseValue.slice(index + 1)) : [
                    ...baseValue,
                    newDate
                ];
                setControlledValue(newValue);
            } else setValue(date);
        },
        isFocused: isFocused,
        setFocused: setFocused,
        isInvalid (date) {
            return (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(date, minValue, maxValue);
        },
        isSelected (date) {
            if (!calendarDateValue || this.isCellDisabled(date) || this.isCellUnavailable(date)) return false;
            return Array.isArray(calendarDateValue) ? calendarDateValue.some((value)=>(0, $aoVcW$isSameDay)(value, date)) : (0, $aoVcW$isSameDay)(date, calendarDateValue);
        },
        isCellFocused (date) {
            return isFocused && focusedDate && (0, $aoVcW$isSameDay)(date, focusedDate);
        },
        isCellDisabled (date) {
            return props.isDisabled || date.compare(startDate) < 0 || date.compare(endDate) > 0 || this.isInvalid(date);
        },
        isCellUnavailable (date) {
            return props.isDateUnavailable ? props.isDateUnavailable(date) : false;
        },
        isPreviousVisibleRangeInvalid () {
            let prev = startDate.subtract({
                days: 1
            });
            return (0, $aoVcW$isSameDay)(prev, startDate) || this.isInvalid(prev);
        },
        isNextVisibleRangeInvalid () {
            // Adding may return the same date if we reached the end of time
            // according to the calendar system (e.g. 9999-12-31).
            let next = endDate.add({
                days: 1
            });
            return (0, $aoVcW$isSameDay)(next, endDate) || this.isInvalid(next);
        },
        getDatesInWeek (weekIndex, from = startDate) {
            let date = from.add({
                weeks: weekIndex
            });
            let dates = [];
            let days = visibleDuration.days && visibleDuration.days < 7 ? visibleDuration.days : 7;
            if (days === 7) {
                date = (0, $aoVcW$startOfWeek)(date, locale, firstDayOfWeek);
                // startOfWeek will clamp dates within the calendar system's valid range, which may
                // start in the middle of a week. In this case, add null placeholders.
                let dayOfWeek = (0, $aoVcW$getDayOfWeek)(date, locale, firstDayOfWeek);
                for(let i = 0; i < dayOfWeek; i++)dates.push(null);
            }
            while(dates.length < days){
                dates.push(date);
                let nextDate = date.add({
                    days: 1
                });
                if ((0, $aoVcW$isSameDay)(date, nextDate)) break;
                date = nextDate;
            }
            // Add null placeholders if at the end of the calendar system.
            while(dates.length < days)dates.push(null);
            return dates;
        },
        getWeeksInMonth (date = startDate) {
            let weeks = weeksInMonth || (0, $aoVcW$getWeeksInMonth)(date, locale, firstDayOfWeek);
            if (visibleDuration.weeks || visibleDuration.days) {
                weeks = visibleDuration.weeks ?? 0;
                if (visibleDuration.days) weeks += Math.ceil(visibleDuration.days / 7);
            }
            return weeks;
        }
    };
}
function $ea0ea6e62ae0d7ca$var$unitDuration(duration) {
    let unit = {
        ...duration
    };
    for(let key in duration)unit[key] = 1;
    return unit;
}


export {$ea0ea6e62ae0d7ca$export$6d095e787d2b5e1f as useCalendarState};
//# sourceMappingURL=useCalendarState.mjs.map
