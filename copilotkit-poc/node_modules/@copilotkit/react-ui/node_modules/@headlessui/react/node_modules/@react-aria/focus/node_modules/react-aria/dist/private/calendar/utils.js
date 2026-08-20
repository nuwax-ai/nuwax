import $7x01w$intlStringsjs from "./intlStrings.js";
import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {isSameDay as $7x01w$isSameDay, startOfMonth as $7x01w$startOfMonth, endOfMonth as $7x01w$endOfMonth} from "@internationalized/date";
import {useMemo as $7x01w$useMemo} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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





const $408a9e02d11c4766$export$653eddfc964b0f8a = new WeakMap();
function $408a9e02d11c4766$export$134cbb7fb09a9522(date) {
    return (date === null || date === void 0 ? void 0 : date.calendar.identifier) === 'gregory' && date.era === 'BC' ? 'short' : undefined;
}
function $408a9e02d11c4766$export$b6df97c887c38e1a(state) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($7x01w$intlStringsjs))), '@react-aria/calendar');
    let start, end;
    if ('highlightedRange' in state) ({ start: start, end: end } = state.highlightedRange || {});
    else {
        var _state_value;
        start = Array.isArray(state.value) ? state.value[0] : (_state_value = state.value) !== null && _state_value !== void 0 ? _state_value : undefined;
        var _state_value1;
        end = Array.isArray(state.value) ? state.value.at(-1) : (_state_value1 = state.value) !== null && _state_value1 !== void 0 ? _state_value1 : undefined;
    }
    let dateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        weekday: 'long',
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: $408a9e02d11c4766$export$134cbb7fb09a9522(start) || $408a9e02d11c4766$export$134cbb7fb09a9522(end),
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let listFormatter = (0, $7x01w$useMemo)(()=>new Intl.ListFormat(locale), [
        locale
    ]);
    let anchorDate = 'anchorDate' in state ? state.anchorDate : null;
    return (0, $7x01w$useMemo)(()=>{
        // No message if currently selecting a range, or there is nothing highlighted.
        if (!anchorDate && start && end) {
            // Use a single date message if the start and end dates are the same day,
            // otherwise include both dates.
            if ((0, $7x01w$isSameDay)(start, end)) {
                let date = dateFormatter.format(start.toDate(state.timeZone));
                return stringFormatter.format('selectedDateDescription', {
                    date: date
                });
            } else if ('highlightedRange' in state) {
                let dateRange = $408a9e02d11c4766$var$formatRange(dateFormatter, stringFormatter, start, end, state.timeZone);
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
function $408a9e02d11c4766$export$31afe65d91ef6e8(startDate, endDate, timeZone, isAria) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($7x01w$intlStringsjs))), '@react-aria/calendar');
    let era = $408a9e02d11c4766$export$134cbb7fb09a9522(startDate) || $408a9e02d11c4766$export$134cbb7fb09a9522(endDate);
    let monthFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        month: 'long',
        year: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    let dateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    return (0, $7x01w$useMemo)(()=>{
        // Special case for month granularity. Format as a single month if only a
        // single month is visible, otherwise format as a range of months.
        if ((0, $7x01w$isSameDay)(startDate, (0, $7x01w$startOfMonth)(startDate))) {
            let startMonth = startDate;
            let endMonth = endDate;
            if (startDate.calendar.getFormattableMonth) startMonth = startDate.calendar.getFormattableMonth(startDate);
            if (endDate.calendar.getFormattableMonth) endMonth = endDate.calendar.getFormattableMonth(endDate);
            if ((0, $7x01w$isSameDay)(endDate, (0, $7x01w$endOfMonth)(startDate))) return monthFormatter.format(startMonth.toDate(timeZone));
            else if ((0, $7x01w$isSameDay)(endDate, (0, $7x01w$endOfMonth)(endDate))) return isAria ? $408a9e02d11c4766$var$formatRange(monthFormatter, stringFormatter, startMonth, endMonth, timeZone) : monthFormatter.formatRange(startMonth.toDate(timeZone), endMonth.toDate(timeZone));
        }
        return isAria ? $408a9e02d11c4766$var$formatRange(dateFormatter, stringFormatter, startDate, endDate, timeZone) : dateFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
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
function $408a9e02d11c4766$var$formatRange(dateFormatter, stringFormatter, start, end, timeZone) {
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


export {$408a9e02d11c4766$export$653eddfc964b0f8a as hookData, $408a9e02d11c4766$export$134cbb7fb09a9522 as getEraFormat, $408a9e02d11c4766$export$b6df97c887c38e1a as useSelectedDateDescription, $408a9e02d11c4766$export$31afe65d91ef6e8 as useVisibleRangeDescription};
//# sourceMappingURL=utils.js.map
