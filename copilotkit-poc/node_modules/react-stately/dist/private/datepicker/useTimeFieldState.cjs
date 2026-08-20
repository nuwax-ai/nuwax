var $da70d3462bca6ef3$exports = require("./useDateFieldState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $5R7r3$internationalizeddate = require("@internationalized/date");
var $5R7r3$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTimeFieldState", function () { return $fd3ae5d1dfc930a9$export$fd53cef0cc796101; });
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



function $fd3ae5d1dfc930a9$export$fd53cef0cc796101(props) {
    let { placeholderValue: placeholderValue = new (0, $5R7r3$internationalizeddate.Time)(), minValue: minValue, maxValue: maxValue, defaultValue: defaultValue, granularity: granularity, validate: validate } = props;
    let [value, setValue] = (0, $14cedf286405cc4b$exports.useControlledState)(props.value, defaultValue ?? null, props.onChange);
    let v = value || placeholderValue;
    let day = v && 'day' in v ? v : undefined;
    let defaultValueTimeZone = defaultValue && 'timeZone' in defaultValue ? defaultValue.timeZone : undefined;
    let placeholderDate = (0, $5R7r3$react.useMemo)(()=>{
        let valueTimeZone = v && 'timeZone' in v ? v.timeZone : undefined;
        return (valueTimeZone || defaultValueTimeZone) && placeholderValue ? (0, $5R7r3$internationalizeddate.toZoned)($fd3ae5d1dfc930a9$var$convertValue(placeholderValue), valueTimeZone || defaultValueTimeZone) : $fd3ae5d1dfc930a9$var$convertValue(placeholderValue);
    }, [
        placeholderValue,
        v,
        defaultValueTimeZone
    ]);
    let minDate = (0, $5R7r3$react.useMemo)(()=>$fd3ae5d1dfc930a9$var$convertValue(minValue, day), [
        minValue,
        day
    ]);
    let maxDate = (0, $5R7r3$react.useMemo)(()=>$fd3ae5d1dfc930a9$var$convertValue(maxValue, day), [
        maxValue,
        day
    ]);
    let timeValue = (0, $5R7r3$react.useMemo)(()=>value && 'day' in value ? (0, $5R7r3$internationalizeddate.toTime)(value) : value, [
        value
    ]);
    let dateTime = (0, $5R7r3$react.useMemo)(()=>value == null ? null : $fd3ae5d1dfc930a9$var$convertValue(value), [
        value
    ]);
    let defaultDateTime = (0, $5R7r3$react.useMemo)(()=>defaultValue == null ? null : $fd3ae5d1dfc930a9$var$convertValue(defaultValue), [
        defaultValue
    ]);
    let onChange = (newValue)=>{
        setValue(day || defaultValueTimeZone ? newValue : newValue && (0, $5R7r3$internationalizeddate.toTime)(newValue));
    };
    let state = (0, $da70d3462bca6ef3$exports.useDateFieldState)({
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
        createCalendar: ()=>new (0, $5R7r3$internationalizeddate.GregorianCalendar)(),
        validate: (0, $5R7r3$react.useCallback)(()=>validate?.(value), [
            validate,
            value
        ])
    });
    return {
        ...state,
        timeValue: timeValue
    };
}
function $fd3ae5d1dfc930a9$var$convertValue(value, date = (0, $5R7r3$internationalizeddate.today)((0, $5R7r3$internationalizeddate.getLocalTimeZone)())) {
    if (!value) return null;
    if ('day' in value) return value;
    return (0, $5R7r3$internationalizeddate.toCalendarDateTime)(date, value);
}


//# sourceMappingURL=useTimeFieldState.cjs.map
