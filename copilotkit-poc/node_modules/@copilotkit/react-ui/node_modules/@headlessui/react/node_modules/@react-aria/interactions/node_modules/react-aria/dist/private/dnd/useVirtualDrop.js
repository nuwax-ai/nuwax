import {useDragSession as $e1cd17e16f360ff6$export$418e185dd3f1b968} from "./DragManager.js";
import $4s55t$intlStringsjs from "./intlStrings.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useDragModality as $a279fa400589a731$export$49bac5d6d4b352ea} from "./utils.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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




const $cd26a7e5c6184291$var$MESSAGES = {
    keyboard: 'dropDescriptionKeyboard',
    touch: 'dropDescriptionTouch',
    virtual: 'dropDescriptionVirtual'
};
function $cd26a7e5c6184291$export$62447ad3d2ec7da6() {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4s55t$intlStringsjs))), '@react-aria/dnd');
    let modality = (0, $a279fa400589a731$export$49bac5d6d4b352ea)();
    let dragSession = $e1cd17e16f360ff6$export$418e185dd3f1b968();
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(dragSession ? stringFormatter.format($cd26a7e5c6184291$var$MESSAGES[modality]) : '');
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


export {$cd26a7e5c6184291$export$62447ad3d2ec7da6 as useVirtualDrop};
//# sourceMappingURL=useVirtualDrop.js.map
