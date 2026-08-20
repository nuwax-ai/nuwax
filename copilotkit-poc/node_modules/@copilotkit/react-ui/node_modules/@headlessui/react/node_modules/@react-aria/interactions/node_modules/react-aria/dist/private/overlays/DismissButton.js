import $lYlmg$intlStringsjs from "./intlStrings.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {VisuallyHidden as $6947385881e3ae0e$export$439d29a4e110a164} from "../visually-hidden/VisuallyHidden.js";
import $lYlmg$react from "react";


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




function $ae690a3ce5efb071$export$2317d149ed6f78c4(props) {
    let { onDismiss: onDismiss, ...otherProps } = props;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($lYlmg$intlStringsjs))), '@react-aria/overlays');
    let labels = (0, $93a7fe14591f425f$export$d6875122194c7b44)(otherProps, stringFormatter.format('dismiss'));
    let onClick = ()=>{
        if (onDismiss) onDismiss();
    };
    return /*#__PURE__*/ (0, $lYlmg$react).createElement((0, $6947385881e3ae0e$export$439d29a4e110a164), null, /*#__PURE__*/ (0, $lYlmg$react).createElement("button", {
        ...labels,
        tabIndex: -1,
        onClick: onClick,
        style: {
            width: 1,
            height: 1
        }
    }));
}


export {$ae690a3ce5efb071$export$2317d149ed6f78c4 as DismissButton};
//# sourceMappingURL=DismissButton.js.map
