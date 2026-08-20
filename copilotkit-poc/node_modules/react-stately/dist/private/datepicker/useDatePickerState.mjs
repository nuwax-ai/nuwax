import {getFormatOptions as $8b141f2f71e88f85$export$7e319ea407e63bc0, getPlaceholderTime as $8b141f2f71e88f85$export$c5221a78ef73c5e9, getValidationResult as $8b141f2f71e88f85$export$f18627323ab57ac0, useDefaultProps as $8b141f2f71e88f85$export$2440da353cedad43} from "./utils.mjs";
import {useFormValidationState as $fd2148440a13ec26$export$fc1a364ae1f3ff10} from "../form/useFormValidationState.mjs";
import {useOverlayTriggerState as $f11fb0bcf1b2687a$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {toCalendarDate as $gC1o7$toCalendarDate, toCalendarDateTime as $gC1o7$toCalendarDateTime, DateFormatter as $gC1o7$DateFormatter} from "@internationalized/date";
import {useState as $gC1o7$useState, useMemo as $gC1o7$useMemo} from "react";

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





function $28aae683a942e141$export$87194bb378cc3ac2(props) {
    let overlayState = (0, $f11fb0bcf1b2687a$export$61c6a8c84e605fb6)(props);
    let [value, setValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.value, props.defaultValue || null, props.onChange);
    let [initialValue] = (0, $gC1o7$useState)(value);
    let v = value || props.placeholderValue || null;
    let [granularity, defaultTimeZone] = (0, $8b141f2f71e88f85$export$2440da353cedad43)(v, props.granularity);
    let dateValue = value != null ? value.toDate(defaultTimeZone ?? 'UTC') : null;
    let hasTime = granularity === 'hour' || granularity === 'minute' || granularity === 'second';
    let shouldCloseOnSelect = props.shouldCloseOnSelect ?? true;
    let [selectedDate, setSelectedDate] = (0, $gC1o7$useState)(null);
    let [selectedTime, setSelectedTime] = (0, $gC1o7$useState)(null);
    if (value) {
        selectedDate = value;
        if ('hour' in value) selectedTime = value;
    }
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error('Invalid granularity ' + granularity + ' for value ' + v.toString());
    let showEra = value?.calendar.identifier === 'gregory' && value.era === 'BC';
    let formatOpts = (0, $gC1o7$useMemo)(()=>({
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
    let builtinValidation = (0, $gC1o7$useMemo)(()=>(0, $8b141f2f71e88f85$export$f18627323ab57ac0)(value, minValue, maxValue, isDateUnavailable, formatOpts), [
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
    let commitValue = (date, time)=>{
        setValue('timeZone' in time ? time.set((0, $gC1o7$toCalendarDate)(date)) : (0, $gC1o7$toCalendarDateTime)(date, time));
        setSelectedDate(null);
        setSelectedTime(null);
        validation.commitValidation();
    };
    // Intercept setValue to make sure the Time section is not changed by date selection in Calendar
    let selectDate = (newValue)=>{
        let shouldClose = typeof shouldCloseOnSelect === 'function' ? shouldCloseOnSelect() : shouldCloseOnSelect;
        if (hasTime) {
            if (selectedTime || shouldClose) commitValue(newValue, selectedTime || (0, $8b141f2f71e88f85$export$c5221a78ef73c5e9)(props.defaultValue || props.placeholderValue));
            else setSelectedDate(newValue);
        } else {
            setValue(newValue);
            validation.commitValidation();
        }
        if (shouldClose) overlayState.setOpen(false);
    };
    let selectTime = (newValue)=>{
        if (selectedDate && newValue) commitValue(selectedDate, newValue);
        else setSelectedTime(newValue);
    };
    return {
        ...validation,
        value: value,
        defaultValue: props.defaultValue ?? initialValue,
        setValue: setValue,
        dateValue: selectedDate,
        timeValue: selectedTime,
        setDateValue: selectDate,
        setTimeValue: selectTime,
        granularity: granularity,
        hasTime: hasTime,
        ...overlayState,
        setOpen (isOpen) {
            // Commit the selected date when the calendar is closed. Use a placeholder time if one wasn't set.
            // If only the time was set and not the date, don't commit. The state will be preserved until
            // the user opens the popover again.
            if (!isOpen && !value && selectedDate && hasTime) commitValue(selectedDate, selectedTime || (0, $8b141f2f71e88f85$export$c5221a78ef73c5e9)(props.defaultValue || props.placeholderValue));
            overlayState.setOpen(isOpen);
        },
        validationState: validationState,
        isInvalid: isValueInvalid,
        formatValue (locale, fieldOptions) {
            if (!dateValue) return '';
            let formatOptions = (0, $8b141f2f71e88f85$export$7e319ea407e63bc0)(fieldOptions, formatOpts);
            let formatter = new (0, $gC1o7$DateFormatter)(locale, formatOptions);
            return formatter.format(dateValue);
        },
        getDateFormatter (locale, formatOptions) {
            let newOptions = {
                ...formatOpts,
                ...formatOptions
            };
            let newFormatOptions = (0, $8b141f2f71e88f85$export$7e319ea407e63bc0)({}, newOptions);
            return new (0, $gC1o7$DateFormatter)(locale, newFormatOptions);
        }
    };
}


export {$28aae683a942e141$export$87194bb378cc3ac2 as useDatePickerState};
//# sourceMappingURL=useDatePickerState.mjs.map
