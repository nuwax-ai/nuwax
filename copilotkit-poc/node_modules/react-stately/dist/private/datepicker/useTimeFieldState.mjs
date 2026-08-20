import {useDateFieldState as $8e7461aabf74661f$export$60e84778edff6d26} from "./useDateFieldState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {Time as $hJUuQ$Time, toZoned as $hJUuQ$toZoned, toTime as $hJUuQ$toTime, GregorianCalendar as $hJUuQ$GregorianCalendar, today as $hJUuQ$today, getLocalTimeZone as $hJUuQ$getLocalTimeZone, toCalendarDateTime as $hJUuQ$toCalendarDateTime} from "@internationalized/date";
import {useMemo as $hJUuQ$useMemo, useCallback as $hJUuQ$useCallback} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $b822555cf9fe955c$export$fd53cef0cc796101(props) {
    let { placeholderValue: placeholderValue = new (0, $hJUuQ$Time)(), minValue: minValue, maxValue: maxValue, defaultValue: defaultValue, granularity: granularity, validate: validate } = props;
    let [value, setValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.value, defaultValue ?? null, props.onChange);
    let v = value || placeholderValue;
    let day = v && 'day' in v ? v : undefined;
    let defaultValueTimeZone = defaultValue && 'timeZone' in defaultValue ? defaultValue.timeZone : undefined;
    let placeholderDate = (0, $hJUuQ$useMemo)(()=>{
        let valueTimeZone = v && 'timeZone' in v ? v.timeZone : undefined;
        return (valueTimeZone || defaultValueTimeZone) && placeholderValue ? (0, $hJUuQ$toZoned)($b822555cf9fe955c$var$convertValue(placeholderValue), valueTimeZone || defaultValueTimeZone) : $b822555cf9fe955c$var$convertValue(placeholderValue);
    }, [
        placeholderValue,
        v,
        defaultValueTimeZone
    ]);
    let minDate = (0, $hJUuQ$useMemo)(()=>$b822555cf9fe955c$var$convertValue(minValue, day), [
        minValue,
        day
    ]);
    let maxDate = (0, $hJUuQ$useMemo)(()=>$b822555cf9fe955c$var$convertValue(maxValue, day), [
        maxValue,
        day
    ]);
    let timeValue = (0, $hJUuQ$useMemo)(()=>value && 'day' in value ? (0, $hJUuQ$toTime)(value) : value, [
        value
    ]);
    let dateTime = (0, $hJUuQ$useMemo)(()=>value == null ? null : $b822555cf9fe955c$var$convertValue(value), [
        value
    ]);
    let defaultDateTime = (0, $hJUuQ$useMemo)(()=>defaultValue == null ? null : $b822555cf9fe955c$var$convertValue(defaultValue), [
        defaultValue
    ]);
    let onChange = (newValue)=>{
        setValue(day || defaultValueTimeZone ? newValue : newValue && (0, $hJUuQ$toTime)(newValue));
    };
    let state = (0, $8e7461aabf74661f$export$60e84778edff6d26)({
        ...props,
        value: dateTime,
        defaultValue: defaultDateTime,
        minValue: minDate,
        maxValue: maxDate,
        onChange: onChange,
        granularity: granularity || 'minute',
        maxGranularity: 'hour',
        placeholderValue: placeholderDate ?? undefined,
        // Calendar should not matter for time fields.
        createCalendar: ()=>new (0, $hJUuQ$GregorianCalendar)(),
        validate: (0, $hJUuQ$useCallback)(()=>validate?.(value), [
            validate,
            value
        ])
    });
    return {
        ...state,
        timeValue: timeValue
    };
}
function $b822555cf9fe955c$var$convertValue(value, date = (0, $hJUuQ$today)((0, $hJUuQ$getLocalTimeZone)())) {
    if (!value) return null;
    if ('day' in value) return value;
    return (0, $hJUuQ$toCalendarDateTime)(date, value);
}


export {$b822555cf9fe955c$export$fd53cef0cc796101 as useTimeFieldState};
//# sourceMappingURL=useTimeFieldState.mjs.map
