import $3Rxt5$intlStringsmjs from "./intlStrings.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {VisuallyHidden as $ea3928288112382f$export$439d29a4e110a164} from "../visually-hidden/VisuallyHidden.mjs";
import $3Rxt5$react from "react";


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




function $081058010ef8962e$export$2317d149ed6f78c4(props) {
    let { onDismiss: onDismiss, ...otherProps } = props;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($3Rxt5$intlStringsmjs))), '@react-aria/overlays');
    let labels = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)(otherProps, stringFormatter.format('dismiss'));
    let onClick = ()=>{
        if (onDismiss) onDismiss();
    };
    return /*#__PURE__*/ (0, $3Rxt5$react).createElement((0, $ea3928288112382f$export$439d29a4e110a164), null, /*#__PURE__*/ (0, $3Rxt5$react).createElement("button", {
        ...labels,
        tabIndex: -1,
        onClick: onClick,
        style: {
            width: 1,
            height: 1
        }
    }));
}


export {$081058010ef8962e$export$2317d149ed6f78c4 as DismissButton};
//# sourceMappingURL=DismissButton.mjs.map
