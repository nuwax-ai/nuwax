var $b8ffb0adc97ab95f$exports = require("../i18n/useDateFormatter.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $6bKxx$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCalendarMonthPicker", function () { return $fb0573cba859c185$export$cf412bf5dcbe1065; });
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


function $fb0573cba859c185$export$cf412bf5dcbe1065(props, state) {
    let formatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
        month: props.format || 'short',
        calendar: state.focusedDate.calendar.identifier,
        timeZone: state.timeZone
    });
    // Format the name of each month in the year according to the
    // current locale and calendar system. Note that in some calendar
    // systems, such as the Hebrew, the number of months may differ
    // between years.
    let months = [];
    let numMonths = state.focusedDate.calendar.getMonthsInYear(state.focusedDate);
    for(let i = 1; i <= numMonths; i++){
        let date = state.focusedDate.set({
            month: i
        });
        // Calendars like the 4-5-4 fiscal calendar use getFormattableMonth to map
        // their internal month back to the Gregorian month that should be displayed.
        let displayDate = date.calendar.getFormattableMonth ? date.calendar.getFormattableMonth(date) : date;
        months.push({
            id: i,
            date: date,
            formatted: formatter.format(displayDate.toDate(state.timeZone))
        });
    }
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let ariaLabel = (0, $6bKxx$react.useMemo)(()=>new Intl.DisplayNames(locale, {
            type: 'dateTimeField'
        }).of('month'), [
        locale
    ]);
    return {
        'aria-label': ariaLabel,
        value: state.focusedDate.month,
        onChange: (key)=>{
            if (key != null) state.setFocusedDate(months[Number(key) - 1].date);
        },
        items: months
    };
}


//# sourceMappingURL=useCalendarMonthPicker.cjs.map
