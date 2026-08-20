import {hookData as $408a9e02d11c4766$export$653eddfc964b0f8a, useVisibleRangeDescription as $408a9e02d11c4766$export$31afe65d91ef6e8} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {startOfWeek as $in4g1$startOfWeek, today as $in4g1$today} from "@internationalized/date";
import {useMemo as $in4g1$useMemo} from "react";

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






function $e8ce785b95f36e37$export$cb95147730a423f5(props, state) {
    let { startDate: startDate = state.visibleRange.start, endDate: endDate = state.visibleRange.end, firstDayOfWeek: firstDayOfWeek } = props;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let onKeyDown = (e)=>{
        switch(e.key){
            case 'Enter':
            case ' ':
                e.preventDefault();
                state.selectFocusedDate();
                break;
            case 'PageUp':
                e.preventDefault();
                e.stopPropagation();
                state.focusPreviousSection(e.shiftKey);
                break;
            case 'PageDown':
                e.preventDefault();
                e.stopPropagation();
                state.focusNextSection(e.shiftKey);
                break;
            case 'End':
                e.preventDefault();
                e.stopPropagation();
                state.focusSectionEnd();
                break;
            case 'Home':
                e.preventDefault();
                e.stopPropagation();
                state.focusSectionStart();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                e.stopPropagation();
                if (direction === 'rtl') state.focusNextDay();
                else state.focusPreviousDay();
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                state.focusPreviousRow();
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                if (direction === 'rtl') state.focusPreviousDay();
                else state.focusNextDay();
                break;
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                state.focusNextRow();
                break;
            case 'Escape':
                // Cancel the selection.
                if ('setAnchorDate' in state) {
                    e.preventDefault();
                    state.setAnchorDate(null);
                }
                break;
        }
    };
    let visibleRangeDescription = (0, $408a9e02d11c4766$export$31afe65d91ef6e8)(startDate, endDate, state.timeZone, true);
    let { ariaLabel: ariaLabel, ariaLabelledBy: ariaLabelledBy } = (0, $408a9e02d11c4766$export$653eddfc964b0f8a).get(state);
    let labelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        'aria-label': [
            ariaLabel,
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': ariaLabelledBy
    });
    let dayFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        weekday: props.weekdayStyle || 'narrow',
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let weekDays = (0, $in4g1$useMemo)(()=>{
        let isDayView = state.visibleDuration.days && state.visibleDuration.days < 7;
        let weekStart = isDayView ? startDate : (0, $in4g1$startOfWeek)((0, $in4g1$today)(state.timeZone), locale, firstDayOfWeek);
        let days = isDayView ? state.visibleDuration.days : 7;
        return [
            ...new Array(days).keys()
        ].map((index)=>{
            let date = weekStart.add({
                days: index
            });
            let dateDay = date.toDate(state.timeZone);
            return dayFormatter.format(dateDay);
        });
    }, [
        locale,
        state.timeZone,
        dayFormatter,
        firstDayOfWeek,
        startDate,
        state.visibleDuration.days
    ]);
    let weeksInMonth = state.getWeeksInMonth(startDate);
    return {
        gridProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(labelProps, {
            role: 'grid',
            'aria-readonly': state.isReadOnly || undefined,
            'aria-disabled': state.isDisabled || undefined,
            'aria-multiselectable': 'highlightedRange' in state || state.selectionMode === 'multiple' || undefined,
            onKeyDown: onKeyDown,
            onFocus: ()=>state.setFocused(true),
            onBlur: ()=>state.setFocused(false)
        }),
        headerProps: {
            // Column headers are hidden to screen readers to make navigating with a touch screen reader easier.
            // The day names are already included in the label of each cell, so there's no need to announce them twice.
            'aria-hidden': true
        },
        weekDays: weekDays,
        weeksInMonth: weeksInMonth
    };
}


export {$e8ce785b95f36e37$export$cb95147730a423f5 as useCalendarGrid};
//# sourceMappingURL=useCalendarGrid.js.map
