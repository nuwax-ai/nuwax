var $7394b2797bc2343d$exports = require("./DragManager.cjs");
var $89d6f7d3313f2c1d$exports = require("./intlStrings.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useVirtualDrop", function () { return $b0c8843205a339ea$export$62447ad3d2ec7da6; });
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




const $b0c8843205a339ea$var$MESSAGES = {
    keyboard: 'dropDescriptionKeyboard',
    touch: 'dropDescriptionTouch',
    virtual: 'dropDescriptionVirtual'
};
function $b0c8843205a339ea$export$62447ad3d2ec7da6() {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($89d6f7d3313f2c1d$exports))), '@react-aria/dnd');
    let modality = (0, $c67ff3d36836a1c1$exports.useDragModality)();
    let dragSession = $7394b2797bc2343d$exports.useDragSession();
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(dragSession ? stringFormatter.format($b0c8843205a339ea$var$MESSAGES[modality]) : '');
    return {
        dropProps: {
            ...descriptionProps,
            // Mobile Safari does not properly bubble click events on elements except links or inputs
            // unless there is an onclick handler bound directly to the element itself. By adding this
            // handler, React will take care of adding that for us, and we are able to handle document
            // level click events in the DragManager.
            // See https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
            onClick: ()=>{}
        }
    };
}


//# sourceMappingURL=useVirtualDrop.cjs.map
