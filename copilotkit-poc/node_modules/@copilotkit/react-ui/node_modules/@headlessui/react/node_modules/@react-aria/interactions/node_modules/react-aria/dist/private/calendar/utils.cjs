var $7042f522bd1a7f7b$exports = require("./intlStrings.cjs");
var $b8ffb0adc97ab95f$exports = require("../i18n/useDateFormatter.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $4pxyi$internationalizeddate = require("@internationalized/date");
var $4pxyi$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "hookData", function () { return $b4aac2eb56fa5943$export$653eddfc964b0f8a; });
$parcel$export(module.exports, "getEraFormat", function () { return $b4aac2eb56fa5943$export$134cbb7fb09a9522; });
$parcel$export(module.exports, "useSelectedDateDescription", function () { return $b4aac2eb56fa5943$export$b6df97c887c38e1a; });
$parcel$export(module.exports, "useVisibleRangeDescription", function () { return $b4aac2eb56fa5943$export$31afe65d91ef6e8; });
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





const $b4aac2eb56fa5943$export$653eddfc964b0f8a = new WeakMap();
function $b4aac2eb56fa5943$export$134cbb7fb09a9522(date) {
    return date?.calendar.identifier === 'gregory' && date.era === 'BC' ? 'short' : undefined;
}
function $b4aac2eb56fa5943$export$b6df97c887c38e1a(state) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($7042f522bd1a7f7b$exports))), '@react-aria/calendar');
    let start, end;
    if ('highlightedRange' in state) ({ start: start, end: end } = state.highlightedRange || {});
    else {
        start = Array.isArray(state.value) ? state.value[0] : state.value ?? undefined;
        end = Array.isArray(state.value) ? state.value.at(-1) : state.value ?? undefined;
    }
    let dateFormatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
        weekday: 'long',
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: $b4aac2eb56fa5943$export$134cbb7fb09a9522(start) || $b4aac2eb56fa5943$export$134cbb7fb09a9522(end),
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let listFormatter = (0, $4pxyi$react.useMemo)(()=>new Intl.ListFormat(locale), [
        locale
    ]);
    let anchorDate = 'anchorDate' in state ? state.anchorDate : null;
    return (0, $4pxyi$react.useMemo)(()=>{
        // No message if currently selecting a range, or there is nothing highlighted.
        if (!anchorDate && start && end) {
            // Use a single date message if the start and end dates are the same day,
            // otherwise include both dates.
            if ((0, $4pxyi$internationalizeddate.isSameDay)(start, end)) {
                let date = dateFormatter.format(start.toDate(state.timeZone));
                return stringFormatter.format('selectedDateDescription', {
                    date: date
                });
            } else if ('highlightedRange' in state) {
                let dateRange = $b4aac2eb56fa5943$var$formatRange(dateFormatter, stringFormatter, start, end, state.timeZone);
                return stringFormatter.format('selectedRangeDescription', {
                    dateRange: dateRange
                });
            } else if (Array.isArray(state.value)) {
                let dates = state.value.map((date)=>dateFormatter.format(date.toDate(state.timeZone)));
                let formatted = listFormatter.format(dates);
                return stringFormatter.format('selectedDateDescription', {
                    date: formatted
                });
            }
        }
        return '';
    }, [
        start,
        end,
        anchorDate,
        state,
        stringFormatter,
        dateFormatter,
        listFormatter
    ]);
}
function $b4aac2eb56fa5943$export$31afe65d91ef6e8(startDate, endDate, timeZone, isAria) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($7042f522bd1a7f7b$exports))), '@react-aria/calendar');
    let era = $b4aac2eb56fa5943$export$134cbb7fb09a9522(startDate) || $b4aac2eb56fa5943$export$134cbb7fb09a9522(endDate);
    let monthFormatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
        month: 'long',
        year: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    let dateFormatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    return (0, $4pxyi$react.useMemo)(()=>{
        // Special case for month granularity. Format as a single month if only a
        // single month is visible, otherwise format as a range of months.
        if ((0, $4pxyi$internationalizeddate.isSameDay)(startDate, (0, $4pxyi$internationalizeddate.startOfMonth)(startDate))) {
            let startMonth = startDate;
            let endMonth = endDate;
            if (startDate.calendar.getFormattableMonth) startMonth = startDate.calendar.getFormattableMonth(startDate);
            if (endDate.calendar.getFormattableMonth) endMonth = endDate.calendar.getFormattableMonth(endDate);
            if ((0, $4pxyi$internationalizeddate.isSameDay)(endDate, (0, $4pxyi$internationalizeddate.endOfMonth)(startDate))) return monthFormatter.format(startMonth.toDate(timeZone));
            else if ((0, $4pxyi$internationalizeddate.isSameDay)(endDate, (0, $4pxyi$internationalizeddate.endOfMonth)(endDate))) return isAria ? $b4aac2eb56fa5943$var$formatRange(monthFormatter, stringFormatter, startMonth, endMonth, timeZone) : monthFormatter.formatRange(startMonth.toDate(timeZone), endMonth.toDate(timeZone));
        }
        return isAria ? $b4aac2eb56fa5943$var$formatRange(dateFormatter, stringFormatter, startDate, endDate, timeZone) : dateFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
    }, [
        startDate,
        endDate,
        monthFormatter,
        dateFormatter,
        stringFormatter,
        timeZone,
        isAria
    ]);
}
function $b4aac2eb56fa5943$var$formatRange(dateFormatter, stringFormatter, start, end, timeZone) {
    let parts = dateFormatter.formatRangeToParts(start.toDate(timeZone), end.toDate(timeZone));
    // Find the separator between the start and end date. This is determined
    // by finding the last shared literal before the end range.
    let separatorIndex = -1;
    for(let i = 0; i < parts.length; i++){
        let part = parts[i];
        if (part.source === 'shared' && part.type === 'literal') separatorIndex = i;
        else if (part.source === 'endRange') break;
    }
    // Now we can combine the parts into start and end strings.
    let startValue = '';
    let endValue = '';
    for(let i = 0; i < parts.length; i++){
        if (i < separatorIndex) startValue += parts[i].value;
        else if (i > separatorIndex) endValue += parts[i].value;
    }
    return stringFormatter.format('dateRange', {
        startDate: startValue,
        endDate: endValue
    });
}


//# sourceMappingURL=utils.cjs.map
