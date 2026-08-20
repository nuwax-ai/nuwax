import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useMemo as $gbh8w$useMemo} from "react";

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

function $bfcd16e7c55c9482$export$72ad8e10aa105341(props, state) {
    let startDate = (0, $gbh8w$useMemo)(()=>{
        let currentMonth = state.visibleRange.start;
        if (props.offset) currentMonth = currentMonth.add(props.offset);
        return currentMonth;
    }, [
        state.visibleRange.start,
        props.offset
    ]);
    let isDays = state.visibleDuration.days || state.visibleDuration.weeks;
    let formatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        day: props.format?.day || (isDays ? 'numeric' : undefined),
        month: props.format?.month || 'long',
        year: props.format?.year || 'numeric',
        era: props.format?.era || startDate && startDate.calendar.identifier === 'gregory' && startDate.era === 'BC' ? 'short' : undefined,
        calendar: state.visibleRange?.start.calendar.identifier,
        timeZone: state.timeZone
    });
    return (0, $gbh8w$useMemo)(()=>{
        if (isDays) return formatter.formatRange(startDate.toDate(state.timeZone), state.visibleRange.end.toDate(state.timeZone));
        // Custom calendars like the 4-5-4 fiscal calendar use getFormattableMonth to map
        // their internal month back to the Gregorian month that should be displayed.
        let displayDate = startDate.calendar.getFormattableMonth ? startDate.calendar.getFormattableMonth(startDate) : startDate;
        return formatter.format(displayDate.toDate(state.timeZone));
    }, [
        formatter,
        isDays,
        startDate,
        state.timeZone,
        state.visibleRange.end
    ]);
}


export {$bfcd16e7c55c9482$export$72ad8e10aa105341 as useCalendarHeading};
//# sourceMappingURL=useCalendarHeading.mjs.map
