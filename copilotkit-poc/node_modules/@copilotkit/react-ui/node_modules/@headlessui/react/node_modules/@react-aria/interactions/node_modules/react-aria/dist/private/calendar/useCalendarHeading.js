import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useMemo as $bENIc$useMemo} from "react";

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

function $7c97eebfb9f955d6$export$72ad8e10aa105341(props, state) {
    var _props_format, _props_format1, _props_format2, _props_format3, _state_visibleRange;
    let startDate = (0, $bENIc$useMemo)(()=>{
        let currentMonth = state.visibleRange.start;
        if (props.offset) currentMonth = currentMonth.add(props.offset);
        return currentMonth;
    }, [
        state.visibleRange.start,
        props.offset
    ]);
    let isDays = state.visibleDuration.days || state.visibleDuration.weeks;
    let formatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        day: ((_props_format = props.format) === null || _props_format === void 0 ? void 0 : _props_format.day) || (isDays ? 'numeric' : undefined),
        month: ((_props_format1 = props.format) === null || _props_format1 === void 0 ? void 0 : _props_format1.month) || 'long',
        year: ((_props_format2 = props.format) === null || _props_format2 === void 0 ? void 0 : _props_format2.year) || 'numeric',
        era: ((_props_format3 = props.format) === null || _props_format3 === void 0 ? void 0 : _props_format3.era) || startDate && startDate.calendar.identifier === 'gregory' && startDate.era === 'BC' ? 'short' : undefined,
        calendar: (_state_visibleRange = state.visibleRange) === null || _state_visibleRange === void 0 ? void 0 : _state_visibleRange.start.calendar.identifier,
        timeZone: state.timeZone
    });
    return (0, $bENIc$useMemo)(()=>{
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


export {$7c97eebfb9f955d6$export$72ad8e10aa105341 as useCalendarHeading};
//# sourceMappingURL=useCalendarHeading.js.map
