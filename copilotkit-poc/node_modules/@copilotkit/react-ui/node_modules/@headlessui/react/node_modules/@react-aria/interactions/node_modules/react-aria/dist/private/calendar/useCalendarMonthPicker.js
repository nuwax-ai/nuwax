import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useMemo as $i4FlB$useMemo} from "react";

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


function $32abf34e74d47afe$export$cf412bf5dcbe1065(props, state) {
    let formatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
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
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let ariaLabel = (0, $i4FlB$useMemo)(()=>new Intl.DisplayNames(locale, {
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


export {$32abf34e74d47afe$export$cf412bf5dcbe1065 as useCalendarMonthPicker};
//# sourceMappingURL=useCalendarMonthPicker.js.map
