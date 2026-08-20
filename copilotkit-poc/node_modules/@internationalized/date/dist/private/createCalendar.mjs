import {BuddhistCalendar as $63d4eafd4d826996$export$42d20a78301dee44} from "./calendars/BuddhistCalendar.mjs";
import {CopticCalendar as $97cfca9efd59523d$export$fe6243cbe1a4b7c1, EthiopicAmeteAlemCalendar as $97cfca9efd59523d$export$d72e0c37005a4914, EthiopicCalendar as $97cfca9efd59523d$export$26ba6eab5e20cd7d} from "./calendars/EthiopicCalendar.mjs";
import {GregorianCalendar as $93635573935797de$export$80ee6245ec4f29ec} from "./calendars/GregorianCalendar.mjs";
import {HebrewCalendar as $f39495b96f9dbac6$export$ca405048b8fb5af} from "./calendars/HebrewCalendar.mjs";
import {IndianCalendar as $11fa67a177e45470$export$39f31c639fa15726} from "./calendars/IndianCalendar.mjs";
import {IslamicCivilCalendar as $fd4f9bc1ba0e49a8$export$2066795aadd37bfc, IslamicTabularCalendar as $fd4f9bc1ba0e49a8$export$37f0887f2f9d22f7, IslamicUmalquraCalendar as $fd4f9bc1ba0e49a8$export$5baab4758c231076} from "./calendars/IslamicCalendar.mjs";
import {JapaneseCalendar as $34b940b49ba042df$export$b746ab2b60cdffbf} from "./calendars/JapaneseCalendar.mjs";
import {PersianCalendar as $a0cc0739a536c3b1$export$37fccdbfd14c5939} from "./calendars/PersianCalendar.mjs";
import {TaiwanCalendar as $c009cc5f64923054$export$65e01080afcb0799} from "./calendars/TaiwanCalendar.mjs";

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








function $84102b64e5ca022f$export$dd0bbc9b26defe37(name) {
    switch(name){
        case 'buddhist':
            return new (0, $63d4eafd4d826996$export$42d20a78301dee44)();
        case 'ethiopic':
            return new (0, $97cfca9efd59523d$export$26ba6eab5e20cd7d)();
        case 'ethioaa':
            return new (0, $97cfca9efd59523d$export$d72e0c37005a4914)();
        case 'coptic':
            return new (0, $97cfca9efd59523d$export$fe6243cbe1a4b7c1)();
        case 'hebrew':
            return new (0, $f39495b96f9dbac6$export$ca405048b8fb5af)();
        case 'indian':
            return new (0, $11fa67a177e45470$export$39f31c639fa15726)();
        case 'islamic-civil':
            return new (0, $fd4f9bc1ba0e49a8$export$2066795aadd37bfc)();
        case 'islamic-tbla':
            return new (0, $fd4f9bc1ba0e49a8$export$37f0887f2f9d22f7)();
        case 'islamic-umalqura':
            return new (0, $fd4f9bc1ba0e49a8$export$5baab4758c231076)();
        case 'japanese':
            return new (0, $34b940b49ba042df$export$b746ab2b60cdffbf)();
        case 'persian':
            return new (0, $a0cc0739a536c3b1$export$37fccdbfd14c5939)();
        case 'roc':
            return new (0, $c009cc5f64923054$export$65e01080afcb0799)();
        case 'gregory':
        default:
            return new (0, $93635573935797de$export$80ee6245ec4f29ec)();
    }
}


export {$84102b64e5ca022f$export$dd0bbc9b26defe37 as createCalendar};
//# sourceMappingURL=createCalendar.mjs.map
