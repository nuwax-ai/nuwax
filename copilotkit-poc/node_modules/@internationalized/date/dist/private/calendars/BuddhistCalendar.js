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


const $6f54c4fe66fc5ed5$var$BUDDHIST_ERA_START = -543;
class $6f54c4fe66fc5ed5$export$42d20a78301dee44 extends (0, $f25df78da1f6b40f$export$80ee6245ec4f29ec) {
    fromJulianDay(jd) {
        let gregorianDate = super.fromJulianDay(jd);
        let year = (0, $f25df78da1f6b40f$export$c36e0ecb2d4fa69d)(gregorianDate.era, gregorianDate.year);
        return new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)(this, year - $6f54c4fe66fc5ed5$var$BUDDHIST_ERA_START, gregorianDate.month, gregorianDate.day);
    }
    toJulianDay(date) {
        return super.toJulianDay($6f54c4fe66fc5ed5$var$toGregorian(date));
    }
    getEras() {
        return [
            'BE'
        ];
    }
    getDaysInMonth(date) {
        return super.getDaysInMonth($6f54c4fe66fc5ed5$var$toGregorian(date));
    }
    balanceDate() {}
    constructor(...args){
        super(...args), this.identifier = 'buddhist';
    }
}
function $6f54c4fe66fc5ed5$var$toGregorian(date) {
    let [era, year] = (0, $f25df78da1f6b40f$export$4475b7e617eb123c)(date.year + $6f54c4fe66fc5ed5$var$BUDDHIST_ERA_START);
    return new (0, $9a4e222e1bd2b190$export$99faa760c7908e4f)(era, year, date.month, date.day);
}


export {$6f54c4fe66fc5ed5$export$42d20a78301dee44 as BuddhistCalendar};
//# sourceMappingURL=BuddhistCalendar.js.map
