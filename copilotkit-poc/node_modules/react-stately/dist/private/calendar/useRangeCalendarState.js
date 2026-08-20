import {alignCenter as $4f2e4d26acdebef8$export$f4a51ff076cc9a09, constrainValue as $4f2e4d26acdebef8$export$4f5203c0d889109e, isInvalid as $4f2e4d26acdebef8$export$eac50920cf2fd59a, previousAvailableDate as $4f2e4d26acdebef8$export$a1d3911297b952d7} from "./utils.js";
import {useCalendarState as $2ff2cc7e373be77a$export$6d095e787d2b5e1f} from "./useCalendarState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {toCalendarDate as $edC1q$toCalendarDate, maxDate as $edC1q$maxDate, minDate as $edC1q$minDate, toCalendar as $edC1q$toCalendar, GregorianCalendar as $edC1q$GregorianCalendar} from "@internationalized/date";
import {useState as $edC1q$useState, useMemo as $edC1q$useMemo, useCallback as $edC1q$useCallback} from "react";

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




function $346f7b0e8cbbe0a3$export$9a987164d97ecc90(props) {
    let { value: valueProp, defaultValue: defaultValue, onChange: onChange, createCalendar: createCalendar, locale: locale, visibleDuration: visibleDuration = {
        months: 1
    }, minValue: minValue, maxValue: maxValue, ...calendarProps } = props;
    let [value, setValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(valueProp, defaultValue || null, onChange);
    let [anchorDate, setAnchorDate] = (0, $edC1q$useState)(null);
    let alignment = 'center';
    if (value && value.start && value.end) {
        let start = (0, $4f2e4d26acdebef8$export$f4a51ff076cc9a09)((0, $edC1q$toCalendarDate)(value.start), visibleDuration, locale, minValue, maxValue);
        let end = start.add(visibleDuration).subtract({
            days: 1
        });
        if (value.end.compare(end) > 0) alignment = 'start';
    }
    let isDateUnavailable = (0, $edC1q$useMemo)(()=>{
        let isDateUnavailable = props.isDateUnavailable;
        if (!isDateUnavailable) return undefined;
        return (date)=>isDateUnavailable(date, anchorDate);
    }, [
        props.isDateUnavailable,
        anchorDate
    ]);
    let getAvailableRange = (0, $edC1q$useCallback)((anchorDate)=>{
        if (anchorDate && isDateUnavailable && !props.allowsNonContiguousRanges) {
            const nextAvailableStartDate = $346f7b0e8cbbe0a3$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, -1);
            const nextAvailableEndDate = $346f7b0e8cbbe0a3$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, 1);
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
    let availableRange = (0, $edC1q$useMemo)(()=>getAvailableRange(anchorDate), [
        getAvailableRange,
        anchorDate
    ]);
    let min = (0, $edC1q$useMemo)(()=>(0, $edC1q$maxDate)(minValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.start), [
        minValue,
        availableRange
    ]);
    let max = (0, $edC1q$useMemo)(()=>(0, $edC1q$minDate)(maxValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.end), [
        maxValue,
        availableRange
    ]);
    let calendar = (0, $2ff2cc7e373be77a$export$6d095e787d2b5e1f)({
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
    let highlightedRange = anchorDate ? $346f7b0e8cbbe0a3$var$makeRange(anchorDate, calendar.focusedDate) : value && $346f7b0e8cbbe0a3$var$makeRange(value.start, value.end);
    let selectDate = (date)=>{
        if (props.isReadOnly) return;
        const constrainedDate = (0, $4f2e4d26acdebef8$export$4f5203c0d889109e)(date, min, max);
        const previousAvailableConstrainedDate = (0, $4f2e4d26acdebef8$export$a1d3911297b952d7)(constrainedDate, calendar.visibleRange.start, isDateUnavailable);
        if (!previousAvailableConstrainedDate) return;
        if (!anchorDate) setAnchorDate(previousAvailableConstrainedDate);
        else {
            let range = $346f7b0e8cbbe0a3$var$makeRange(anchorDate, previousAvailableConstrainedDate);
            if (range) setValue({
                start: $346f7b0e8cbbe0a3$var$convertValue(range.start, value === null || value === void 0 ? void 0 : value.start),
                end: $346f7b0e8cbbe0a3$var$convertValue(range.end, value === null || value === void 0 ? void 0 : value.end)
            });
            setAnchorDate(null);
        }
    };
    let [isDragging, setDragging] = (0, $edC1q$useState)(false);
    let isInvalidSelection = (0, $edC1q$useMemo)(()=>{
        if (!value || anchorDate) return false;
        if (isDateUnavailable && (isDateUnavailable(value.start) || isDateUnavailable(value.end))) return true;
        return (0, $4f2e4d26acdebef8$export$eac50920cf2fd59a)(value.start, minValue, maxValue) || (0, $4f2e4d26acdebef8$export$eac50920cf2fd59a)(value.end, minValue, maxValue);
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
            return calendar.isInvalid(date) || (0, $4f2e4d26acdebef8$export$eac50920cf2fd59a)(date, availableRange === null || availableRange === void 0 ? void 0 : availableRange.start, availableRange === null || availableRange === void 0 ? void 0 : availableRange.end);
        },
        isDragging: isDragging,
        setDragging: setDragging,
        clearSelection () {
            setAnchorDate(null);
            setValue(null);
        },
        focusNearestAvailableDate (anchorDate) {
            let availableRange = getAvailableRange(anchorDate);
            let isDateInvalid = (date)=>this.isInvalid(date) || (0, $4f2e4d26acdebef8$export$eac50920cf2fd59a)(date, availableRange === null || availableRange === void 0 ? void 0 : availableRange.start, availableRange === null || availableRange === void 0 ? void 0 : availableRange.end);
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
function $346f7b0e8cbbe0a3$var$makeRange(start, end) {
    if (!start || !end) return null;
    if (end.compare(start) < 0) [start, end] = [
        end,
        start
    ];
    return {
        start: (0, $edC1q$toCalendarDate)(start),
        end: (0, $edC1q$toCalendarDate)(end)
    };
}
function $346f7b0e8cbbe0a3$var$convertValue(newValue, oldValue) {
    // The display calendar should not have any effect on the emitted value.
    // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
    newValue = (0, $edC1q$toCalendar)(newValue, (oldValue === null || oldValue === void 0 ? void 0 : oldValue.calendar) || new (0, $edC1q$GregorianCalendar)());
    // Preserve time if the input value had one.
    if (oldValue && 'hour' in oldValue) return oldValue.set(newValue);
    return newValue;
}
function $346f7b0e8cbbe0a3$var$nextUnavailableDate(anchorDate, isDateUnavailable, visibleDuration, dir) {
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


export {$346f7b0e8cbbe0a3$export$9a987164d97ecc90 as useRangeCalendarState};
//# sourceMappingURL=useRangeCalendarState.js.map
