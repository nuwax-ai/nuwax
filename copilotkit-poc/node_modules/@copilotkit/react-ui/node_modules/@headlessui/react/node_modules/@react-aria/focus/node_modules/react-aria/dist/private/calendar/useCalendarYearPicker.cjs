var $b8ffb0adc97ab95f$exports = require("../i18n/useDateFormatter.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $gA7li$internationalizeddate = require("@internationalized/date");
var $gA7li$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCalendarYearPicker", function () { return $1470025f4b153a6e$export$89757cae093b4b95; });
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



function $1470025f4b153a6e$export$89757cae093b4b95(props, state) {
    let formatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
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
        maxDate = (0, $gA7li$internationalizeddate.toCalendarDate)(state.maxValue);
        minDate = maxDate.subtract({
            years: visibleYears
        });
    }
    if (state.minValue && minDate.compare(state.minValue) < 0) {
        minDate = (0, $gA7li$internationalizeddate.toCalendarDate)(state.minValue);
        maxDate = minDate.add({
            years: visibleYears
        });
        if (state.maxValue && maxDate.compare(state.maxValue) > 0) maxDate = (0, $gA7li$internationalizeddate.toCalendarDate)(state.maxValue);
    }
    let years = [];
    let date = minDate;
    let value = 0;
    while(date.compare(maxDate) < 0){
        if ((0, $gA7li$internationalizeddate.isSameYear)(date, state.focusedDate)) value = years.length;
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
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let ariaLabel = (0, $gA7li$react.useMemo)(()=>new Intl.DisplayNames(locale, {
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


//# sourceMappingURL=useCalendarYearPicker.cjs.map
