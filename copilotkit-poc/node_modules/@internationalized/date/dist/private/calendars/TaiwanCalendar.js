import {CalendarDate as $9a4e222e1bd2b190$export$99faa760c7908e4f} from "../CalendarDate.js";
import {fromExtendedYear as $f25df78da1f6b40f$export$4475b7e617eb123c, getExtendedYear as $f25df78da1f6b40f$export$c36e0ecb2d4fa69d, GregorianCalendar as $f25df78da1f6b40f$export$80ee6245ec4f29ec} from "./GregorianCalendar.js";

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
 */ // Portions of the code in this file are based on code from ICU.
// Original licensing can be found in the NOTICE file in the root directory of this source tree.


const $0e7b6ab888014459$var$TAIWAN_ERA_START = 1911;
function $0e7b6ab888014459$var$gregorianYear(date) {
    return date.era === 'minguo' ? date.year + $0e7b6ab888014459$var$TAIWAN_ERA_START : 1 - date.year + $0e7b6ab888014459$var$TAIWAN_ERA_START;
}
function $0e7b6ab888014459$var$gregorianToTaiwan(year) {
    let y = year - $0e7b6ab888014459$var$TAIWAN_ERA_START;
    if (y > 0) return [
        'minguo',
        y
    ];
    else return [
        'before_minguo',
        1 - y
    ];
}
class $0e7b6ab888014459$export$65e01080afcb0799 extends (0, $f25df78da1f6b40f$export$80ee6245ec4f29ec) {
    fromJulianDay(jd) {
        let date = super.fromJulianDay(jd);
        let extendedYear = (0, $f25df78da1f6b40f$export$c36e0ecb2d4fa69d)(date.era, date.year);
        let [era, year] = $0e7b6ab888014459$var$gregorianToTaiwan(extendedYear);
        return new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)(this, era, year, date.month, date.day);
    }
    toJulianDay(date) {
        return super.toJulianDay($0e7b6ab888014459$var$toGregorian(date));
    }
    getEras() {
        return [
            'before_minguo',
            'minguo'
        ];
    }
    balanceDate(date) {
        let [era, year] = $0e7b6ab888014459$var$gregorianToTaiwan($0e7b6ab888014459$var$gregorianYear(date));
        date.era = era;
        date.year = year;
    }
    isInverseEra(date) {
        return date.era === 'before_minguo';
    }
    getDaysInMonth(date) {
        return super.getDaysInMonth($0e7b6ab888014459$var$toGregorian(date));
    }
    getYearsInEra(date) {
        return date.era === 'before_minguo' ? 9999 : 9999 - $0e7b6ab888014459$var$TAIWAN_ERA_START;
    }
    constructor(...args){
        super(...args), this.identifier = 'roc' // Republic of China
        ;
    }
}
function $0e7b6ab888014459$var$toGregorian(date) {
    let [era, year] = (0, $f25df78da1f6b40f$export$4475b7e617eb123c)($0e7b6ab888014459$var$gregorianYear(date));
    return new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)(era, year, date.month, date.day);
}


export {$0e7b6ab888014459$export$65e01080afcb0799 as TaiwanCalendar};
//# sourceMappingURL=TaiwanCalendar.js.map
