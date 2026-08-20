var $a28b96d16f1d77f4$exports = require("./utils.cjs");
var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $a359060d53fd4d72$exports = require("../overlays/useOverlayTriggerState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $jLl00$internationalizeddate = require("@internationalized/date");
var $jLl00$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDateRangePickerState", function () { return $a5e429a6c495851a$export$e50a61c1de9f574; });
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





function $a5e429a6c495851a$export$e50a61c1de9f574(props) {
    let overlayState = (0, $a359060d53fd4d72$exports.useOverlayTriggerState)(props);
    let [controlledValue, setControlledValue] = (0, $14cedf286405cc4b$exports.useControlledState)(props.value, props.defaultValue || null, props.onChange);
    let [initialValue] = (0, $jLl00$react.useState)(controlledValue);
    let [placeholderValue, setPlaceholderValue] = (0, $jLl00$react.useState)(()=>controlledValue || {
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
        if ($a5e429a6c495851a$var$isCompleteRange(value)) setControlledValue(value);
        else setControlledValue(null);
    };
    let v = value?.start || value?.end || props.placeholderValue || null;
    let [granularity, defaultTimeZone] = (0, $a28b96d16f1d77f4$exports.useDefaultProps)(v, props.granularity);
    let hasTime = granularity === 'hour' || granularity === 'minute' || granularity === 'second';
    let shouldCloseOnSelect = props.shouldCloseOnSelect ?? true;
    let [dateRange, setSelectedDateRange] = (0, $jLl00$react.useState)(null);
    let [timeRange, setSelectedTimeRange] = (0, $jLl00$react.useState)(null);
    if (value && $a5e429a6c495851a$var$isCompleteRange(value)) {
        dateRange = value;
        if ('hour' in value.start) timeRange = value;
    }
    let commitValue = (dateRange, timeRange)=>{
        setValue({
            start: 'timeZone' in timeRange.start ? timeRange.start.set((0, $jLl00$internationalizeddate.toCalendarDate)(dateRange.start)) : (0, $jLl00$internationalizeddate.toCalendarDateTime)(dateRange.start, timeRange.start),
            end: 'timeZone' in timeRange.end ? timeRange.end.set((0, $jLl00$internationalizeddate.toCalendarDate)(dateRange.end)) : (0, $jLl00$internationalizeddate.toCalendarDateTime)(dateRange.end, timeRange.end)
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
            if ($a5e429a6c495851a$var$isCompleteRange(range) && (shouldClose || timeRange?.start && timeRange?.end)) commitValue(range, {
                start: timeRange?.start || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.placeholderValue),
                end: timeRange?.end || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.placeholderValue)
            });
            else setSelectedDateRange(range);
        } else if ($a5e429a6c495851a$var$isCompleteRange(range)) {
            setValue(range);
            validation.commitValidation();
        } else setSelectedDateRange(range);
        if (shouldClose) overlayState.setOpen(false);
    };
    let setTimeRange = (range)=>{
        if ($a5e429a6c495851a$var$isCompleteRange(dateRange) && $a5e429a6c495851a$var$isCompleteRange(range)) commitValue(dateRange, range);
        else setSelectedTimeRange(range);
    };
    let showEra = value?.start?.calendar.identifier === 'gregory' && value.start.era === 'BC' || value?.end?.calendar.identifier === 'gregory' && value.end.era === 'BC';
    let formatOpts = (0, $jLl00$react.useMemo)(()=>({
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
    let builtinValidation = (0, $jLl00$react.useMemo)(()=>(0, $a28b96d16f1d77f4$exports.getRangeValidationResult)(value, minValue, maxValue, isDateUnavailable ? (date)=>isDateUnavailable(date, null) : undefined, formatOpts), [
        value,
        minValue,
        maxValue,
        isDateUnavailable,
        formatOpts
    ]);
    let validation = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
        ...props,
        value: controlledValue,
        name: (0, $jLl00$react.useMemo)(()=>[
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
    return {
        ...validation,
        value: value,
        defaultValue: props.defaultValue ?? initialValue,
        setValue: setValue,
        dateRange: dateRange,
        timeRange: timeRange,
        granularity: granularity,
        hasTime: hasTime,
        setDate (part, date) {
            if (part === 'start') setDateRange({
                start: date,
                end: dateRange?.end ?? null
            });
            else setDateRange({
                start: dateRange?.start ?? null,
                end: date
            });
        },
        setTime (part, time) {
            if (part === 'start') setTimeRange({
                start: time,
                end: timeRange?.end ?? null
            });
            else setTimeRange({
                start: timeRange?.start ?? null,
                end: time
            });
        },
        setDateTime (part, dateTime) {
            if (part === 'start') setValue({
                start: dateTime,
                end: value?.end ?? null
            });
            else setValue({
                start: value?.start ?? null,
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
            if (!isOpen && !(value?.start && value?.end) && $a5e429a6c495851a$var$isCompleteRange(dateRange) && hasTime) commitValue(dateRange, {
                start: timeRange?.start || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.placeholderValue),
                end: timeRange?.end || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.placeholderValue)
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
            let startOptions = (0, $a28b96d16f1d77f4$exports.getFormatOptions)(fieldOptions, {
                granularity: startGranularity,
                timeZone: startTimeZone,
                hideTimeZone: props.hideTimeZone,
                hourCycle: props.hourCycle,
                showEra: value.start.calendar.identifier === 'gregory' && value.start.era === 'BC' || value.end.calendar.identifier === 'gregory' && value.end.era === 'BC'
            });
            let startDate = value.start.toDate(startTimeZone || 'UTC');
            let endDate = value.end.toDate(endTimeZone || 'UTC');
            let startFormatter = new (0, $jLl00$internationalizeddate.DateFormatter)(locale, startOptions);
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
                let endOptions = (0, $a28b96d16f1d77f4$exports.getFormatOptions)(fieldOptions, {
                    granularity: endGranularity,
                    timeZone: endTimeZone,
                    hideTimeZone: props.hideTimeZone,
                    hourCycle: props.hourCycle
                });
                endFormatter = new (0, $jLl00$internationalizeddate.DateFormatter)(locale, endOptions);
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
            let newFormatOptions = (0, $a28b96d16f1d77f4$exports.getFormatOptions)({}, newOptions);
            return new (0, $jLl00$internationalizeddate.DateFormatter)(locale, newFormatOptions);
        }
    };
}
function $a5e429a6c495851a$var$isCompleteRange(value) {
    return value?.start != null && value.end != null;
}


//# sourceMappingURL=useDateRangePickerState.cjs.map
