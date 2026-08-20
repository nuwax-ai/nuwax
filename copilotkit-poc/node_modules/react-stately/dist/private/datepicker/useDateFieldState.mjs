import {convertValue as $8b141f2f71e88f85$export$61a490a80c552550, createPlaceholderDate as $8b141f2f71e88f85$export$66aa2b09de4b1ea5, getFormatOptions as $8b141f2f71e88f85$export$7e319ea407e63bc0, getValidationResult as $8b141f2f71e88f85$export$f18627323ab57ac0, useDefaultProps as $8b141f2f71e88f85$export$2440da353cedad43} from "./utils.mjs";
import {useFormValidationState as $fd2148440a13ec26$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.mjs";
import {getPlaceholder as $8e5fbb9a25791ca0$export$d3f5c5e0a5023fa0} from "./placeholders.mjs";
import {IncompleteDate as $0e8931c783099b4f$export$ae165b50d181e1ef} from "./IncompleteDate.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {DateFormatter as $cV3Es$DateFormatter, isEqualCalendar as $cV3Es$isEqualCalendar, toCalendar as $cV3Es$toCalendar, GregorianCalendar as $cV3Es$GregorianCalendar} from "@internationalized/date";
import {NumberFormatter as $cV3Es$NumberFormatter} from "@internationalized/number";
import {useMemo as $cV3Es$useMemo, useState as $cV3Es$useState} from "react";

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







const $8e7461aabf74661f$var$EDITABLE_SEGMENTS = {
    year: true,
    month: true,
    day: true,
    hour: true,
    minute: true,
    second: true,
    dayPeriod: true,
    era: true
};
const $8e7461aabf74661f$var$PAGE_STEP = {
    year: 5,
    month: 2,
    day: 7,
    hour: 2,
    minute: 15,
    second: 15
};
const $8e7461aabf74661f$var$TYPE_MAPPING = {
    // Node seems to convert everything to lowercase...
    dayperiod: 'dayPeriod',
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts#named_years
    relatedYear: 'year',
    yearName: 'literal',
    unknown: 'literal'
};
function $8e7461aabf74661f$export$60e84778edff6d26(props) {
    let { locale: locale, createCalendar: createCalendar, hideTimeZone: hideTimeZone, isDisabled: isDisabled = false, isReadOnly: isReadOnly = false, isRequired: isRequired = false, minValue: minValue, maxValue: maxValue, isDateUnavailable: isDateUnavailable } = props;
    let v = props.value || props.defaultValue || props.placeholderValue || null;
    let [granularity, defaultTimeZone] = (0, $8b141f2f71e88f85$export$2440da353cedad43)(v, props.granularity);
    let timeZone = defaultTimeZone || 'UTC';
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error('Invalid granularity ' + granularity + ' for value ' + v.toString());
    // Resolve default hour cycle and calendar system.
    let [calendar, hourCycle] = (0, $cV3Es$useMemo)(()=>{
        let formatter = new (0, $cV3Es$DateFormatter)(locale, {
            dateStyle: 'short',
            timeStyle: 'short',
            hour12: props.hourCycle != null ? props.hourCycle === 12 : undefined
        });
        let opts = formatter.resolvedOptions();
        let calendar = createCalendar(opts.calendar);
        return [
            calendar,
            opts.hourCycle
        ];
    }, [
        locale,
        props.hourCycle,
        createCalendar
    ]);
    let [value, setDate] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.value, props.defaultValue ?? null, props.onChange);
    let [initialValue] = (0, $cV3Es$useState)(value);
    let calendarValue = (0, $cV3Es$useMemo)(()=>(0, $8b141f2f71e88f85$export$61a490a80c552550)(value, calendar) ?? null, [
        value,
        calendar
    ]);
    let [displayValue, setDisplayValue] = (0, $cV3Es$useState)(()=>new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue));
    let showEra = calendar.identifier === 'gregory' && displayValue.era === 'BC';
    let formatOpts = (0, $cV3Es$useMemo)(()=>({
            granularity: granularity,
            maxGranularity: props.maxGranularity ?? 'year',
            timeZone: defaultTimeZone,
            hideTimeZone: hideTimeZone,
            hourCycle: props.hourCycle,
            showEra: showEra,
            shouldForceLeadingZeros: props.shouldForceLeadingZeros
        }), [
        props.maxGranularity,
        granularity,
        props.hourCycle,
        props.shouldForceLeadingZeros,
        defaultTimeZone,
        hideTimeZone,
        showEra
    ]);
    let opts = (0, $cV3Es$useMemo)(()=>(0, $8b141f2f71e88f85$export$7e319ea407e63bc0)({}, formatOpts), [
        formatOpts
    ]);
    let dateFormatter = (0, $cV3Es$useMemo)(()=>new (0, $cV3Es$DateFormatter)(locale, opts), [
        locale,
        opts
    ]);
    let resolvedOptions = (0, $cV3Es$useMemo)(()=>dateFormatter.resolvedOptions(), [
        dateFormatter
    ]);
    let placeholder = (0, $cV3Es$useMemo)(()=>(0, $8b141f2f71e88f85$export$66aa2b09de4b1ea5)(props.placeholderValue, granularity, calendar, defaultTimeZone), [
        props.placeholderValue,
        granularity,
        calendar,
        defaultTimeZone
    ]);
    let displaySegments = (0, $cV3Es$useMemo)(()=>{
        let is12HourClock = hourCycle === 'h11' || hourCycle === 'h12';
        let segments = [
            'era',
            'year',
            'month',
            'day',
            'hour',
            ...is12HourClock ? [
                'dayPeriod'
            ] : [],
            'minute',
            'second'
        ];
        let minIndex = segments.indexOf(props.maxGranularity || 'era');
        let maxIndex = segments.indexOf(granularity === 'hour' && is12HourClock ? 'dayPeriod' : granularity);
        return segments.slice(minIndex, maxIndex + 1);
    }, [
        props.maxGranularity,
        granularity,
        hourCycle
    ]);
    let [lastValue, setLastValue] = (0, $cV3Es$useState)(calendarValue);
    let [lastCalendar, setLastCalendar] = (0, $cV3Es$useState)(calendar);
    let [lastHourCycle, setLastHourCycle] = (0, $cV3Es$useState)(hourCycle);
    if (calendarValue !== lastValue || hourCycle !== lastHourCycle || !(0, $cV3Es$isEqualCalendar)(calendar, lastCalendar)) {
        displayValue = new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue);
        setLastValue(calendarValue);
        setLastCalendar(calendar);
        setLastHourCycle(hourCycle);
        setDisplayValue(displayValue);
    }
    let setValue = (newValue)=>{
        if (props.isDisabled || props.isReadOnly) return;
        if (newValue == null || newValue instanceof (0, $0e8931c783099b4f$export$ae165b50d181e1ef) && newValue.isCleared(displaySegments)) {
            setDisplayValue(new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue));
            setDate(null);
        } else if (!(newValue instanceof (0, $0e8931c783099b4f$export$ae165b50d181e1ef))) {
            // The display calendar should not have any effect on the emitted value.
            // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
            newValue = (0, $cV3Es$toCalendar)(newValue, v?.calendar || new (0, $cV3Es$GregorianCalendar)());
            setDisplayValue(new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue));
            setDate(newValue);
        } else {
            // If the new value is complete and valid, trigger onChange eagerly.
            // If it represents an incomplete or invalid value (e.g. February 30th),
            // wait until the field is blurred to trigger onChange.
            if (newValue.isComplete(displaySegments)) {
                let dateValue = newValue.toValue(calendarValue ?? placeholder);
                if (newValue.validate(dateValue, displaySegments)) {
                    let newDateValue = (0, $cV3Es$toCalendar)(dateValue, v?.calendar || new (0, $cV3Es$GregorianCalendar)());
                    if (!value || newDateValue.compare(value) !== 0) {
                        setDisplayValue(new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue)); // reset in case prop isn't updated
                        setDate(newDateValue);
                        return;
                    }
                }
            }
            // Incomplete/invalid value. Set temporary display override.
            setDisplayValue(newValue);
        }
    };
    let dateValue = (0, $cV3Es$useMemo)(()=>{
        let v = displayValue.toValue(calendarValue ?? placeholder);
        return v.toDate(timeZone);
    }, [
        displayValue,
        timeZone,
        calendarValue,
        placeholder
    ]);
    let segments = (0, $cV3Es$useMemo)(()=>$8e7461aabf74661f$var$processSegments(dateValue, displayValue, dateFormatter, resolvedOptions, calendar, locale, granularity), [
        dateValue,
        dateFormatter,
        resolvedOptions,
        displayValue,
        calendar,
        locale,
        granularity
    ]);
    let adjustSegment = (type, amount)=>{
        setValue(displayValue.cycle(type, amount, placeholder, displaySegments));
    };
    let builtinValidation = (0, $cV3Es$useMemo)(()=>(0, $8b141f2f71e88f85$export$f18627323ab57ac0)(value, minValue, maxValue, isDateUnavailable, formatOpts), [
        value,
        minValue,
        maxValue,
        isDateUnavailable,
        formatOpts
    ]);
    let validation = (0, $fd2148440a13ec26$export$fc1a364ae1f3ff10)({
        ...props,
        value: value,
        builtinValidation: builtinValidation
    });
    let isValueInvalid = validation.displayValidation.isInvalid;
    let validationState = props.validationState || (isValueInvalid ? 'invalid' : null);
    return {
        ...validation,
        value: calendarValue,
        defaultValue: props.defaultValue ?? initialValue,
        dateValue: dateValue,
        calendar: calendar,
        setValue: setValue,
        segments: segments,
        dateFormatter: dateFormatter,
        validationState: validationState,
        isInvalid: isValueInvalid,
        granularity: granularity,
        maxGranularity: props.maxGranularity ?? 'year',
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isRequired: isRequired,
        increment (part) {
            adjustSegment(part, 1);
        },
        decrement (part) {
            adjustSegment(part, -1);
        },
        incrementPage (part) {
            adjustSegment(part, $8e7461aabf74661f$var$PAGE_STEP[part] || 1);
        },
        decrementPage (part) {
            adjustSegment(part, -($8e7461aabf74661f$var$PAGE_STEP[part] || 1));
        },
        incrementToMax (part) {
            let maxValue = part === 'hour' && hourCycle === 'h12' ? 11 : displayValue.getSegmentLimits(part).maxValue;
            setValue(displayValue.set(part, maxValue, placeholder));
        },
        decrementToMin (part) {
            let minValue = part === 'hour' && hourCycle === 'h12' ? 12 : displayValue.getSegmentLimits(part).minValue;
            setValue(displayValue.set(part, minValue, placeholder));
        },
        setSegment (part, v) {
            setValue(displayValue.set(part, v, placeholder));
        },
        confirmPlaceholder () {
            if (props.isDisabled || props.isReadOnly) return;
            // If the display value is complete but invalid, we need to constrain it and emit onChange on blur.
            if (displayValue.isComplete(displaySegments)) {
                let dateValue = displayValue.toValue(calendarValue ?? placeholder);
                let newDateValue = (0, $cV3Es$toCalendar)(dateValue, v?.calendar || new (0, $cV3Es$GregorianCalendar)());
                if (!value || newDateValue.compare(value) !== 0) setDate(newDateValue);
                setDisplayValue(new (0, $0e8931c783099b4f$export$ae165b50d181e1ef)(calendar, hourCycle, calendarValue));
            }
        },
        clearSegment (part) {
            let value = displayValue;
            if (part !== 'timeZoneName' && part !== 'literal') value = displayValue.clear(part);
            setValue(value);
        },
        formatValue (fieldOptions) {
            if (!calendarValue) return '';
            let formatOptions = (0, $8b141f2f71e88f85$export$7e319ea407e63bc0)(fieldOptions, formatOpts);
            let formatter = new (0, $cV3Es$DateFormatter)(locale, formatOptions);
            return formatter.format(dateValue);
        },
        getDateFormatter (locale, formatOptions) {
            let newOptions = {
                ...formatOpts,
                ...formatOptions
            };
            let newFormatOptions = (0, $8b141f2f71e88f85$export$7e319ea407e63bc0)({}, newOptions);
            return new (0, $cV3Es$DateFormatter)(locale, newFormatOptions);
        }
    };
}
function $8e7461aabf74661f$var$processSegments(dateValue, displayValue, dateFormatter, resolvedOptions, calendar, locale, granularity) {
    let timeValue = [
        'hour',
        'minute',
        'second'
    ];
    let segments = dateFormatter.formatToParts(dateValue);
    // In order to allow formatting temporarily invalid dates during editing (e.g. February 30th),
    // use a NumberFormatter to manually format segments directly from raw numbers.
    // When the user blurs the date field, the invalid segments will be constrained.
    let numberFormatter = new (0, $cV3Es$NumberFormatter)(locale, {
        useGrouping: false
    });
    let twoDigitFormatter = new (0, $cV3Es$NumberFormatter)(locale, {
        useGrouping: false,
        minimumIntegerDigits: 2
    });
    for (let segment of segments)if (segment.type === 'year' || segment.type === 'month' || segment.type === 'day' || segment.type === 'hour') {
        let value = displayValue[segment.type] ?? 0;
        if (resolvedOptions[segment.type] === '2-digit') segment.value = twoDigitFormatter.format(value);
        else segment.value = numberFormatter.format(value);
    }
    let processedSegments = [];
    for (let segment of segments){
        let type = $8e7461aabf74661f$var$TYPE_MAPPING[segment.type] || segment.type;
        let isEditable = $8e7461aabf74661f$var$EDITABLE_SEGMENTS[type];
        if (type === 'era' && calendar.getEras().length === 1) isEditable = false;
        let isPlaceholder = $8e7461aabf74661f$var$EDITABLE_SEGMENTS[type] && displayValue[segment.type] == null;
        let placeholder = $8e7461aabf74661f$var$EDITABLE_SEGMENTS[type] ? (0, $8e5fbb9a25791ca0$export$d3f5c5e0a5023fa0)(type, segment.value, locale) : null;
        let dateSegment = {
            type: type,
            text: isPlaceholder ? placeholder : segment.value,
            ...displayValue.getSegmentLimits(type),
            isPlaceholder: isPlaceholder,
            placeholder: placeholder,
            isEditable: isEditable
        };
        // There is an issue in RTL languages where time fields render (minute:hour) instead of (hour:minute).
        // To force an LTR direction on the time field since, we wrap the time segments in LRI (left-to-right) isolate unicode. See https://www.w3.org/International/questions/qa-bidi-unicode-controls.
        // These unicode characters will be added to the array of processed segments as literals and will mark the start and end of the embedded direction change.
        if (type === 'hour') {
            // This marks the start of the embedded direction change.
            processedSegments.push({
                type: 'literal',
                text: '\u2066',
                isPlaceholder: false,
                placeholder: '',
                isEditable: false
            });
            processedSegments.push(dateSegment);
            // This marks the end of the embedded direction change in the case that the granularity it set to "hour".
            if (type === granularity) processedSegments.push({
                type: 'literal',
                text: '\u2069',
                isPlaceholder: false,
                placeholder: '',
                isEditable: false
            });
        } else if (timeValue.includes(type) && type === granularity) {
            processedSegments.push(dateSegment);
            // This marks the end of the embedded direction change.
            processedSegments.push({
                type: 'literal',
                text: '\u2069',
                isPlaceholder: false,
                placeholder: '',
                isEditable: false
            });
        } else // We only want to "wrap" the unicode around segments that are hour, minute, or second. If they aren't, just process as normal.
        processedSegments.push(dateSegment);
    }
    return processedSegments;
}


export {$8e7461aabf74661f$export$60e84778edff6d26 as useDateFieldState};
//# sourceMappingURL=useDateFieldState.mjs.map
