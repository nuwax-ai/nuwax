var $5f05c1b9a9183f1f$exports = require("../numberfield/useNumberField.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorChannelField", function () { return $a06f2ac33162b0a0$export$e55dd820142d3131; });
/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $a06f2ac33162b0a0$export$e55dd820142d3131(props, state, inputRef) {
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    return (0, $5f05c1b9a9183f1f$exports.useNumberField)({
        ...props,
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
        validate: undefined,
        // Provide a default aria-label if no other label is provided.
        'aria-label': props['aria-label'] || (props.label || props['aria-labelledby'] ? undefined : state.colorValue.getChannelName(props.channel, locale))
    }, state, inputRef);
}


//# sourceMappingURL=useColorChannelField.cjs.map
