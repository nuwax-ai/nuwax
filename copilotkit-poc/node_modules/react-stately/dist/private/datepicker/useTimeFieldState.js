import {useDateFieldState as $8cbec91a0db21e26$export$60e84778edff6d26} from "./useDateFieldState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {Time as $2Kadp$Time, toZoned as $2Kadp$toZoned, toTime as $2Kadp$toTime, GregorianCalendar as $2Kadp$GregorianCalendar, today as $2Kadp$today, getLocalTimeZone as $2Kadp$getLocalTimeZone, toCalendarDateTime as $2Kadp$toCalendarDateTime} from "@internationalized/date";
import {useMemo as $2Kadp$useMemo, useCallback as $2Kadp$useCallback} from "react";

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



function $2c2a3876ef5967f8$export$fd53cef0cc796101(props) {
    let { placeholderValue: placeholderValue = new (0, $2Kadp$Time)(), minValue: minValue, maxValue: maxValue, defaultValue: defaultValue, granularity: granularity, validate: validate } = props;
    let [value, setValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.value, defaultValue !== null && defaultValue !== void 0 ? defaultValue : null, props.onChange);
    let v = value || placeholderValue;
    let day = v && 'day' in v ? v : undefined;
    let defaultValueTimeZone = defaultValue && 'timeZone' in defaultValue ? defaultValue.timeZone : undefined;
    let placeholderDate = (0, $2Kadp$useMemo)(()=>{
        let valueTimeZone = v && 'timeZone' in v ? v.timeZone : undefined;
        return (valueTimeZone || defaultValueTimeZone) && placeholderValue ? (0, $2Kadp$toZoned)($2c2a3876ef5967f8$var$convertValue(placeholderValue), valueTimeZone || defaultValueTimeZone) : $2c2a3876ef5967f8$var$convertValue(placeholderValue);
    }, [
        placeholderValue,
        v,
        defaultValueTimeZone
    ]);
    let minDate = (0, $2Kadp$useMemo)(()=>$2c2a3876ef5967f8$var$convertValue(minValue, day), [
        minValue,
        day
    ]);
    let maxDate = (0, $2Kadp$useMemo)(()=>$2c2a3876ef5967f8$var$convertValue(maxValue, day), [
        maxValue,
        day
    ]);
    let timeValue = (0, $2Kadp$useMemo)(()=>value && 'day' in value ? (0, $2Kadp$toTime)(value) : value, [
        value
    ]);
    let dateTime = (0, $2Kadp$useMemo)(()=>value == null ? null : $2c2a3876ef5967f8$var$convertValue(value), [
        value
    ]);
    let defaultDateTime = (0, $2Kadp$useMemo)(()=>defaultValue == null ? null : $2c2a3876ef5967f8$var$convertValue(defaultValue), [
        defaultValue
    ]);
    let onChange = (newValue)=>{
        setValue(day || defaultValueTimeZone ? newValue : newValue && (0, $2Kadp$toTime)(newValue));
    };
    let state = (0, $8cbec91a0db21e26$export$60e84778edff6d26)({
        ...props,
        value: dateTime,
        defaultValue: defaultDateTime,
        minValue: minDate,
        maxValue: maxDate,
        onChange: onChange,
        granularity: granularity || 'minute',
        maxGranularity: 'hour',
        placeholderValue: placeholderDate !== null && placeholderDate !== void 0 ? placeholderDate : undefined,
        // Calendar should not matter for time fields.
        createCalendar: ()=>new (0, $2Kadp$GregorianCalendar)(),
        validate: (0, $2Kadp$useCallback)(()=>validate === null || validate === void 0 ? void 0 : validate(value), [
            validate,
            value
        ])
    });
    return {
        ...state,
        timeValue: timeValue
    };
}
function $2c2a3876ef5967f8$var$convertValue(value, date = (0, $2Kadp$today)((0, $2Kadp$getLocalTimeZone)())) {
    if (!value) return null;
    if ('day' in value) return value;
    return (0, $2Kadp$toCalendarDateTime)(date, value);
}


export {$2c2a3876ef5967f8$export$fd53cef0cc796101 as useTimeFieldState};
//# sourceMappingURL=useTimeFieldState.js.map
