import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {toCalendarDate as $irNCa$toCalendarDate, isSameYear as $irNCa$isSameYear} from "@internationalized/date";
import {useMemo as $irNCa$useMemo} from "react";

/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $e4b70edea91ee6b0$export$89757cae093b4b95(props, state) {
    let formatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        year: props.format?.year || 'numeric',
        era: props.format?.era || (state.focusedDate.calendar.identifier === 'gregory' && state.focusedDate.era === 'BC' ? 'short' : undefined),
        calendar: state.focusedDate.calendar.identifier,
        timeZone: state.timeZone
    });
    // Determine the minimum and maximum date. By default, show an equal number of years on each side of the current year.
    // However, this can be constrained by the calendar's minimum and maximum date.
    let visibleYears = props.visibleYears || 20;
    let minDate = state.focusedDate.subtract({
        years: Math.floor(visibleYears / 2)
    });
    let maxDate = state.focusedDate.add({
        years: Math.ceil(visibleYears / 2)
    });
    if (state.maxValue && maxDate.compare(state.maxValue) > 0) {
        maxDate = (0, $irNCa$toCalendarDate)(state.maxValue);
        minDate = maxDate.subtract({
            years: visibleYears
        });
    }
    if (state.minValue && minDate.compare(state.minValue) < 0) {
        minDate = (0, $irNCa$toCalendarDate)(state.minValue);
        maxDate = minDate.add({
            years: visibleYears
        });
        if (state.maxValue && maxDate.compare(state.maxValue) > 0) maxDate = (0, $irNCa$toCalendarDate)(state.maxValue);
    }
    let years = [];
    let date = minDate;
    let value = 0;
    while(date.compare(maxDate) < 0){
        if ((0, $irNCa$isSameYear)(date, state.focusedDate)) value = years.length;
        years.push({
            // Use the index as the id so we can retrieve the full
            // date object from the list in onChange. We cannot only
            // store the year number, because in some calendars, such
            // as the Japanese, the era may also change.
            id: years.length,
            date: date,
            formatted: formatter.format(date.toDate(state.timeZone))
        });
        date = date.add({
            years: 1
        });
    }
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let ariaLabel = (0, $irNCa$useMemo)(()=>new Intl.DisplayNames(locale, {
            type: 'dateTimeField'
        }).of('year'), [
        locale
    ]);
    return {
        'aria-label': ariaLabel,
        value: value,
        onChange: (key)=>{
            if (key != null) state.setFocusedDate(years[key].date);
        },
        items: years
    };
}


export {$e4b70edea91ee6b0$export$89757cae093b4b95 as useCalendarYearPicker};
//# sourceMappingURL=useCalendarYearPicker.mjs.map
