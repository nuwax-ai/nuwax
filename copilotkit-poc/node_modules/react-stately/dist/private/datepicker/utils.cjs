var $c9364273cf1f2f0a$exports = require("./intlStrings.cjs");
var $a94d8588145c9b3d$exports = require("../form/useFormValidationState.cjs");
var $imdVu$internationalizeddate = require("@internationalized/date");
var $imdVu$internationalizedstring = require("@internationalized/string");
var $imdVu$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "getValidationResult", function () { return $a28b96d16f1d77f4$export$f18627323ab57ac0; });
$parcel$export(module.exports, "getFormatOptions", function () { return $a28b96d16f1d77f4$export$7e319ea407e63bc0; });
$parcel$export(module.exports, "getRangeValidationResult", function () { return $a28b96d16f1d77f4$export$80ff8fc0ae339c13; });
$parcel$export(module.exports, "getPlaceholderTime", function () { return $a28b96d16f1d77f4$export$c5221a78ef73c5e9; });
$parcel$export(module.exports, "convertValue", function () { return $a28b96d16f1d77f4$export$61a490a80c552550; });
$parcel$export(module.exports, "createPlaceholderDate", function () { return $a28b96d16f1d77f4$export$66aa2b09de4b1ea5; });
$parcel$export(module.exports, "useDefaultProps", function () { return $a28b96d16f1d77f4$export$2440da353cedad43; });
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




const $a28b96d16f1d77f4$var$dictionary = new (0, $imdVu$internationalizedstring.LocalizedStringDictionary)((0, ($parcel$interopDefault($c9364273cf1f2f0a$exports))));
function $a28b96d16f1d77f4$var$getLocale() {
    // Match browser language setting here, NOT react-aria's I18nProvider, so that we match other browser-provided
    // validation messages, which to not respect our provider's language.
    let locale = // @ts-ignore
    typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage) || 'en-US';
    try {
        Intl.DateTimeFormat.supportedLocalesOf([
            locale
        ]);
    } catch  {
        locale = 'en-US';
    }
    return locale;
}
function $a28b96d16f1d77f4$export$f18627323ab57ac0(value, minValue, maxValue, isDateUnavailable, options) {
    let rangeOverflow = value != null && maxValue != null && value.compare(maxValue) > 0;
    let rangeUnderflow = value != null && minValue != null && value.compare(minValue) < 0;
    let isUnavailable = value != null && isDateUnavailable?.(value) || false;
    let isInvalid = rangeOverflow || rangeUnderflow || isUnavailable;
    let errors = [];
    if (isInvalid) {
        let locale = $a28b96d16f1d77f4$var$getLocale();
        let strings = (0, $imdVu$internationalizedstring.LocalizedStringDictionary).getGlobalDictionaryForPackage('@react-stately/datepicker') || $a28b96d16f1d77f4$var$dictionary;
        let formatter = new (0, $imdVu$internationalizedstring.LocalizedStringFormatter)(locale, strings);
        let dateFormatter = new (0, $imdVu$internationalizeddate.DateFormatter)(locale, $a28b96d16f1d77f4$export$7e319ea407e63bc0({}, options));
        let timeZone = dateFormatter.resolvedOptions().timeZone;
        if (rangeUnderflow && minValue != null) errors.push(formatter.format('rangeUnderflow', {
            minValue: dateFormatter.format(minValue.toDate(timeZone))
        }));
        if (rangeOverflow && maxValue != null) errors.push(formatter.format('rangeOverflow', {
            maxValue: dateFormatter.format(maxValue.toDate(timeZone))
        }));
        if (isUnavailable) errors.push(formatter.format('unavailableDate'));
    }
    return {
        isInvalid: isInvalid,
        validationErrors: errors,
        validationDetails: {
            badInput: isUnavailable,
            customError: false,
            patternMismatch: false,
            rangeOverflow: rangeOverflow,
            rangeUnderflow: rangeUnderflow,
            stepMismatch: false,
            tooLong: false,
            tooShort: false,
            typeMismatch: false,
            valueMissing: false,
            valid: !isInvalid
        }
    };
}
function $a28b96d16f1d77f4$export$80ff8fc0ae339c13(value, minValue, maxValue, isDateUnavailable, options) {
    let startValidation = $a28b96d16f1d77f4$export$f18627323ab57ac0(value?.start ?? null, minValue, maxValue, isDateUnavailable, options);
    let endValidation = $a28b96d16f1d77f4$export$f18627323ab57ac0(value?.end ?? null, minValue, maxValue, isDateUnavailable, options);
    let result = (0, $a94d8588145c9b3d$exports.mergeValidation)(startValidation, endValidation);
    if (value?.end != null && value.start != null && value.end.compare(value.start) < 0) {
        let strings = (0, $imdVu$internationalizedstring.LocalizedStringDictionary).getGlobalDictionaryForPackage('@react-stately/datepicker') || $a28b96d16f1d77f4$var$dictionary;
        result = (0, $a94d8588145c9b3d$exports.mergeValidation)(result, {
            isInvalid: true,
            validationErrors: [
                strings.getStringForLocale('rangeReversed', $a28b96d16f1d77f4$var$getLocale())
            ],
            validationDetails: {
                ...(0, $a94d8588145c9b3d$exports.VALID_VALIDITY_STATE),
                rangeUnderflow: true,
                rangeOverflow: true,
                valid: false
            }
        });
    }
    return result;
}
const $a28b96d16f1d77f4$var$DEFAULT_FIELD_OPTIONS = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
};
const $a28b96d16f1d77f4$var$TWO_DIGIT_FIELD_OPTIONS = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};
function $a28b96d16f1d77f4$export$7e319ea407e63bc0(fieldOptions, options) {
    let defaultFieldOptions = options.shouldForceLeadingZeros ? $a28b96d16f1d77f4$var$TWO_DIGIT_FIELD_OPTIONS : $a28b96d16f1d77f4$var$DEFAULT_FIELD_OPTIONS;
    fieldOptions = {
        ...defaultFieldOptions,
        ...fieldOptions
    };
    let granularity = options.granularity || 'minute';
    let keys = Object.keys(fieldOptions);
    let startIdx = keys.indexOf(options.maxGranularity ?? 'year');
    if (startIdx < 0) startIdx = 0;
    let endIdx = keys.indexOf(granularity);
    if (endIdx < 0) endIdx = 2;
    if (startIdx > endIdx) throw new Error('maxGranularity must be greater than granularity');
    let opts = keys.slice(startIdx, endIdx + 1).reduce((opts, key)=>{
        opts[key] = fieldOptions[key];
        return opts;
    }, {});
    if (options.hourCycle != null) opts.hour12 = options.hourCycle === 12;
    opts.timeZone = options.timeZone || 'UTC';
    let hasTime = granularity === 'hour' || granularity === 'minute' || granularity === 'second';
    if (hasTime && options.timeZone && !options.hideTimeZone) opts.timeZoneName = 'short';
    if (options.showEra && startIdx === 0) opts.era = 'short';
    return opts;
}
function $a28b96d16f1d77f4$export$c5221a78ef73c5e9(placeholderValue) {
    if (placeholderValue && 'hour' in placeholderValue) return placeholderValue;
    return new (0, $imdVu$internationalizeddate.Time)();
}
function $a28b96d16f1d77f4$export$61a490a80c552550(value, calendar) {
    if (value === null) return null;
    if (!value) return undefined;
    return (0, $imdVu$internationalizeddate.toCalendar)(value, calendar);
}
function $a28b96d16f1d77f4$export$66aa2b09de4b1ea5(placeholderValue, granularity, calendar, timeZone) {
    if (placeholderValue) return $a28b96d16f1d77f4$export$61a490a80c552550(placeholderValue, calendar);
    let date = (0, $imdVu$internationalizeddate.toCalendar)((0, $imdVu$internationalizeddate.now)(timeZone ?? (0, $imdVu$internationalizeddate.getLocalTimeZone)()).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }), calendar);
    if (granularity === 'year' || granularity === 'month' || granularity === 'day') return (0, $imdVu$internationalizeddate.toCalendarDate)(date);
    if (!timeZone) return (0, $imdVu$internationalizeddate.toCalendarDateTime)(date);
    return date;
}
function $a28b96d16f1d77f4$export$2440da353cedad43(v, granularity) {
    // Compute default granularity and time zone from the value. If the value becomes null, keep the last values.
    let defaultTimeZone = v && 'timeZone' in v ? v.timeZone : undefined;
    let defaultGranularity = v && 'minute' in v ? 'minute' : 'day';
    // props.granularity must actually exist in the value if one is provided.
    if (v && granularity && !(granularity in v)) throw new Error('Invalid granularity ' + granularity + ' for value ' + v.toString());
    let [lastValue, setLastValue] = (0, $imdVu$react.useState)([
        defaultGranularity,
        defaultTimeZone
    ]);
    // If the granularity or time zone changed, update the last value.
    if (v && (lastValue[0] !== defaultGranularity || lastValue[1] !== defaultTimeZone)) setLastValue([
        defaultGranularity,
        defaultTimeZone
    ]);
    if (!granularity) granularity = v ? defaultGranularity : lastValue[0];
    let timeZone = v ? defaultTimeZone : lastValue[1];
    return [
        granularity,
        timeZone
    ];
}


//# sourceMappingURL=utils.cjs.map
