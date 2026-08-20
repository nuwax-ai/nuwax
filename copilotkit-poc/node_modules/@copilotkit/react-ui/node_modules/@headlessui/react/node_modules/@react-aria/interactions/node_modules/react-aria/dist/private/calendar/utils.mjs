import $4SBhA$intlStringsmjs from "./intlStrings.mjs";
import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {isSameDay as $4SBhA$isSameDay, startOfMonth as $4SBhA$startOfMonth, endOfMonth as $4SBhA$endOfMonth} from "@internationalized/date";
import {useMemo as $4SBhA$useMemo} from "react";


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





const $9bac9bf03b87f160$export$653eddfc964b0f8a = new WeakMap();
function $9bac9bf03b87f160$export$134cbb7fb09a9522(date) {
    return date?.calendar.identifier === 'gregory' && date.era === 'BC' ? 'short' : undefined;
}
function $9bac9bf03b87f160$export$b6df97c887c38e1a(state) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4SBhA$intlStringsmjs))), '@react-aria/calendar');
    let start, end;
    if ('highlightedRange' in state) ({ start: start, end: end } = state.highlightedRange || {});
    else {
        start = Array.isArray(state.value) ? state.value[0] : state.value ?? undefined;
        end = Array.isArray(state.value) ? state.value.at(-1) : state.value ?? undefined;
    }
    let dateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        weekday: 'long',
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: $9bac9bf03b87f160$export$134cbb7fb09a9522(start) || $9bac9bf03b87f160$export$134cbb7fb09a9522(end),
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let listFormatter = (0, $4SBhA$useMemo)(()=>new Intl.ListFormat(locale), [
        locale
    ]);
    let anchorDate = 'anchorDate' in state ? state.anchorDate : null;
    return (0, $4SBhA$useMemo)(()=>{
        // No message if currently selecting a range, or there is nothing highlighted.
        if (!anchorDate && start && end) {
            // Use a single date message if the start and end dates are the same day,
            // otherwise include both dates.
            if ((0, $4SBhA$isSameDay)(start, end)) {
                let date = dateFormatter.format(start.toDate(state.timeZone));
                return stringFormatter.format('selectedDateDescription', {
                    date: date
                });
            } else if ('highlightedRange' in state) {
                let dateRange = $9bac9bf03b87f160$var$formatRange(dateFormatter, stringFormatter, start, end, state.timeZone);
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
function $9bac9bf03b87f160$export$31afe65d91ef6e8(startDate, endDate, timeZone, isAria) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4SBhA$intlStringsmjs))), '@react-aria/calendar');
    let era = $9bac9bf03b87f160$export$134cbb7fb09a9522(startDate) || $9bac9bf03b87f160$export$134cbb7fb09a9522(endDate);
    let monthFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        month: 'long',
        year: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    let dateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    return (0, $4SBhA$useMemo)(()=>{
        // Special case for month granularity. Format as a single month if only a
        // single month is visible, otherwise format as a range of months.
        if ((0, $4SBhA$isSameDay)(startDate, (0, $4SBhA$startOfMonth)(startDate))) {
            let startMonth = startDate;
            let endMonth = endDate;
            if (startDate.calendar.getFormattableMonth) startMonth = startDate.calendar.getFormattableMonth(startDate);
            if (endDate.calendar.getFormattableMonth) endMonth = endDate.calendar.getFormattableMonth(endDate);
            if ((0, $4SBhA$isSameDay)(endDate, (0, $4SBhA$endOfMonth)(startDate))) return monthFormatter.format(startMonth.toDate(timeZone));
            else if ((0, $4SBhA$isSameDay)(endDate, (0, $4SBhA$endOfMonth)(endDate))) return isAria ? $9bac9bf03b87f160$var$formatRange(monthFormatter, stringFormatter, startMonth, endMonth, timeZone) : monthFormatter.formatRange(startMonth.toDate(timeZone), endMonth.toDate(timeZone));
        }
        return isAria ? $9bac9bf03b87f160$var$formatRange(dateFormatter, stringFormatter, startDate, endDate, timeZone) : dateFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
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
function $9bac9bf03b87f160$var$formatRange(dateFormatter, stringFormatter, start, end, timeZone) {
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


export {$9bac9bf03b87f160$export$653eddfc964b0f8a as hookData, $9bac9bf03b87f160$export$134cbb7fb09a9522 as getEraFormat, $9bac9bf03b87f160$export$b6df97c887c38e1a as useSelectedDateDescription, $9bac9bf03b87f160$export$31afe65d91ef6e8 as useVisibleRangeDescription};
//# sourceMappingURL=utils.mjs.map
