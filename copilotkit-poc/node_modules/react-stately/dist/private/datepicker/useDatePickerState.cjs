var $a28b96d16f1d77f4$exports = require("./utils.cjs");
var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $a359060d53fd4d72$exports = require("../overlays/useOverlayTriggerState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $5wmrC$internationalizeddate = require("@internationalized/date");
var $5wmrC$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDatePickerState", function () { return $10ab370a489c72f6$export$87194bb378cc3ac2; });
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





function $10ab370a489c72f6$export$87194bb378cc3ac2(props) {
    let overlayState = (0, $a359060d53fd4d72$exports.useOverlayTriggerState)(props);
    let [value, setValue] = (0, $14cedf286405cc4b$exports.useControlledState)(props.value, props.defaultValue || null, props.onChange);
    let [initialValue] = (0, $5wmrC$react.useState)(value);
    let v = value || props.placeholderValue || null;
    let [granularity, defaultTimeZone] = (0, $a28b96d16f1d77f4$exports.useDefaultProps)(v, props.granularity);
    let dateValue = value != null ? value.toDate(defaultTimeZone ?? 'UTC') : null;
    let hasTime = granularity === 'hour' || granularity === 'minute' || granularity === 'second';
    let shouldCloseOnSelect = props.shouldCloseOnSelect ?? true;
    let [selectedDate, setSelectedDate] = (0, $5wmrC$react.useState)(null);
    let [selectedTime, setSelectedTime] = (0, $5wmrC$react.useState)(null);
    if (value) {
        selectedDate = value;
        if ('hour' in value) selectedTime = value;
    }
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error('Invalid granularity ' + granularity + ' for value ' + v.toString());
    let showEra = value?.calendar.identifier === 'gregory' && value.era === 'BC';
    let formatOpts = (0, $5wmrC$react.useMemo)(()=>({
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
    let builtinValidation = (0, $5wmrC$react.useMemo)(()=>(0, $a28b96d16f1d77f4$exports.getValidationResult)(value, minValue, maxValue, isDateUnavailable, formatOpts), [
        value,
        minValue,
        maxValue,
        isDateUnavailable,
        formatOpts
    ]);
    let validation = (0, $a94d8588145c9b3d$exports.useFormValidationState)({
        ...props,
        value: value,
        builtinValidation: builtinValidation
    });
    let isValueInvalid = validation.displayValidation.isInvalid;
    let validationState = props.validationState || (isValueInvalid ? 'invalid' : null);
    let commitValue = (date, time)=>{
        setValue('timeZone' in time ? time.set((0, $5wmrC$internationalizeddate.toCalendarDate)(date)) : (0, $5wmrC$internationalizeddate.toCalendarDateTime)(date, time));
        setSelectedDate(null);
        setSelectedTime(null);
        validation.commitValidation();
    };
    // Intercept setValue to make sure the Time section is not changed by date selection in Calendar
    let selectDate = (newValue)=>{
        let shouldClose = typeof shouldCloseOnSelect === 'function' ? shouldCloseOnSelect() : shouldCloseOnSelect;
        if (hasTime) {
            if (selectedTime || shouldClose) commitValue(newValue, selectedTime || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.defaultValue || props.placeholderValue));
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
            if (!isOpen && !value && selectedDate && hasTime) commitValue(selectedDate, selectedTime || (0, $a28b96d16f1d77f4$exports.getPlaceholderTime)(props.defaultValue || props.placeholderValue));
            overlayState.setOpen(isOpen);
        },
        validationState: validationState,
        isInvalid: isValueInvalid,
        formatValue (locale, fieldOptions) {
            if (!dateValue) return '';
            let formatOptions = (0, $a28b96d16f1d77f4$exports.getFormatOptions)(fieldOptions, formatOpts);
            let formatter = new (0, $5wmrC$internationalizeddate.DateFormatter)(locale, formatOptions);
            return formatter.format(dateValue);
        },
        getDateFormatter (locale, formatOptions) {
            let newOptions = {
                ...formatOpts,
                ...formatOptions
            };
            let newFormatOptions = (0, $a28b96d16f1d77f4$exports.getFormatOptions)({}, newOptions);
            return new (0, $5wmrC$internationalizeddate.DateFormatter)(locale, newFormatOptions);
        }
    };
}


//# sourceMappingURL=useDatePickerState.cjs.map
