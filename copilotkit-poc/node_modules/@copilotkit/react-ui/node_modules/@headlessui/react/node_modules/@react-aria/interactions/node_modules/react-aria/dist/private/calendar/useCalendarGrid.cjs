var $b4aac2eb56fa5943$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $b8ffb0adc97ab95f$exports = require("../i18n/useDateFormatter.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $ctDVS$internationalizeddate = require("@internationalized/date");
var $ctDVS$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCalendarGrid", function () { return $0acfec8dd0a1c8fa$export$cb95147730a423f5; });
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






function $0acfec8dd0a1c8fa$export$cb95147730a423f5(props, state) {
    let { startDate: startDate = state.visibleRange.start, endDate: endDate = state.visibleRange.end, firstDayOfWeek: firstDayOfWeek } = props;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
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
    let visibleRangeDescription = (0, $b4aac2eb56fa5943$exports.useVisibleRangeDescription)(startDate, endDate, state.timeZone, true);
    let { ariaLabel: ariaLabel, ariaLabelledBy: ariaLabelledBy } = (0, $b4aac2eb56fa5943$exports.hookData).get(state);
    let labelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        'aria-label': [
            ariaLabel,
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': ariaLabelledBy
    });
    let dayFormatter = (0, $b8ffb0adc97ab95f$exports.useDateFormatter)({
        weekday: props.weekdayStyle || 'narrow',
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let weekDays = (0, $ctDVS$react.useMemo)(()=>{
        let isDayView = state.visibleDuration.days && state.visibleDuration.days < 7;
        let weekStart = isDayView ? startDate : (0, $ctDVS$internationalizeddate.startOfWeek)((0, $ctDVS$internationalizeddate.today)(state.timeZone), locale, firstDayOfWeek);
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
        gridProps: (0, $89b39774f3b79dbb$exports.mergeProps)(labelProps, {
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


//# sourceMappingURL=useCalendarGrid.cjs.map
