var $0ce473f03e925476$exports = require("./calendars/BuddhistCalendar.cjs");
var $b6b43214f5cff964$exports = require("./calendars/EthiopicCalendar.cjs");
var $05031860ba2f881f$exports = require("./calendars/GregorianCalendar.cjs");
var $1aa25867248bd474$exports = require("./calendars/HebrewCalendar.cjs");
var $9dc8610ad30fbfe5$exports = require("./calendars/IndianCalendar.cjs");
var $fbcc6aba7cd7f47c$exports = require("./calendars/IslamicCalendar.cjs");
var $a90e2192fa9a0f41$exports = require("./calendars/JapaneseCalendar.cjs");
var $4100faec94dc031c$exports = require("./calendars/PersianCalendar.cjs");
var $2dab1d4ea1fc722b$exports = require("./calendars/TaiwanCalendar.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "createCalendar", function () { return $9d3159c6111892aa$export$dd0bbc9b26defe37; });
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








function $9d3159c6111892aa$export$dd0bbc9b26defe37(name) {
    switch(name){
        case 'buddhist':
            return new (0, $0ce473f03e925476$exports.BuddhistCalendar)();
        case 'ethiopic':
            return new (0, $b6b43214f5cff964$exports.EthiopicCalendar)();
        case 'ethioaa':
            return new (0, $b6b43214f5cff964$exports.EthiopicAmeteAlemCalendar)();
        case 'coptic':
            return new (0, $b6b43214f5cff964$exports.CopticCalendar)();
        case 'hebrew':
            return new (0, $1aa25867248bd474$exports.HebrewCalendar)();
        case 'indian':
            return new (0, $9dc8610ad30fbfe5$exports.IndianCalendar)();
        case 'islamic-civil':
            return new (0, $fbcc6aba7cd7f47c$exports.IslamicCivilCalendar)();
        case 'islamic-tbla':
            return new (0, $fbcc6aba7cd7f47c$exports.IslamicTabularCalendar)();
        case 'islamic-umalqura':
            return new (0, $fbcc6aba7cd7f47c$exports.IslamicUmalquraCalendar)();
        case 'japanese':
            return new (0, $a90e2192fa9a0f41$exports.JapaneseCalendar)();
        case 'persian':
            return new (0, $4100faec94dc031c$exports.PersianCalendar)();
        case 'roc':
            return new (0, $2dab1d4ea1fc722b$exports.TaiwanCalendar)();
        case 'gregory':
        default:
            return new (0, $05031860ba2f881f$exports.GregorianCalendar)();
    }
}


//# sourceMappingURL=createCalendar.cjs.map
