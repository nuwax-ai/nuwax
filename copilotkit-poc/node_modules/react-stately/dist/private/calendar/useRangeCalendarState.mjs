import {alignCenter as $dd602d3c757202f2$export$f4a51ff076cc9a09, constrainValue as $dd602d3c757202f2$export$4f5203c0d889109e, isInvalid as $dd602d3c757202f2$export$eac50920cf2fd59a, previousAvailableDate as $dd602d3c757202f2$export$a1d3911297b952d7} from "./utils.mjs";
import {useCalendarState as $ea0ea6e62ae0d7ca$export$6d095e787d2b5e1f} from "./useCalendarState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {toCalendarDate as $1ppdM$toCalendarDate, maxDate as $1ppdM$maxDate, minDate as $1ppdM$minDate, toCalendar as $1ppdM$toCalendar, GregorianCalendar as $1ppdM$GregorianCalendar} from "@internationalized/date";
import {useState as $1ppdM$useState, useMemo as $1ppdM$useMemo, useCallback as $1ppdM$useCallback} from "react";

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




function $a0a87fb6fcfb22ec$export$9a987164d97ecc90(props) {
    let { value: valueProp, defaultValue: defaultValue, onChange: onChange, createCalendar: createCalendar, locale: locale, visibleDuration: visibleDuration = {
        months: 1
    }, minValue: minValue, maxValue: maxValue, ...calendarProps } = props;
    let [value, setValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(valueProp, defaultValue || null, onChange);
    let [anchorDate, setAnchorDate] = (0, $1ppdM$useState)(null);
    let alignment = 'center';
    if (value && value.start && value.end) {
        let start = (0, $dd602d3c757202f2$export$f4a51ff076cc9a09)((0, $1ppdM$toCalendarDate)(value.start), visibleDuration, locale, minValue, maxValue);
        let end = start.add(visibleDuration).subtract({
            days: 1
        });
        if (value.end.compare(end) > 0) alignment = 'start';
    }
    let isDateUnavailable = (0, $1ppdM$useMemo)(()=>{
        let isDateUnavailable = props.isDateUnavailable;
        if (!isDateUnavailable) return undefined;
        return (date)=>isDateUnavailable(date, anchorDate);
    }, [
        props.isDateUnavailable,
        anchorDate
    ]);
    let getAvailableRange = (0, $1ppdM$useCallback)((anchorDate)=>{
        if (anchorDate && isDateUnavailable && !props.allowsNonContiguousRanges) {
            const nextAvailableStartDate = $a0a87fb6fcfb22ec$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, -1);
            const nextAvailableEndDate = $a0a87fb6fcfb22ec$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, 1);
            return {
                start: nextAvailableStartDate,
                end: nextAvailableEndDate
            };
        } else return null;
    }, [
        isDateUnavailable,
        visibleDuration,
        props.allowsNonContiguousRanges
    ]);
    let availableRange = (0, $1ppdM$useMemo)(()=>getAvailableRange(anchorDate), [
        getAvailableRange,
        anchorDate
    ]);
    let min = (0, $1ppdM$useMemo)(()=>(0, $1ppdM$maxDate)(minValue, availableRange?.start), [
        minValue,
        availableRange
    ]);
    let max = (0, $1ppdM$useMemo)(()=>(0, $1ppdM$minDate)(maxValue, availableRange?.end), [
        maxValue,
        availableRange
    ]);
    let calendar = (0, $ea0ea6e62ae0d7ca$export$6d095e787d2b5e1f)({
        ...calendarProps,
        value: value && value.start,
        createCalendar: createCalendar,
        locale: locale,
        visibleDuration: visibleDuration,
        minValue: min,
        maxValue: max,
        selectionAlignment: props.selectionAlignment || alignment,
        isDateUnavailable: isDateUnavailable
    });
    let highlightedRange = anchorDate ? $a0a87fb6fcfb22ec$var$makeRange(anchorDate, calendar.focusedDate) : value && $a0a87fb6fcfb22ec$var$makeRange(value.start, value.end);
    let selectDate = (date)=>{
        if (props.isReadOnly) return;
        const constrainedDate = (0, $dd602d3c757202f2$export$4f5203c0d889109e)(date, min, max);
        const previousAvailableConstrainedDate = (0, $dd602d3c757202f2$export$a1d3911297b952d7)(constrainedDate, calendar.visibleRange.start, isDateUnavailable);
        if (!previousAvailableConstrainedDate) return;
        if (!anchorDate) setAnchorDate(previousAvailableConstrainedDate);
        else {
            let range = $a0a87fb6fcfb22ec$var$makeRange(anchorDate, previousAvailableConstrainedDate);
            if (range) setValue({
                start: $a0a87fb6fcfb22ec$var$convertValue(range.start, value?.start),
                end: $a0a87fb6fcfb22ec$var$convertValue(range.end, value?.end)
            });
            setAnchorDate(null);
        }
    };
    let [isDragging, setDragging] = (0, $1ppdM$useState)(false);
    let isInvalidSelection = (0, $1ppdM$useMemo)(()=>{
        if (!value || anchorDate) return false;
        if (isDateUnavailable && (isDateUnavailable(value.start) || isDateUnavailable(value.end))) return true;
        return (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(value.start, minValue, maxValue) || (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(value.end, minValue, maxValue);
    }, [
        isDateUnavailable,
        value,
        anchorDate,
        minValue,
        maxValue
    ]);
    let isValueInvalid = props.isInvalid || props.validationState === 'invalid' || isInvalidSelection;
    let validationState = isValueInvalid ? 'invalid' : null;
    return {
        ...calendar,
        value: value,
        setValue: setValue,
        anchorDate: anchorDate,
        setAnchorDate: setAnchorDate,
        highlightedRange: highlightedRange,
        validationState: validationState,
        isValueInvalid: isValueInvalid,
        selectFocusedDate () {
            if (!calendar.isCellUnavailable(calendar.focusedDate)) selectDate(calendar.focusedDate);
        },
        commitSelection () {
            selectDate(calendar.focusedDate);
        },
        selectDate: selectDate,
        highlightDate (date) {
            if (anchorDate) calendar.setFocusedDate(date);
        },
        isSelected (date) {
            return Boolean(highlightedRange && date.compare(highlightedRange.start) >= 0 && date.compare(highlightedRange.end) <= 0 && !calendar.isCellDisabled(date) && !calendar.isCellUnavailable(date));
        },
        isInvalid (date) {
            return calendar.isInvalid(date) || (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(date, availableRange?.start, availableRange?.end);
        },
        isDragging: isDragging,
        setDragging: setDragging,
        clearSelection () {
            setAnchorDate(null);
            setValue(null);
        },
        focusNearestAvailableDate (anchorDate) {
            let availableRange = getAvailableRange(anchorDate);
            let isDateInvalid = (date)=>this.isInvalid(date) || (0, $dd602d3c757202f2$export$eac50920cf2fd59a)(date, availableRange?.start, availableRange?.end);
            let nextDay = anchorDate.add({
                days: 1
            });
            if (isDateInvalid(nextDay)) nextDay = anchorDate.subtract({
                days: 1
            });
            if (!isDateInvalid(nextDay)) {
                this.setFocusedDate(nextDay);
                this.setFocused(true);
            }
        }
    };
}
function $a0a87fb6fcfb22ec$var$makeRange(start, end) {
    if (!start || !end) return null;
    if (end.compare(start) < 0) [start, end] = [
        end,
        start
    ];
    return {
        start: (0, $1ppdM$toCalendarDate)(start),
        end: (0, $1ppdM$toCalendarDate)(end)
    };
}
function $a0a87fb6fcfb22ec$var$convertValue(newValue, oldValue) {
    // The display calendar should not have any effect on the emitted value.
    // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
    newValue = (0, $1ppdM$toCalendar)(newValue, oldValue?.calendar || new (0, $1ppdM$GregorianCalendar)());
    // Preserve time if the input value had one.
    if (oldValue && 'hour' in oldValue) return oldValue.set(newValue);
    return newValue;
}
function $a0a87fb6fcfb22ec$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, dir) {
    let nextDate = anchorDate.add({
        days: dir
    });
    let minDate = anchorDate.subtract(visibleDuration);
    let maxDate = anchorDate.add(visibleDuration);
    while((dir < 0 ? nextDate.compare(minDate) >= 0 : nextDate.compare(maxDate) <= 0) && !isDateUnavailable(nextDate))nextDate = nextDate.add({
        days: dir
    });
    if (isDateUnavailable(nextDate)) return nextDate.add({
        days: -dir
    });
}


export {$a0a87fb6fcfb22ec$export$9a987164d97ecc90 as useRangeCalendarState};
//# sourceMappingURL=useRangeCalendarState.mjs.map
