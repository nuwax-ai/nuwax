import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $Ae0XH$intlStringsmjs from "./intlStrings.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


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


function $77c29a73b36f1605$export$8cefe241bd876ca0(props) {
    let { 'aria-label': ariaLabel, ...otherProps } = props;
    let strings = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($Ae0XH$intlStringsmjs))), '@react-aria/breadcrumbs');
    return {
        navProps: {
            ...(0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(otherProps, {
                labelable: true
            }),
            'aria-label': ariaLabel || strings.format('breadcrumbs')
        }
    };
}


export {$77c29a73b36f1605$export$8cefe241bd876ca0 as useBreadcrumbs};
//# sourceMappingURL=useBreadcrumbs.mjs.map
