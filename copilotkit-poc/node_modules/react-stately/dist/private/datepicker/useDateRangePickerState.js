import {getFormatOptions as $1d0eb7b51dbf91aa$export$7e319ea407e63bc0, getPlaceholderTime as $1d0eb7b51dbf91aa$export$c5221a78ef73c5e9, getRangeValidationResult as $1d0eb7b51dbf91aa$export$80ff8fc0ae339c13, useDefaultProps as $1d0eb7b51dbf91aa$export$2440da353cedad43} from "./utils.js";
import {useFormValidationState as $d085204f885ad67a$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.js";
import {useOverlayTriggerState as $3b152ed05cfdb7e2$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {toCalendarDate as $3F86Z$toCalendarDate, toCalendarDateTime as $3F86Z$toCalendarDateTime, DateFormatter as $3F86Z$DateFormatter} from "@internationalized/date";
import {useState as $3F86Z$useState, useMemo as $3F86Z$useMemo} from "react";

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





function $74e44fc0182e1a23$export$e50a61c1de9f574(props) {
    var _value_start, _value_end;
    let overlayState = (0, $3b152ed05cfdb7e2$export$61c6a8c84e605fb6)(props);
    let [controlledValue, setControlledValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.value, props.defaultValue || null, props.onChange);
    let [initialValue] = (0, $3F86Z$useState)(controlledValue);
    let [placeholderValue, setPlaceholderValue] = (0, $3F86Z$useState)(()=>controlledValue || {
            start: null,
            end: null
        });
    // Reset the placeholder if the value prop is set to null.
    if (controlledValue == null && placeholderValue.start && placeholderValue.end) {
        placeholderValue = {
            start: null,
            end: null
        };
        setPlaceholderValue(placeholderValue);
    }
    let value = controlledValue || placeholderValue;
    let setValue = (newValue)=>{
        value = newValue || {
            start: null,
            end: null
        };
        setPlaceholderValue(value);
        if ($74e44fc0182e1a23$var$isCompleteRange(value)) setControlledValue(value);
        else setControlledValue(null);
    };
    let v = (value === null || value === void 0 ? void 0 : value.start) || (value === null || value === void 0 ? void 0 : value.end) || props.placeholderValue || null;
    let [granularity, defaultTimeZone] = (0, $1d0eb7b51dbf91aa$export$2440da353cedad43)(v, props.granularity);
    let hasTime = granularity === 'hour' || granularity === 'minute' || granularity === 'second';
    var _props_shouldCloseOnSelect;
    let shouldCloseOnSelect = (_props_shouldCloseOnSelect = props.shouldCloseOnSelect) !== null && _props_shouldCloseOnSelect !== void 0 ? _props_shouldCloseOnSelect : true;
    let [dateRange, setSelectedDateRange] = (0, $3F86Z$useState)(null);
    let [timeRange, setSelectedTimeRange] = (0, $3F86Z$useState)(null);
    if (value && $74e44fc0182e1a23$var$isCompleteRange(value)) {
        dateRange = value;
        if ('hour' in value.start) timeRange = value;
    }
    let commitValue = (dateRange, timeRange)=>{
        setValue({
            start: 'timeZone' in timeRange.start ? timeRange.start.set((0, $3F86Z$toCalendarDate)(dateRange.start)) : (0, $3F86Z$toCalendarDateTime)(dateRange.start, timeRange.start),
            end: 'timeZone' in timeRange.end ? timeRange.end.set((0, $3F86Z$toCalendarDate)(dateRange.end)) : (0, $3F86Z$toCalendarDateTime)(dateRange.end, timeRange.end)
        });
        setSelectedDateRange(null);
        setSelectedTimeRange(null);
        validation.commitValidation();
    };
    // Intercept setValue to make sure the Time section is not changed by date selection in Calendar
    let setDateRange = (range)=>{
        let shouldClose = typeof shouldCloseOnSelect === 'function' ? shouldCloseOnSelect() : shouldCloseOnSelect;
        if (hasTime) {
            // Set a placeholder time if the popover is closing so we don't leave the field in an incomplete state.
            if ($74e44fc0182e1a23$var$isCompleteRange(range) && (shouldClose || (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) && (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end))) commitValue(range, {
                start: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) || (0, $1d0eb7b51dbf91aa$export$c5221a78ef73c5e9)(props.placeholderValue),
                end: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end) || (0, $1d0eb7b51dbf91aa$export$c5221a78ef73c5e9)(props.placeholderValue)
            });
            else setSelectedDateRange(range);
        } else if ($74e44fc0182e1a23$var$isCompleteRange(range)) {
            setValue(range);
            validation.commitValidation();
        } else setSelectedDateRange(range);
        if (shouldClose) overlayState.setOpen(false);
    };
    let setTimeRange = (range)=>{
        if ($74e44fc0182e1a23$var$isCompleteRange(dateRange) && $74e44fc0182e1a23$var$isCompleteRange(range)) commitValue(dateRange, range);
        else setSelectedTimeRange(range);
    };
    let showEra = (value === null || value === void 0 ? void 0 : (_value_start = value.start) === null || _value_start === void 0 ? void 0 : _value_start.calendar.identifier) === 'gregory' && value.start.era === 'BC' || (value === null || value === void 0 ? void 0 : (_value_end = value.end) === null || _value_end === void 0 ? void 0 : _value_end.calendar.identifier) === 'gregory' && value.end.era === 'BC';
    let formatOpts = (0, $3F86Z$useMemo)(()=>({
            granularity: granularity,
            timeZone: defaultTimeZone,
            hideTimeZone: props.hideTimeZone,
            hourCycle: props.hourCycle,
            shouldForceLeadingZeros: props.shouldForceLeadingZeros,
            showEra: showEra
        }), [
        granularity,
        props.hourCycle,
        props.shouldForceLeadingZeros,
        defaultTimeZone,
        props.hideTimeZone,
        showEra
    ]);
    let { minValue: minValue, maxValue: maxValue, isDateUnavailable: isDateUnavailable } = props;
    let builtinValidation = (0, $3F86Z$useMemo)(()=>(0, $1d0eb7b51dbf91aa$export$80ff8fc0ae339c13)(value, minValue, maxValue, isDateUnavailable ? (date)=>isDateUnavailable(date, null) : undefined, formatOpts), [
        value,
        minValue,
        maxValue,
        isDateUnavailable,
        formatOpts
    ]);
    let validation = (0, $d085204f885ad67a$export$fc1a364ae1f3ff10)({
        ...props,
        value: controlledValue,
        name: (0, $3F86Z$useMemo)(()=>[
                props.startName,
                props.endName
            ].filter((n)=>n != null), [
            props.startName,
            props.endName
        ]),
        builtinValidation: builtinValidation
    });
    let isValueInvalid = validation.displayValidation.isInvalid;
    let validationState = props.validationState || (isValueInvalid ? 'invalid' : null);
    var _props_defaultValue;
    return {
        ...validation,
        value: value,
        defaultValue: (_props_defaultValue = props.defaultValue) !== null && _props_defaultValue !== void 0 ? _props_defaultValue : initialValue,
        setValue: setValue,
        dateRange: dateRange,
        timeRange: timeRange,
        granularity: granularity,
        hasTime: hasTime,
        setDate (part, date) {
            var _dateRange_end, _dateRange_start;
            if (part === 'start') setDateRange({
                start: date,
                end: (_dateRange_end = dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) !== null && _dateRange_end !== void 0 ? _dateRange_end : null
            });
            else setDateRange({
                start: (_dateRange_start = dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) !== null && _dateRange_start !== void 0 ? _dateRange_start : null,
                end: date
            });
        },
        setTime (part, time) {
            var _timeRange_end, _timeRange_start;
            if (part === 'start') setTimeRange({
                start: time,
                end: (_timeRange_end = timeRange === null || timeRange === void 0 ? void 0 : timeRange.end) !== null && _timeRange_end !== void 0 ? _timeRange_end : null
            });
            else setTimeRange({
                start: (_timeRange_start = timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) !== null && _timeRange_start !== void 0 ? _timeRange_start : null,
                end: time
            });
        },
        setDateTime (part, dateTime) {
            var _value_end, _value_start;
            if (part === 'start') setValue({
                start: dateTime,
                end: (_value_end = value === null || value === void 0 ? void 0 : value.end) !== null && _value_end !== void 0 ? _value_end : null
            });
            else setValue({
                start: (_value_start = value === null || value === void 0 ? void 0 : value.start) !== null && _value_start !== void 0 ? _value_start : null,
                end: dateTime
            });
        },
        setDateRange: setDateRange,
        setTimeRange: setTimeRange,
        ...overlayState,
        setOpen (isOpen) {
            // Commit the selected date range when the calendar is closed. Use a placeholder time if one wasn't set.
            // If only the time range was set and not the date range, don't commit. The state will be preserved until
            // the user opens the popover again.
            if (!isOpen && !((value === null || value === void 0 ? void 0 : value.start) && (value === null || value === void 0 ? void 0 : value.end)) && $74e44fc0182e1a23$var$isCompleteRange(dateRange) && hasTime) commitValue(dateRange, {
                start: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) || (0, $1d0eb7b51dbf91aa$export$c5221a78ef73c5e9)(props.placeholderValue),
                end: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end) || (0, $1d0eb7b51dbf91aa$export$c5221a78ef73c5e9)(props.placeholderValue)
            });
            overlayState.setOpen(isOpen);
        },
        validationState: validationState,
        isInvalid: isValueInvalid,
        formatValue (locale, fieldOptions) {
            if (!value || !value.start || !value.end) return null;
            let startTimeZone = 'timeZone' in value.start ? value.start.timeZone : undefined;
            let startGranularity = props.granularity || (value.start && 'minute' in value.start ? 'minute' : 'day');
            let endTimeZone = 'timeZone' in value.end ? value.end.timeZone : undefined;
            let endGranularity = props.granularity || (value.end && 'minute' in value.end ? 'minute' : 'day');
            let startOptions = (0, $1d0eb7b51dbf91aa$export$7e319ea407e63bc0)(fieldOptions, {
                granularity: startGranularity,
                timeZone: startTimeZone,
                hideTimeZone: props.hideTimeZone,
                hourCycle: props.hourCycle,
                showEra: value.start.calendar.identifier === 'gregory' && value.start.era === 'BC' || value.end.calendar.identifier === 'gregory' && value.end.era === 'BC'
            });
            let startDate = value.start.toDate(startTimeZone || 'UTC');
            let endDate = value.end.toDate(endTimeZone || 'UTC');
            let startFormatter = new (0, $3F86Z$DateFormatter)(locale, startOptions);
            let endFormatter;
            if (startTimeZone === endTimeZone && startGranularity === endGranularity && value.start.compare(value.end) !== 0) {
                // Use formatRange, as it results in shorter output when some of the fields
                // are shared between the start and end dates (e.g. the same month).
                // Formatting will fail if the end date is before the start date. Fall back below when that happens.
                try {
                    let parts = startFormatter.formatRangeToParts(startDate, endDate);
                    // Find the separator between the start and end date. This is determined
                    // by finding the last shared literal before the end range.
                    let separatorIndex = -1;
                    for(let i = 0; i < parts.length; i++){
                        let part = parts[i];
                        if (part.source === 'shared' && part.type === 'literal') separatorIndex = i;
                        else if (part.source === 'endRange') break;
                    }
                    // Now we can combine the parts into start and end strings.
                    let start = '';
                    let end = '';
                    for(let i = 0; i < parts.length; i++){
                        if (i < separatorIndex) start += parts[i].value;
                        else if (i > separatorIndex) end += parts[i].value;
                    }
                    return {
                        start: start,
                        end: end
                    };
                } catch  {
                // ignore
                }
                endFormatter = startFormatter;
            } else {
                let endOptions = (0, $1d0eb7b51dbf91aa$export$7e319ea407e63bc0)(fieldOptions, {
                    granularity: endGranularity,
                    timeZone: endTimeZone,
                    hideTimeZone: props.hideTimeZone,
                    hourCycle: props.hourCycle
                });
                endFormatter = new (0, $3F86Z$DateFormatter)(locale, endOptions);
            }
            return {
                start: startFormatter.format(startDate),
                end: endFormatter.format(endDate)
            };
        },
        getDateFormatter (locale, formatOptions) {
            let newOptions = {
                ...formatOpts,
                ...formatOptions
            };
            let newFormatOptions = (0, $1d0eb7b51dbf91aa$export$7e319ea407e63bc0)({}, newOptions);
            return new (0, $3F86Z$DateFormatter)(locale, newFormatOptions);
        }
    };
}
function $74e44fc0182e1a23$var$isCompleteRange(value) {
    return (value === null || value === void 0 ? void 0 : value.start) != null && value.end != null;
}


export {$74e44fc0182e1a23$export$e50a61c1de9f574 as useDateRangePickerState};
//# sourceMappingURL=useDateRangePickerState.js.map
