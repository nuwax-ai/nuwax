import {BuddhistCalendar as $6f54c4fe66fc5ed5$export$42d20a78301dee44} from "./calendars/BuddhistCalendar.js";
import {CopticCalendar as $ca8f5bca40aaf2d4$export$fe6243cbe1a4b7c1, EthiopicAmeteAlemCalendar as $ca8f5bca40aaf2d4$export$d72e0c37005a4914, EthiopicCalendar as $ca8f5bca40aaf2d4$export$26ba6eab5e20cd7d} from "./calendars/EthiopicCalendar.js";
import {GregorianCalendar as $f25df78da1f6b40f$export$80ee6245ec4f29ec} from "./calendars/GregorianCalendar.js";
import {HebrewCalendar as $f6eb69e87cd1adc1$export$ca405048b8fb5af} from "./calendars/HebrewCalendar.js";
import {IndianCalendar as $a07127433beb6bf1$export$39f31c639fa15726} from "./calendars/IndianCalendar.js";
import {IslamicCivilCalendar as $a938ddf4fc940323$export$2066795aadd37bfc, IslamicTabularCalendar as $a938ddf4fc940323$export$37f0887f2f9d22f7, IslamicUmalquraCalendar as $a938ddf4fc940323$export$5baab4758c231076} from "./calendars/IslamicCalendar.js";
import {JapaneseCalendar as $97f08bcb2befa667$export$b746ab2b60cdffbf} from "./calendars/JapaneseCalendar.js";
import {PersianCalendar as $3e485caf6e85028a$export$37fccdbfd14c5939} from "./calendars/PersianCalendar.js";
import {TaiwanCalendar as $0e7b6ab888014459$export$65e01080afcb0799} from "./calendars/TaiwanCalendar.js";

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








function $d36eda2e2bc2be5a$export$dd0bbc9b26defe37(name) {
    switch(name){
        case 'buddhist':
            return new (0, $6f54c4fe66fc5ed5$export$42d20a78301dee44)();
        case 'ethiopic':
            return new (0, $ca8f5bca40aaf2d4$export$26ba6eab5e20cd7d)();
        case 'ethioaa':
            return new (0, $ca8f5bca40aaf2d4$export$d72e0c37005a4914)();
        case 'coptic':
            return new (0, $ca8f5bca40aaf2d4$export$fe6243cbe1a4b7c1)();
        case 'hebrew':
            return new (0, $f6eb69e87cd1adc1$export$ca405048b8fb5af)();
        case 'indian':
            return new (0, $a07127433beb6bf1$export$39f31c639fa15726)();
        case 'islamic-civil':
            return new (0, $a938ddf4fc940323$export$2066795aadd37bfc)();
        case 'islamic-tbla':
            return new (0, $a938ddf4fc940323$export$37f0887f2f9d22f7)();
        case 'islamic-umalqura':
            return new (0, $a938ddf4fc940323$export$5baab4758c231076)();
        case 'japanese':
            return new (0, $97f08bcb2befa667$export$b746ab2b60cdffbf)();
        case 'persian':
            return new (0, $3e485caf6e85028a$export$37fccdbfd14c5939)();
        case 'roc':
            return new (0, $0e7b6ab888014459$export$65e01080afcb0799)();
        case 'gregory':
        default:
            return new (0, $f25df78da1f6b40f$export$80ee6245ec4f29ec)();
    }
}


export {$d36eda2e2bc2be5a$export$dd0bbc9b26defe37 as createCalendar};
//# sourceMappingURL=createCalendar.js.map
