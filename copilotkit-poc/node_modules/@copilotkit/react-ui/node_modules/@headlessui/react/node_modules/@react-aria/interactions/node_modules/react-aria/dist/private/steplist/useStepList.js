import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import $l76nc$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useSelectableList as $1bd41fe243048d1b$export$b95089534ab7c1fd} from "../selection/useSelectableList.js";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $2abdedaec3627e1b$export$c51c7b7354499d04(props, state, ref) {
    let { 'aria-label': ariaLabel } = props;
    let { listProps: listProps } = (0, $1bd41fe243048d1b$export$b95089534ab7c1fd)({
        ...props,
        ...state,
        allowsTabNavigation: true,
        ref: ref
    });
    const strings = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($l76nc$intlStringsjs))), '@react-aria/steplist');
    const stepListProps = {
        ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(listProps, (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
            labelable: true
        })),
        'aria-label': ariaLabel || strings.format('steplist')
    };
    return {
        listProps: {
            ...stepListProps,
            tabIndex: undefined
        }
    };
}


export {$2abdedaec3627e1b$export$c51c7b7354499d04 as useStepList};
//# sourceMappingURL=useStepList.js.map
